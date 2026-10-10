// Alle Zeiten sind deutsche Ortszeit (Europe/Berlin), unabhängig vom Standort des Handys.
const TZ = 'Europe/Berlin'

export function berlinNow(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  )
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` }
}

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
export function formatDay(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  const wd = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
  return `${wd}, ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`
}

// Hängt einen Textbaustein an den Freitext an (ohne Doppelungen).
export function appendPreset(text, preset) {
  const parts = text.split(/,\s*/).map((s) => s.trim()).filter(Boolean)
  if (parts.includes(preset)) return text
  return [...parts, preset].join(', ')
}

export const DEFAULT_PRESETS = [
  'Blähung stark',
  'Blähung schwach',
  'Schleim im Hals stark',
  'Schleim im Hals schwach',
]
