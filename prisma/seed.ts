import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import 'dotenv/config'

const prisma = new PrismaClient()

function readRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required seed environment variable: ${name}`)
  }

  return value.trim()
}

async function main() {
  const name = process.env.SEED_ADMIN_NAME?.trim() || 'Admin'
  const email = readRequiredEnv('SEED_ADMIN_EMAIL').toLowerCase()
  const password = readRequiredEnv('SEED_ADMIN_PASSWORD')

  if (password.length < 6) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 6 characters')
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  })

  if (existingUser) {
    console.log(
      `Seed skipped. Admin user already exists: ${existingUser.email}`,
    )
    return
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'admin',
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  })

  console.log(`Seed created admin user: ${user.email} (${user.role})`)
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
