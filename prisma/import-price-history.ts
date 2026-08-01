import { PrismaClient } from "@prisma/client"
import { parse } from "csv-parse/sync"
import fs from "fs"

const CSV_PATH = "C:\\Personal\\3 - Python proyectos\\5 - DB cotizaciones\\cotizaciones_dinamita.csv"

const prisma = new PrismaClient()

interface Row {
  numero_propuesta: string
  fecha: string
  cliente: string
  categoria_servicio: string
  concepto: string
  und: string
  valor_unitario: string
  moneda: string
  tiempo_produccion: string
  condiciones_pago: string
  descripcion_breve: string
}

async function main() {
  const raw = fs.readFileSync(CSV_PATH, "utf-8").replace(/^\uFEFF/, "")
  const rows: Row[] = parse(raw, { columns: true, skip_empty_lines: true })

  await prisma.priceReference.deleteMany()

  await prisma.priceReference.createMany({
    data: rows.map(r => ({
      numeroPropuesta: r.numero_propuesta,
      fecha: r.fecha,
      cliente: r.cliente,
      categoria: r.categoria_servicio,
      concepto: r.concepto,
      und: parseFloat(r.und) || 0,
      valorUnitario: parseFloat(r.valor_unitario) || 0,
      moneda: r.moneda,
      tiempoProduccion: r.tiempo_produccion || null,
      condicionesPago: r.condiciones_pago || null,
      descripcion: r.descripcion_breve || null,
    })),
  })

  console.log(`Importadas ${rows.length} líneas de precios históricos.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
