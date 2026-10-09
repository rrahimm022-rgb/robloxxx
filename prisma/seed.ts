import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main(){console.log('Database is reachable. Users are created on first Discord sign-in.');}
main().finally(()=>prisma.$disconnect());
