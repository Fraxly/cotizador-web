import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const ABOUT_TEXT = `Dinamita is a boutique marketing and design agency combining strategy, design, and production for B2B, corporate, and institutional clients. Our team covers brand strategy, website design, presentation and corporate material design, content, and digital advertising, with a focus on clear, brand-aligned deliverables built for real-world use.

With 8 years in the market and 50+ clients served, Dinamita has delivered a wide range of projects — around 20 website builds, along with branding, social media content, and audiovisual production — across corporate, institutional, and non-profit sectors.`

const CASE_STUDIES = [
  {
    cliente: "Mecanismos de Desarrollo Alternos (MDA)",
    servicioTitulo: "Full Website Design & Development",
    descripcion: "Complete design and development of the organization's website (mda.org.pe), including a dedicated team/about section. Dinamita continues to provide ongoing website maintenance.",
    porQueComparable: "Full-cycle website design and development for an organization with multiple stakeholders and a public-facing team/partners section.",
    url: "https://mda.org.pe/",
    contactoNombre: "Daniel Coronel",
    contactoEmail: "dcoronel@mda.org.pe",
    contactoTelefono: "+51 956 943 152",
    categoria: "Desarrollo Web",
  },
  {
    cliente: "Horizonte Laboral (H-Laboral)",
    servicioTitulo: "Full Website Design & Development",
    descripcion: "Complete design and development of the organization's website (h-laboral.org). Dinamita continues to provide ongoing website maintenance.",
    porQueComparable: "Full-cycle website design and development with an institutional client, requiring brand-aligned visual communication.",
    url: "https://www.h-laboral.org/",
    contactoNombre: "Diana Wu",
    contactoEmail: "dwu@h-laboral.org",
    contactoTelefono: "+51 943 698 266",
    categoria: "Desarrollo Web",
  },
]

async function main() {
  await prisma.companyProfile.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", aboutText: ABOUT_TEXT },
  })

  for (const c of CASE_STUDIES) {
    const existing = await prisma.caseStudy.findFirst({ where: { cliente: c.cliente, servicioTitulo: c.servicioTitulo } })
    if (!existing) await prisma.caseStudy.create({ data: c })
  }

  console.log("Perfil de empresa y casos de referencia sembrados.")
}

main().catch(console.error).finally(() => prisma.$disconnect())
