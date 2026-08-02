import type { QualificationsState } from "./ai-qualifications"

const TEXTOS = {
  es: {
    titulo_doc: "Calificaciones, Proyectos Comparables y Términos",
    seccion_empresa: "Sobre Dinamita",
    seccion_casos: "Proyectos Comparables",
    seccion_terminos: "Términos y Condiciones Estándar",
    por_que_label: "Por qué es comparable:",
    referencia_label: "Referencia:",
  },
  en: {
    titulo_doc: "Qualifications, Comparable Projects & Terms",
    seccion_empresa: "About Dinamita",
    seccion_casos: "Comparable Projects",
    seccion_terminos: "Standard Terms & Conditions",
    por_que_label: "Why it's comparable:",
    referencia_label: "Reference:",
  },
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function paragraphs(text: string): string {
  return text.split(/\n\s*\n/).map(p => `<p>${escapeHtml(p.trim())}</p>`).join("\n")
}

export function renderQualificationsHtml(data: QualificationsState): string {
  const t = TEXTOS[data.idioma] || TEXTOS.es

  return `<!doctype html>
<html lang="${data.idioma || "es"}">
<head>
<meta charset="utf-8">
<title>${t.titulo_doc}</title>
<style>
@font-face { font-family: "Neue Montreal"; src: url("/assets/fonts/NeueMontreal-Regular.otf") format("opentype"); font-weight: 400; }
@font-face { font-family: "Neue Montreal"; src: url("/assets/fonts/NeueMontreal-Bold.otf") format("opentype"); font-weight: 700; }
@font-face { font-family: "Outfit"; src: url("/assets/fonts/Outfit-Regular.ttf") format("truetype"); font-weight: 400; }
@font-face { font-family: "Outfit"; src: url("/assets/fonts/Outfit-SemiBold.ttf") format("truetype"); font-weight: 600; }

:root { --rojo: #f81c38; --lila: #9568ef; --negro: #000000; }
* { box-sizing: border-box; }
@page { size: 210mm 297mm; margin: 22mm 18mm 18mm; }
body { margin: 0; font-family: "Outfit", sans-serif; font-size: 10pt; line-height: 1.55; color: var(--negro); }

.encabezado { display: flex; align-items: center; gap: 4mm; margin-bottom: 4mm; }
.encabezado img { height: 9mm; }
.subtitulo { font-size: 9pt; color: #555; font-style: italic; margin: 0 0 10mm; border-bottom: 0.75pt solid #ddd; padding-bottom: 6mm; }

h2 {
  font-family: "Neue Montreal", sans-serif; font-weight: 700; font-size: 12.5pt;
  margin: 9mm 0 3mm; padding-top: 2mm; border-top: 2pt solid var(--lila);
}
h2:first-of-type { border-top: none; padding-top: 0; margin-top: 0; }
h3 { font-family: "Neue Montreal", sans-serif; font-weight: 700; font-size: 10.5pt; margin: 5mm 0 1.5mm; }
p { margin: 0 0 3mm; }
ul { margin: 0 0 3mm; padding-left: 5mm; }
li { margin-bottom: 1.5mm; }
a { color: var(--lila); text-decoration: none; }
.proyecto { margin-bottom: 6mm; break-inside: avoid; }
.ref { font-size: 9.3pt; color: #333; }
</style>
</head>
<body>

<div class="encabezado">
  <img src="/assets/logos/Logo Negro Dinamita@4x-8.png">
</div>
<p class="subtitulo">${escapeHtml(data.subtitulo)}</p>

<h2>${t.seccion_empresa}</h2>
${paragraphs(data.about_text)}

<h2>${t.seccion_casos}</h2>
${data.casos.map(c => `
<div class="proyecto">
  <h3>${escapeHtml(c.cliente)} — ${escapeHtml(c.servicio_titulo)}</h3>
  <p>${escapeHtml(c.descripcion)}</p>
  ${c.por_que_comparable ? `<p><b>${t.por_que_label}</b> ${escapeHtml(c.por_que_comparable)}</p>` : ""}
  ${(c.contacto_nombre || c.url) ? `<p class="ref">
    ${c.contacto_nombre ? `<b>${t.referencia_label}</b> ${escapeHtml(c.contacto_nombre)}${c.contacto_email ? ` — ${escapeHtml(c.contacto_email)}` : ""}${c.contacto_telefono ? ` — ${escapeHtml(c.contacto_telefono)}` : ""}` : ""}
    ${c.url ? `<br><a href="${escapeHtml(c.url)}">${escapeHtml(c.url)}</a>` : ""}
  </p>` : ""}
</div>`).join("")}

<h2>${t.seccion_terminos}</h2>
<ul>
  ${data.terminos.map(term => `<li>${escapeHtml(term)}</li>`).join("")}
</ul>

</body>
</html>`
}
