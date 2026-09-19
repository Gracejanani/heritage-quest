export async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

export function saveLocalProgress(key, value) {
  localStorage.setItem(`heritageQuest:${key}`, JSON.stringify(value))
}

export function getLocalProgress(key, fallback = null) {
  try {
    const raw = localStorage.getItem(`heritageQuest:${key}`)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
