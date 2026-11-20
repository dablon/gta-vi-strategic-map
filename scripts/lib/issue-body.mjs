// Parseo del cuerpo de un issue "pin-suggestion": acepta el bloque ```json que
// genera la app y las secciones "### ..." del template de GitHub.
// OJO: las expresiones regulares construidas con RegExp usan doble backslash;
// un \s dentro de template literal se convierte en "s" y silenciaría los campos.
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function parseIssueBody(body) {
  const text = body ?? ''
  const fenced = /```json\s*([\s\S]*?)```/.exec(text)
  if (fenced) {
    try {
      const parsed = JSON.parse(fenced[1])
      if (parsed && typeof parsed === 'object' && parsed.name && parsed.category) return parsed
    } catch {
      // sigue al parser de formulario
    }
  }
  const section = (label) => {
    const re = new RegExp(
      `^###\\s+${esc(label)}[^\\r\\n]*\\s*\\r?\\n+([\\s\\S]*?)(?=\\r?\\n###|\\r?\\n---|$)`,
      'im',
    )
    const m = re.exec(text)
    return m ? m[1].trim() : ''
  }
  const num = (s) => (s.trim() === '' ? NaN : Number(s))

  const name = section('Nombre') || section('Name')
  const category = section('Categor') || section('Category')
  const wx = num(section('Coordenada wx') || section('wx'))
  const wy = num(section('Coordenada wy') || section('wy'))
  if (!name || !category || !Number.isFinite(wx) || !Number.isFinite(wy)) return null

  const notes = section('Notas') || section('Notes')
  const area = section('Barrio') || section('area')
  return { name, category, wx, wy, area: area || undefined, notes: notes || undefined }
}
