import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
export const runtime='nodejs';
const allowed: Record<string,string[]>={Decal:['image/png','image/jpeg'],Audio:['audio/mpeg','audio/ogg','audio/wav','audio/x-wav'],Model:['application/octet-stream','model/fbx'],MeshPart:['application/octet-stream','model/obj','model/gltf-binary','model/gltf+json']};
export async function POST(req:Request){
 const user=await getCurrentUser();if(!user)return NextResponse.redirect(new URL('/',req.url));
 const key=process.env.ROBLOX_API_KEY,creatorId=process.env.ROBLOX_CREATOR_ID,creatorType=process.env.ROBLOX_CREATOR_TYPE==='group'?'groupId':'userId';
 if(!key||!creatorId)return NextResponse.json({error:'Configure ROBLOX_API_KEY and ROBLOX_CREATOR_ID in Vercel environment variables first.'},{status:503});
 const form=await req.formData();const name=String(form.get('name')??'').trim(),description=String(form.get('description')??'').trim(),assetType=String(form.get('assetType')??''),file=form.get('file');
 if(!name||name.length>50||description.length>1000||!(file instanceof File))return NextResponse.json({error:'Invalid name, description, or file.'},{status:400});
 const maxMB=Math.min(20,Math.max(1,Number(process.env.MAX_UPLOAD_MB||20)));if(file.size===0||file.size>maxMB*1024*1024)return NextResponse.json({error:`File must be between 1 byte and ${maxMB} MB.`},{status:413});
 if(!allowed[assetType]||!allowed[assetType].includes(file.type))return NextResponse.json({error:'This file type is not accepted for the selected asset type. Check the official Roblox supported-type list.'},{status:415});
 const cost=5;const charged=await prisma.$transaction(async tx=>{const result=await tx.user.updateMany({where:{id:user.id,tokens:{gte:cost}},data:{tokens:{decrement:cost}}});if(!result.count)return false;await tx.tokenLedger.create({data:{userId:user.id,amount:-cost,reason:`Upload ${assetType}: ${name}`}});return true;});
 if(!charged)return NextResponse.json({error:'Not enough credits.'},{status:402});
 try{
  const requestPayload={assetType,displayName:name,description,creationContext:{creator:{[creatorType]:creatorId}}};
  const body=new FormData();body.append('request',new Blob([JSON.stringify(requestPayload)],{type:'application/json'}));body.append('fileContent',file,file.name);
  const response=await fetch('https://apis.roblox.com/assets/v1/assets',{method:'POST',headers:{'x-api-key':key},body,signal:AbortSignal.timeout(45000)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok){await prisma.$transaction([prisma.user.update({where:{id:user.id},data:{tokens:{increment:cost}}}),prisma.tokenLedger.create({data:{userId:user.id,amount:cost,reason:'Refund: Roblox upload failed'}})]);return NextResponse.json({error:data?.message||`Roblox API returned ${response.status}. Check API key permissions, creator access, and supported file types.`},{status:502});}
  const assetId=String(data?.assetId??data?.response?.assetId??'');
  await prisma.assetRecord.create({data:{userId:user.id,assetId:assetId||null,name,description,assetType,fileName:file.name,status:data?.path?'submitted':'accepted'}});
  return NextResponse.redirect(new URL('/dashboard?upload=success',req.url),303);
 }catch(e){await prisma.$transaction([prisma.user.update({where:{id:user.id},data:{tokens:{increment:cost}}}),prisma.tokenLedger.create({data:{userId:user.id,amount:cost,reason:'Refund: upload request error'}})]);return NextResponse.json({error:'Could not reach Roblox Open Cloud. Credits refunded. Try again later.'},{status:502});}
}
