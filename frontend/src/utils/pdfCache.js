// Tiny IndexedDB store for already-rendered PDF page images.
//
// Rendering a PDF to canvas → JPEG is the slow part on mobile. We store the
// finished page images keyed by "<apiPath>:<id>" together with the server ETag
// and the render width. On re-open we can paint instantly and only re-render if
// the ETag changed (admin re-uploaded) or the screen width differs.

const DB_NAME = 'pdf-page-cache'
const STORE = 'pages'
const MAX_ENTRIES = 30 // LRU cap across all cached PDFs

function openDb() {
  return new Promise((resolve, reject) => {
    let req
    try {
      req = indexedDB.open(DB_NAME, 1)
    } catch (e) {
      reject(e)
      return
    }
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// Returns { key, etag, width, pages, ts } or null.
export async function getCachedPdf(key) {
  try {
    const db = await openDb()
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readonly')
      const r = tx.objectStore(STORE).get(key)
      r.onsuccess = () => resolve(r.result || null)
      r.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function putCachedPdf(key, etag, width, pages) {
  try {
    const db = await openDb()
    await new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put({ key, etag, width, pages, ts: Date.now() })
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
      tx.onabort = () => resolve()
    })
    await evict(db)
  } catch {
    // Quota exceeded or unsupported → cache is best-effort, ignore.
  }
}

// Keep only the MAX_ENTRIES most-recently-stored PDFs.
async function evict(db) {
  try {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const items = await new Promise((resolve) => {
      const r = store.getAll()
      r.onsuccess = () => resolve(r.result || [])
      r.onerror = () => resolve([])
    })
    if (items.length <= MAX_ENTRIES) return
    items.sort((a, b) => (a.ts || 0) - (b.ts || 0))
    items.slice(0, items.length - MAX_ENTRIES).forEach((it) => store.delete(it.key))
  } catch {
    // ignore
  }
}
