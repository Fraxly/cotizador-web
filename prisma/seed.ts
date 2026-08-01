import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const email = "efrain@disruptiva.pe"
  const existing = await prisma.user.findUnique({ where: { email } })

  if (!existing) {
    const password = await bcrypt.hash("admin123", 10)
    await prisma.user.create({
      data: {
        email,
        password,
        name: "Efraín",
      },
    })
    console.log(`Usuario creado: ${email}`)
  } else {
    console.log(`Usuario ya existe: ${email}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
