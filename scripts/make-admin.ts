import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.user.update({
    where: { email: 'codentia01@gmail.com' },
    data:  { role: 'ADMIN' },
  })
  console.log('✅ Done! You are now an admin.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())