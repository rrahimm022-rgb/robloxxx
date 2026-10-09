import Link from 'next/link';
import { auth } from '@/auth';
import { signIn, signOut } from '@/auth';
export default async function Nav() { const session = await auth(); return <header className="nav"><Link className="brand" href="/">ASSET<span>FORGE</span></Link><nav className="navlinks"><Link href="/#features">Features</Link><Link href="/dashboard">Workspace</Link>{session?.user ? <form action={async()=>{'use server';await signOut({redirectTo:'/'});}}><button className="btn" type="submit">Sign out</button></form> : <form action={async()=>{'use server';await signIn('discord',{redirectTo:'/dashboard'});}}><button className="btn primary" type="submit">◈ Continue with Discord</button></form>}</nav></header>; }
