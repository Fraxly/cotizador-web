export interface QuoteItem {
  und: number
  concepto: string
  valor: number
}

export interface DetalleSeccion {
  titulo: string
  bullets?: string[]
  imagenes?: string[]
}

export interface QuoteData {
  numero_propuesta: string
  cliente: string
  atencion: string
  emitido: string
  fecha_corta: string
  anio: string
  moneda: "PEN" | "USD"
  idioma?: "es" | "en"
  intro: string
  items: QuoteItem[]
  detalle: DetalleSeccion[]
  tiempo_produccion?: string
  condiciones_pago: string[]
  transferencia?: "pen" | "usd_local" | "internacional"
  aplica_igv?: boolean
  contacto_dinamita?: "efrain" | "nicolas"
}
