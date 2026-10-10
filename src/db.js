import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && key ? createClient(url, key) : null

function check({ data, error }) {
  if (error) throw new Error(error.message)
  return data
}

export async function saveEntries(rows) {
  check(await supabase.from('etb_entries').insert(rows))
}

export async function loadEntries() {
  return check(
    await supabase
      .from('etb_entries')
      .select('*')
      .order('entry_date', { ascending: false })
      .order('entry_time', { ascending: false })
      .limit(1000)
  )
}

export async function updateEntry(id, fields) {
  check(await supabase.from('etb_entries').update(fields).eq('id', id))
}

export async function deleteEntry(id) {
  check(await supabase.from('etb_entries').delete().eq('id', id))
}
