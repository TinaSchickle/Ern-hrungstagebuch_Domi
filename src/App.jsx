import { useCallback, useEffect, useState } from 'react'
import { deleteEntry, loadEntries, saveEntries, supabase, updateEntry } from './db.js'
import { DEFAULT_PRESETS, appendPreset, berlinNow, formatDay } from './utils.js'

const KIND_LABEL = { essen: 'Essen', beobachtung: 'Beobachtung' }

function useBerlinNow() {
  const [now, setNow] = useState(berlinNow())
  useEffect(() => {
    const t = setInterval(() => setNow(berlinNow()), 20000)
    return () => clearInterval(t)
  }, [])
  return now
}

function loadPresets() {
  try {
    const saved = JSON.parse(localStorage.getItem('etb-presets'))
    if (Array.isArray(saved) && saved.length) return saved
  } catch { /* ignorieren */ }
  return DEFAULT_PRESETS
}

export default function App() {
  const [view, setView] = useState('input')
  const [listVersion, setListVersion] = useState(0)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg, error = false) => {
    setToast({ msg, error, id: Date.now() })
  }, [])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  if (!supabase) {
    return (
      <main className="start">
        <h1>Ernährungstagebuch</h1>
        <p className="error-box">
          Supabase ist nicht konfiguriert (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY fehlen).
        </p>
      </main>
    )
  }

  const onSaved = (msg) => {
    showToast(msg)
    setListVersion((v) => v + 1)
  }

  return (
    <div className="shell">
      <header className="topbar">
        <img className="topbar-logo" src="./icons/logo.png" alt="" />
        <h1 className="topbar-title">Ernährungstagebuch</h1>
      </header>

      <main className="content">
        <h2 className="who">Eintrag für Domi</h2>

        {view === 'input' ? (
          <>
            <EntryForm kind="essen" onSaved={onSaved} showToast={showToast} />
            <EntryForm kind="beobachtung" onSaved={onSaved} showToast={showToast} />
            <button className="link-btn" onClick={() => setView('list')}>
              Meine Einträge ansehen →
            </button>
          </>
        ) : (
          <>
            <button className="link-btn" onClick={() => setView('input')}>← Zurück zur Eingabe</button>
            <EntryList version={listVersion} showToast={showToast} />
          </>
        )}
      </main>

      {toast && (
        <div className={`toast ${toast.error ? 'toast-error' : ''}`} role="status" key={toast.id}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function EntryForm({ kind, onSaved, showToast }) {
  const now = useBerlinNow()
  const [text, setText] = useState('')
  const [date, setDate] = useState(null) // null = automatisch "heute"
  const [time, setTime] = useState(null) // null = automatisch "jetzt"
  const [busy, setBusy] = useState(false)
  const [presets, setPresets] = useState(loadPresets)
  const [editPresets, setEditPresets] = useState(false)

  const shownDate = date ?? now.date
  const shownTime = time ?? now.time

  const submit = async (e) => {
    e.preventDefault()
    const clean = text.trim()
    if (!clean || busy) return
    setBusy(true)
    const cur = berlinNow()
    const entry_date = date ?? cur.date
    const entry_time = time ?? cur.time
    try {
      await saveEntries([{ kind, text: clean, entry_date, entry_time }])
      setText(''); setDate(null); setTime(null)
      onSaved(`${KIND_LABEL[kind]} erfolgreich gespeichert`)
    } catch (err) {
      showToast(`Speichern fehlgeschlagen: ${err.message}`, true)
    } finally { setBusy(false) }
  }

  const savePresets = (raw) => {
    const list = raw.split('\n').map((s) => s.trim()).filter(Boolean)
    const next = list.length ? list : DEFAULT_PRESETS
    setPresets(next)
    try { localStorage.setItem('etb-presets', JSON.stringify(next)) } catch { /* ignorieren */ }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h3>{kind === 'essen' ? '🍽️ Essen' : '🩺 Beobachtung'}</h3>

      <div className="row">
        <label className="field grow">
          <span>Datum</span>
          <input type="date" value={shownDate} onChange={(e) => setDate(e.target.value || null)} />
        </label>
        <label className="field grow">
          <span>Uhrzeit</span>
          <input type="time" value={shownTime} onChange={(e) => setTime(e.target.value || null)} />
        </label>
      </div>

      {kind === 'beobachtung' && (
        <div className="chips">
          {presets.map((p) => (
            <button type="button" key={p} className="chip" onClick={() => setText((t) => appendPreset(t, p))}>
              {p}
            </button>
          ))}
          <button type="button" className="chip chip-edit" onClick={() => setEditPresets((v) => !v)}>
            ✎
          </button>
        </div>
      )}
      {kind === 'beobachtung' && editPresets && (
        <label className="field">
          <span>Voreingaben (eine pro Zeile, nur auf diesem Gerät)</span>
          <textarea rows={5} defaultValue={presets.join('\n')} onBlur={(e) => savePresets(e.target.value)} />
        </label>
      )}

      <label className="field">
        <span>{kind === 'essen' ? 'Was hast du gegessen?' : 'Was hast du beobachtet?'}</span>
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={kind === 'essen' ? 'z. B. Haferflocken mit Banane' : 'z. B. Blähung stark'}
        />
      </label>

      <button className="btn" type="submit" disabled={busy || !text.trim()}>
        {busy ? 'Speichert …' : 'Speichern'}
      </button>
    </form>
  )
}

function EntryList({ version, showToast }) {
  const [entries, setEntries] = useState(null)
  const [filter, setFilter] = useState('alle')
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    try { setEntries(await loadEntries()) }
    catch (e) { showToast(`Laden fehlgeschlagen: ${e.message}`, true); setEntries([]) }
  }, [showToast])
  useEffect(() => { load() }, [load, version])

  if (!entries) return <p className="muted">Lädt …</p>

  const shown = entries.filter((e) => filter === 'alle' || e.kind === filter)
  const days = []
  for (const e of shown) {
    const last = days[days.length - 1]
    if (last && last.date === e.entry_date) last.items.push(e)
    else days.push({ date: e.entry_date, items: [e] })
  }

  const remove = async (e) => {
    if (!window.confirm('Eintrag löschen?')) return
    try { await deleteEntry(e.id); await load(); showToast('Eintrag gelöscht') }
    catch (err) { showToast(`Löschen fehlgeschlagen: ${err.message}`, true) }
  }

  const saveEdit = async (e, fields) => {
    try { await updateEntry(e.id, fields); setEditing(null); await load(); showToast('Änderung gespeichert') }
    catch (err) { showToast(`Speichern fehlgeschlagen: ${err.message}`, true) }
  }

  return (
    <>
      <div className="filters">
        {[['alle', 'Alle'], ['essen', 'Essen'], ['beobachtung', 'Beobachtung']].map(([k, label]) => (
          <button key={k} className={`filter ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>
            {label}
          </button>
        ))}
      </div>
      {days.length === 0 && <p className="muted">Noch keine Einträge.</p>}
      {days.map((d) => (
          <section key={d.date} className="day">
            <h3>{formatDay(d.date)}</h3>
            {d.items.map((e) =>
              editing === e.id ? (
                <EditRow key={e.id} entry={e} onSave={(f) => saveEdit(e, f)} onCancel={() => setEditing(null)} />
              ) : (
                <article key={e.id} className={`item ${e.kind}`}>
                  <div className="item-head">
                    <span className="time">{e.entry_time.slice(0, 5)}</span>
                    <span className={`badge ${e.kind}`}>{KIND_LABEL[e.kind]}</span>
                    <span className="spacer" />
                    <button className="text-btn" onClick={() => setEditing(e.id)}>Bearbeiten</button>
                    <button className="text-btn danger" onClick={() => remove(e)}>Löschen</button>
                  </div>
                  <p className="item-text">{e.text}</p>
                </article>
              )
            )}
          </section>
      ))}
    </>
  )
}

function EditRow({ entry, onSave, onCancel }) {
  const [text, setText] = useState(entry.text)
  const [date, setDate] = useState(entry.entry_date)
  const [time, setTime] = useState(entry.entry_time.slice(0, 5))
  return (
    <div className="item editing">
      <div className="row">
        <label className="field grow"><span>Datum</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label className="field grow"><span>Uhrzeit</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label>
      </div>
      <label className="field"><span>Text</span>
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} /></label>
      <div className="row">
        <button className="btn" disabled={!text.trim() || !date || !time}
          onClick={() => onSave({ text: text.trim(), entry_date: date, entry_time: time })}>
          Speichern
        </button>
        <button className="text-btn" onClick={onCancel}>Abbrechen</button>
      </div>
    </div>
  )
}
