import type { QuoteData } from "./types"

const TEXTOS: Record<string, Record<string, string>> = {
  es: {
    portada_linea1: "Propuesta", portada_linea2: "comercial",
    cliente_label: "Cliente:", atencion_label: "Atención:", emitido_label: "Emitido:",
    col_und: "Und.", col_concepto: "Concepto", col_valor: "Valor", col_total: "Total",
    subtotal: "Subtotal", igv: "IGV (18%)", total: "Total",
    nota_moneda: "*Cotización realizada en", moneda_pen: "Soles (S/)", moneda_usd: "Dólares (US$)",
    propuesta_titulo: "Propuesta",
    tiempo_produccion_titulo: "Tiempo de producción",
    datos_bancarios_titulo: "Datos bancarios:",
    razon_social_label: "Razón social:", ruc_label: "Ruc:",
    nombre_label: "Nombre:", numero_cuenta_label: "Número de cuenta:",
    cci_label: "Código de cuenta interbancaria (CCI):",
    detraccion_label: "Cuenta de detracción del banco de la nación:",
    swift_label: "SWIFT:",
    condiciones_pago_titulo: "CONDICIONES DE PAGO:",
    footer_titulo: "Propuesta comercial",
  },
  en: {
    portada_linea1: "Commercial", portada_linea2: "Proposal",
    cliente_label: "Client:", atencion_label: "Attention:", emitido_label: "Issued:",
    col_und: "Qty.", col_concepto: "Description", col_valor: "Unit Price", col_total: "Total",
    subtotal: "Subtotal", igv: "VAT (18%)", total: "Total",
    nota_moneda: "*Quote issued in", moneda_pen: "Peruvian Soles (S/)", moneda_usd: "US Dollars (US$)",
    propuesta_titulo: "Proposal",
    tiempo_produccion_titulo: "Production Timeline",
    datos_bancarios_titulo: "Banking Details:",
    razon_social_label: "Legal Name:", ruc_label: "Tax ID (RUC):",
    nombre_label: "Account Name:", numero_cuenta_label: "Account Number:",
    cci_label: "Interbank Account Code (CCI):",
    detraccion_label: "Banco de la Nación Detraction Account:",
    swift_label: "SWIFT:",
    condiciones_pago_titulo: "PAYMENT TERMS:",
    footer_titulo: "Commercial Proposal",
  },
}

const SIMBOLOS: Record<string, string> = { PEN: "S/", USD: "US$" }

