// Durable storage for admin edits (photos, descriptions, fees, visibility).
//
// Render's free disk is wiped on every restart, so edits are committed to a separate "data" branch of
// the GitHub repo (Render and GitHub Pages only deploy "main", so saving never restarts the site).
// Photos are served from jsDelivr using the exact commit, so a new photo is live right after saving.
//
// Needs GITHUB_TOKEN (fine-grained token, Contents: read and write on the repo) in Render.

const REPO = process.env.GITHUB_REPO || 'rafars1978-design/arvacaciones-web'
const TOKEN = process.env.GITHUB_TOKEN || ''
const BRANCH = 'data'
const API = 'https://api.github.com'

export const storeEnabled = () => Boolean(TOKEN)

const gh = (path, options = {}) => fetch(`${API}${path}`, {
  ...options,
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'arvacaciones-api',
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }
})

let branchReady = false
const ensureBranch = async () => {
  if (branchReady) return
  const found = await gh(`/repos/${REPO}/git/ref/heads/${BRANCH}`)
  if (found.status === 200) { branchReady = true; return }
  if (found.status !== 404) throw new Error(`GitHub (${found.status}) al revisar la rama de datos.`)
  const main = await (await gh(`/repos/${REPO}/git/ref/heads/main`)).json()
  const created = await gh(`/repos/${REPO}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${BRANCH}`, sha: main.object.sha })
  })
  if (!created.ok && created.status !== 422) throw new Error(`GitHub (${created.status}) al crear la rama de datos.`)
  branchReady = true
}

let cache = { at: 0, data: {}, sha: null }
const CACHE_MS = 60 * 1000

export const loadOverrides = async (force = false) => {
  if (!force && cache.at && Date.now() - cache.at < CACHE_MS) return cache.data
  try {
    if (TOKEN) {
      const r = await gh(`/repos/${REPO}/contents/overrides.json?ref=${BRANCH}`)
      if (r.status === 200) {
        const j = await r.json()
        cache = { at: Date.now(), data: JSON.parse(Buffer.from(j.content, 'base64').toString('utf8')), sha: j.sha }
        return cache.data
      }
      if (r.status === 404) {
        cache = { at: Date.now(), data: {}, sha: null }
        return cache.data
      }
    } else {
      const r = await fetch(`https://raw.githubusercontent.com/${REPO}/${BRANCH}/overrides.json`)
      if (r.ok) {
        cache = { at: Date.now(), data: await r.json(), sha: null }
        return cache.data
      }
    }
  } catch (err) {
    console.error('Overrides load error:', err.message)
  }
  return cache.data || {}
}

// Saves run one at a time so two quick edits never overwrite each other
let chain = Promise.resolve()
export const saveOverrides = (mutate, message) => {
  const run = chain.then(async () => {
    if (!TOKEN) throw new Error('NO_TOKEN')
    await ensureBranch()
    const current = await loadOverrides(true)
    const next = mutate(JSON.parse(JSON.stringify(current)))
    const r = await gh(`/repos/${REPO}/contents/overrides.json`, {
      method: 'PUT',
      body: JSON.stringify({
        message,
        branch: BRANCH,
        content: Buffer.from(JSON.stringify(next, null, 1), 'utf8').toString('base64'),
        ...(cache.sha ? { sha: cache.sha } : {})
      })
    })
    if (!r.ok) throw new Error(`GitHub no guardó los cambios (${r.status}).`)
    const j = await r.json()
    cache = { at: Date.now(), data: next, sha: j.content.sha }
    return next
  })
  chain = run.catch(() => {})
  return run
}

// Uploads one image and returns a permanent URL for it
export const uploadImage = async (filePath, buffer, message) => {
  if (!TOKEN) throw new Error('NO_TOKEN')
  await ensureBranch()
  const r = await gh(`/repos/${REPO}/contents/${filePath}`, {
    method: 'PUT',
    body: JSON.stringify({ message, branch: BRANCH, content: buffer.toString('base64') })
  })
  if (!r.ok) throw new Error(`GitHub no guardó la foto (${r.status}).`)
  const j = await r.json()
  return `https://cdn.jsdelivr.net/gh/${REPO}@${j.commit.sha}/${filePath}`
}