function fmt(monto: number): string {
  monto = Math.round(monto * 100) / 100
  if (monto === Math.floor(monto)) return monto.toLocaleString("en-US")
  return monto.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function calcularSubtotal(items: { und: number; valor: number }[]) {
  return items.reduce((s, it) => s + it.und * it.valor, 0)
}

const ALTO_UTIL_PAGINA_MM = 225
const CHARS_POR_LINEA = 95

function alturaSeccionMm(sec: { bullets?: string[]; imagenes?: string[] }): number {
  let alto = 10 + 6 + 6 + 5
  for (const b of sec.bullets || []) {
    const lineas = Math.max(1, Math.ceil(b.length / CHARS_POR_LINEA))
    alto += lineas * 5.0
  }
  if (sec.imagenes?.length) alto += 45
  return alto
}

interface _Seccion { titulo: string; bullets?: string[]; imagenes?: string[] }

function paginarDetalle(detalle: _Seccion[]): _Seccion[][] {
  const paginas: _Seccion[][] = []
  let actual: _Seccion[] = []
  let acumulado = 0
  for (const sec of detalle) {
    const alto = alturaSeccionMm(sec)
    if (actual.length && acumulado + alto > ALTO_UTIL_PAGINA_MM) {
      paginas.push(actual)
      actual = []
      acumulado = 0
    }
    actual.push(sec)
    acumulado += alto
  }
  if (actual.length) paginas.push(actual)
  return paginas
}

export function renderQuoteHtml(data: QuoteData): string {
  const t = TEXTOS[data.idioma || "es"] || TEXTOS.es
  const moneda = data.moneda || "PEN"
  const simbolo = SIMBOLOS[moneda] || moneda
  const aplicaIgv = data.aplica_igv ?? moneda === "PEN"
  const subtotal = calcularSubtotal(data.items)
  const igv = aplicaIgv ? subtotal * 0.18 : 0
  const total = subtotal + igv
  const detallePaginas = paginarDetalle(data.detalle || [])

  const banco = elegirBanco(data)

  const muescas = data.condiciones_pago.map((_, i) =>
    `<span class="muesca" style="left:${(100 / (data.condiciones_pago.length + 1) * (i + 1)).toFixed(2)}%"></span>`
  ).join("")

  return `<!doctype html>
<html lang="${data.idioma || "es"}">
<head>
<meta charset="utf-8">
<title>Propuesta comercial</title>
<style>
@font-face { font-family: "Brigends Expanded"; src: url("/assets/fonts/brigendsexpanded-nrek1.otf") format("opentype"); font-weight: 700; }
@font-face { font-family: "Neue Montreal"; src: url("/assets/fonts/NeueMontreal-Regular.otf") format("opentype"); font-weight: 400; }
@font-face { font-family: "Neue Montreal"; src: url("/assets/fonts/NeueMontreal-Bold.otf") format("opentype"); font-weight: 700; }
@font-face { font-family: "Outfit"; src: url("/assets/fonts/Outfit-Light.ttf") format("truetype"); font-weight: 300; }
@font-face { font-family: "Outfit"; src: url("/assets/fonts/Outfit-Regular.ttf") format("truetype"); font-weight: 400; }
@font-face { font-family: "Outfit"; src: url("/assets/fonts/Outfit-Medium.ttf") format("truetype"); font-weight: 500; }
@font-face { font-family: "Outfit"; src: url("/assets/fonts/Outfit-SemiBold.ttf") format("truetype"); font-weight: 600; }
@font-face { font-family: "Outfit"; src: url("/assets/fonts/Outfit-Bold.ttf") format("truetype"); font-weight: 700; }
:root { --rojo: #f81c38; --lila: #9568ef; --negro: #000000; --blanco: #ffffff; }
* { box-sizing: border-box; }
@page { size: 210mm 297mm; margin: 0; }
html, body { margin: 0; padding: 0; font-family: "Outfit", sans-serif; color: var(--negro); }
.page { width: 210mm; height: 297mm; position: relative; overflow: hidden; page-break-after: always; padding: 14mm 16mm; }
.page:last-child { page-break-after: auto; }
.page.oscura { background: var(--negro); color: var(--blanco); }
.page.clara { background: var(--blanco); color: var(--negro); }
.isotipo-esquina { position: absolute; top: 12mm; right: 14mm; width: 11mm; height: auto; }
.hud-corner { position: absolute; top: 9mm; left: 16mm; right: 16mm; height: 0.35pt; background: currentColor; opacity: .55; }
.hud-corner::after { content: ""; position: absolute; top: 0; left: 0; width: 0.35pt; height: 6mm; background: currentColor; }
.footer-block { position: absolute; bottom: 10mm; left: 16mm; right: 16mm; }
.footer-rule { position: relative; height: 0.35pt; background: currentColor; opacity: .55; }
.footer-rule .muesca { position: absolute; top: -1.5mm; width: 0.35pt; height: 3mm; background: currentColor; }
.footer-text { display: flex; justify-content: space-between; padding-top: 2.8mm; font-family: "Outfit", sans-serif; font-size: 8.3pt; font-weight: 500; letter-spacing: .02em; }
.titular { font-family: "Brigends Expanded", sans-serif; font-weight: 700; text-transform: uppercase; line-height: 0.78; letter-spacing: -.01em; }
.portada { padding: 0; }
.portada .fondo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.portada { color: var(--blanco); }
.tarjeta-wrap { position: absolute; left: 16mm; bottom: 26mm; width: 148mm; height: 81.24mm; }
.tarjeta-glass { position: absolute; top: 0; left: 0; width: 463.48px; height: 254.34px; transform-origin: top left; transform: scale(1.2069); background: rgba(4,4,7,.8); backdrop-filter: blur(52px) saturate(190%); -webkit-backdrop-filter: blur(52px) saturate(190%); clip-path: path("M451.74,254.33H11.74c-6.47,0-11.74-5.27-11.74-11.74V11.74c0-6.47,5.27-11.74,11.74-11.74h175.24c.14,0,.35,0,.61-.02,2.27-.1,8.32-.37,10.79,3.47,2.77,4.32,10.91,18.76,15.28,26.52.9,1.59,1.62,2.87,2.08,3.69.37.66.74,1.34,1.11,2.04,2.12,3.96,4.3,8.06,8.76,9.06l.12.03c.34.08.73.17,1.06.17h224.94c6.47,0,11.74,5.27,11.74,11.74v185.9c0,6.47-5.27,11.74-11.74,11.74Z"); }
.tarjeta-borde { position: absolute; top: 0; left: 0; }
.logo-carpeta { position: absolute; top: 4.2mm; left: 8mm; height: 8.5mm; }
.tarjeta-texto { position: absolute; top: 14.36mm; bottom: 8mm; left: 11mm; right: 11mm; display: flex; flex-direction: column; justify-content: center; transform: translateY(2.5mm); }
.tarjeta-texto .titular { font-size: 34pt; color: var(--blanco); margin: 0 0 6mm; }
.tarjeta-texto .cliente-label { font-size: 10pt; font-weight: 400; }
.tarjeta-texto .cliente-nombre { font-size: 13pt; font-weight: 700; display: block; }
.meta { list-style: none; padding: 0; margin: 22mm 0 6mm; }
.meta li { margin-bottom: 2mm; font-size: 10.5pt; }
.meta li::before { content: "\\2731  "; color: var(--lila); }
.meta b { font-family: "Neue Montreal", sans-serif; font-weight: 700; }
.intro-texto { font-family: "Neue Montreal", sans-serif; font-size: 11pt; line-height: 1.4; margin: 4mm 0 8mm; max-width: 160mm; }
table.tabla-cotizacion { width: 100%; border-collapse: collapse; border: 1.2px solid var(--negro); border-radius: 4mm; overflow: hidden; font-size: 10pt; }
table.tabla-cotizacion th { font-family: "Neue Montreal", sans-serif; font-weight: 700; text-align: left; padding: 5.5mm 5mm; border-bottom: 1px solid var(--negro); }
table.tabla-cotizacion th:first-child { text-align: center; width: 18mm; }
table.tabla-cotizacion th:nth-child(3), table.tabla-cotizacion th:nth-child(4) { text-align: right; width: 26mm; white-space: nowrap; }
table.tabla-cotizacion td:nth-child(3), table.tabla-cotizacion td:nth-child(4) { white-space: nowrap; }
table.tabla-cotizacion td { padding: 5.2mm 5mm; border-bottom: 1px solid #d9d9d9; }
table.tabla-cotizacion td:first-child { text-align: center; }
table.tabla-cotizacion td:nth-child(3), table.tabla-cotizacion td:nth-child(4) { text-align: right; }
table.tabla-cotizacion tr:last-child td { border-bottom: none; }
.totales { width: 60mm; margin-left: auto; margin-top: 6mm; font-size: 10.5pt; }
.totales .fila { display: flex; justify-content: space-between; padding: 2.2mm 0; border-bottom: 1px solid #d9d9d9; }
.totales .fila.total { border-bottom: none; font-weight: 700; font-size: 13pt; }
.totales .fila.total .valor { color: var(--lila); }
.totales .fila b { font-family: "Neue Montreal", sans-serif; }
.nota-moneda { font-size: 8.5pt; font-style: italic; text-align: right; margin-top: 3mm; opacity: .8; }
.detalle-titulo { font-size: 22pt; margin: 6mm 0 8mm; }
.caja { border: 1.2px solid var(--blanco); border-radius: 5mm; padding: 6mm 8mm; margin-bottom: 5mm; break-inside: avoid; }
.caja h3 { font-family: "Neue Montreal", sans-serif; font-weight: 700; font-size: 12pt; margin: 0 0 2.5mm; }
.caja ul { list-style: none; margin: 0; padding: 0; }
.caja li { font-family: "Outfit", sans-serif; font-size: 9.3pt; line-height: 1.5; padding-left: 4mm; position: relative; }
.caja li::before { content: "\\2731"; color: var(--lila); position: absolute; left: 0; }
.caja .imagenes { display: flex; gap: 4mm; flex-wrap: wrap; margin-top: 2mm; }
.caja .imagenes img { width: 70mm; border-radius: 3mm; object-fit: cover; }
.caja-produccion { display: inline-block; min-width: 80mm; }
.caja-bancaria { display: flex; justify-content: space-between; gap: 8mm; }
.caja-bancaria .datos { flex: 1 1 auto; font-size: 8.7pt; line-height: 2; }
.caja-bancaria .datos b { font-family: "Neue Montreal", sans-serif; }
.caja-bancaria .condiciones { flex: 0 0 78mm; font-size: 8.5pt; text-align: right; }
.caja-bancaria .condiciones h4 { font-family: "Neue Montreal", sans-serif; font-size: 9.5pt; margin: 0 0 2mm; }
.caja-bancaria .condiciones p { margin: 0.6mm 0; }
</style>
</head>
<body>

<div class="page portada">
  <img class="fondo" src="/assets/PORTADA-PROP-COMERCIAL.png">
  <div class="hud-corner"></div>
  <img class="isotipo-esquina" src="/assets/logos/Isotipo blanco Dinamita@4x-8.png">
  <div class="tarjeta-wrap">
    <div class="tarjeta-glass"></div>
    <svg class="tarjeta-borde" viewBox="0 0 463.48 254.34" width="148mm" height="81.24mm" preserveAspectRatio="none">
      <path d="M451.74,254.33H11.74c-6.47,0-11.74-5.27-11.74-11.74V11.74c0-6.47,5.27-11.74,11.74-11.74h175.24c.14,0,.35,0,.61-.02,2.27-.1,8.32-.37,10.79,3.47,2.77,4.32,10.91,18.76,15.28,26.52.9,1.59,1.62,2.87,2.08,3.69.37.66.74,1.34,1.11,2.04,2.12,3.96,4.3,8.06,8.76,9.06l.12.03c.34.08.73.17,1.06.17h224.94c6.47,0,11.74,5.27,11.74,11.74v185.9c0,6.47-5.27,11.74-11.74,11.74Z" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="1"/>
    </svg>
    <img class="logo-carpeta" src="/assets/logos/Logo Blanco Dinamita_2@4x-8.png">
    <div class="tarjeta-texto">
      <p class="titular">${t.portada_linea1}<br>${t.portada_linea2}</p>
      <span class="cliente-label">${t.cliente_label}</span>
      <span class="cliente-nombre">${data.cliente}</span>
    </div>
  </div>
  <div class="footer-block">
    <div class="footer-rule">${muescas}</div>
    <div class="footer-text"><span>${t.footer_titulo}</span><span>${data.fecha_corta}</span><span>©${data.anio}</span></div>
  </div>
</div>

<div class="page clara">
  <div class="hud-corner"></div>
  <img class="isotipo-esquina" src="/assets/logos/Isotipo negro Dinamita@4x-8.png">
  <ul class="meta">
    <li><b>${t.atencion_label}</b> ${data.atencion}</li>
    <li><b>${t.emitido_label}</b> ${data.emitido}</li>
  </ul>
  <p class="intro-texto">${data.intro}</p>

  <table class="tabla-cotizacion">
    <thead>
      <tr><th>${t.col_und}</th><th>${t.col_concepto}</th><th>${t.col_valor}</th><th>${t.col_total}</th></tr>
    </thead>
    <tbody>
      ${data.items.map(it => `
      <tr>
        <td>${it.und}</td>
        <td>${it.concepto}</td>
        <td>${simbolo} ${fmt(it.valor)}</td>
        <td>${simbolo} ${fmt(it.und * it.valor)}</td>
      </tr>`).join("")}
    </tbody>
  </table>

  <div class="totales">
    <div class="fila"><span><b>${t.subtotal}</b></span><span class="valor">${simbolo} ${fmt(subtotal)}</span></div>
    ${aplicaIgv ? `<div class="fila"><span><b>${t.igv}</b></span><span class="valor">${simbolo} ${fmt(igv)}</span></div>` : ""}
    <div class="fila total"><span>${t.total}</span><span class="valor">${simbolo} ${fmt(total)}</span></div>
  </div>
  <p class="nota-moneda">${t.nota_moneda} ${moneda === "PEN" ? t.moneda_pen : t.moneda_usd}</p>

  <div class="footer-block">
    <div class="footer-rule"></div>
    <div class="footer-text"><span>${t.footer_titulo}</span><span>©${data.anio}</span></div>
  </div>
</div>

${detallePaginas.map(pagina => `
<div class="page oscura">
  <div class="hud-corner"></div>
  <img class="isotipo-esquina" src="/assets/logos/Isotipo blanco Dinamita@4x-8.png">
  <p class="titular detalle-titulo">${t.propuesta_titulo}</p>

  ${pagina.map(sec => `
  <div class="caja">
    <h3>${sec.titulo}</h3>
    ${sec.bullets?.length ? `<ul>${sec.bullets.map(b => `<li>${b}</li>`).join("")}</ul>` : ""}
    ${sec.imagenes?.length ? `<div class="imagenes">${sec.imagenes.map(img => `<img src="${img}">`).join("")}</div>` : ""}
  </div>`).join("")}

  <div class="footer-block">
    <div class="footer-rule"></div>
    <div class="footer-text"><span>${t.footer_titulo}</span><span>©${data.anio}</span></div>
  </div>
</div>`).join("")}

<div class="page oscura">
  <div class="hud-corner"></div>
  <img class="isotipo-esquina" src="/assets/logos/Isotipo blanco Dinamita@4x-8.png">
  <p class="titular detalle-titulo">${t.propuesta_titulo}</p>

  ${data.tiempo_produccion ? `
  <div class="caja caja-produccion">
    <h3>${t.tiempo_produccion_titulo}</h3>
    <ul><li>${data.tiempo_produccion}</li></ul>
  </div>` : ""}

  <div class="caja caja-bancaria">
    <div class="datos">
      <h3>${t.datos_bancarios_titulo}</h3>
      <b>${t.razon_social_label}</b> ${banco.razon_social}. ${t.ruc_label} ${banco.ruc}<br>
      <b>${banco.banco_nombre}</b><br>
      <b>${t.nombre_label}</b> ${banco.titular}<br>
      <b>${t.numero_cuenta_label}</b> ${banco.numero_cuenta}<br>
      ${banco.tipo === "internacional"
        ? `<b>${t.swift_label}</b> ${banco.swift}`
        : `<b>${t.cci_label}</b><br>${banco.cci}<br>
           <b>${t.detraccion_label}</b><br>${banco.detraccion}`
      }
    </div>
    <div class="condiciones">
      <h4>${t.condiciones_pago_titulo}</h4>
      ${data.condiciones_pago.map(c => `<p>${c}</p>`).join("")}
    </div>
  </div>

  <div class="footer-block">
    <div class="footer-rule"></div>
    <div class="footer-text"><span>${t.footer_titulo}</span><span>©${data.anio}</span></div>
  </div>
</div>

</body>
</html>`
}

const DATOS_BANCARIOS_PEN = {
  tipo: "local" as const,
  razon_social: "Disruptiva S.A.C",
  ruc: "20602998089",
  banco_nombre: "BCP - CUENTA CORRIENTE SOLES",
  titular: "Disruptiva S.A.C",
  numero_cuenta: "194-2501479-0-63",
  cci: "00219400250147906395",
  detraccion: "00-058-318760",
}

const DATOS_BANCARIOS_USD_LOCAL = {
  tipo: "local" as const,
  razon_social: "Disruptiva S.A.C",
  ruc: "20602998089",
  banco_nombre: "BCP - CUENTA CORRIENTE DÓLARES",
  titular: "Disruptiva S.A.C",
  numero_cuenta: "194-2600095-1-95",
  cci: "00219400260009519599",
  detraccion: "00-058-318760",
}

const DATOS_BANCARIOS_INTERNACIONAL = {
  tipo: "internacional" as const,
  razon_social: "Disruptiva S.A.C",
  ruc: "20602998089",
  banco_nombre: "Banco de Crédito del Perú (BCP)",
  titular: "Disruptiva S.A.C",
  numero_cuenta: "194-2600095-1-95",
  swift: "BCPLPEPL",
}

function elegirBanco(data: QuoteData) {
  const t = data.transferencia
  if (t === "pen") return DATOS_BANCARIOS_PEN
  if (t === "usd_local") return DATOS_BANCARIOS_USD_LOCAL
  if (t === "internacional") return DATOS_BANCARIOS_INTERNACIONAL
  return data.moneda === "PEN" ? DATOS_BANCARIOS_PEN : DATOS_BANCARIOS_INTERNACIONAL
}
