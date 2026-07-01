import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Where } from 'payload'

const MEDIA_BASE = 'https://csoqqkjunimsteibibxg.supabase.co/storage/v1/object/public/catch/media/'

const esc = (v: unknown): string => {
  if (v === null || v === undefined) return ''
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const box = (label: string, content: string, color: 'teal' | 'red') => `
  <div class="box box-${color}">
    <div class="box-header">${esc(label)}</div>
    <div class="box-body">${content}</div>
  </div>`

const para = (text: string) =>
  `<p>${String(text).split('\n').filter(l => l.trim()).map(esc).join('<br/>')}</p>`

const renderCard = (recipe: any): string => {
  const title = recipe.name || 'Recipe'

  // First image
  const firstImage = (() => {
    const media = Array.isArray(recipe.images) ? recipe.images[0] : null
    if (!media) return ''
    const file = media?.image ?? media
    const filename = file?.sizes?.mobile?.filename || file?.filename
    if (!filename) return ''
    return `<img src="${MEDIA_BASE}${esc(filename)}" alt="${esc(title)}" class="card-img" />`
  })()

  // Left column boxes
  const left: string[] = []

  if (recipe.description) left.push(box('Description', para(recipe.description), 'teal'))

  if (recipe.foh?.description) left.push(box('Table Talk', para(recipe.foh.description), 'teal'))

  if (recipe.foh?.dropline) left.push(box('Dropline', `<p>"${esc(recipe.foh.dropline)}"</p>`, 'teal'))

  // Components: bold name: ingredients
  if (Array.isArray(recipe.foh?.components) && recipe.foh.components.length) {
    const rows = recipe.foh.components
      .map((c: any) => `<p><strong>${esc(c.name)}:</strong> ${esc(c.ingredients ?? '')}</p>`)
      .join('')
    left.push(box('Components', rows, 'teal'))
  }

  // PPSSG Ingredients
  const fohIng = recipe.foh?.ingredients
  if (fohIng) {
    const rows = [
      { label: 'Protein',      value: fohIng.protein },
      { label: 'Preparation',  value: fohIng.preparation },
      { label: 'Sauce',        value: fohIng.sauce },
      { label: 'Side',         value: fohIng.side },
      { label: 'Garnish',      value: fohIng.garnish },
    ]
      .filter(r => r.value)
      .map(r => `<p><strong>${esc(r.label)}:</strong> ${esc(r.value)}</p>`)
      .join('')
    if (rows) left.push(box('Ingredients', rows, 'teal'))
  }

  if (recipe.foh?.miseEnPlace) {
    left.push(box('Mise en Place', `<p>${esc(recipe.foh.miseEnPlace)}</p>`, 'red'))
  }

  // Right column: image + allergies
  const allergens = Array.isArray(recipe.allergens) ? recipe.allergens : []
  const allergiesBox = allergens.length
    ? box(
        'Allergies',
        `<p>${allergens.map((a: string) => esc(a.replace(/_/g, ' '))).join(' / ')}</p>`,
        'red',
      )
    : ''

  // Full-width note
  const noteBox = recipe.foh?.notes ? box('Note', para(recipe.foh.notes), 'teal') : ''

  return `
    <div class="card">
      <h1 class="card-title">${esc(title)}</h1>
      <div class="card-body">
        <div class="col-left">${left.join('')}</div>
        <div class="col-right">${firstImage}${allergiesBox}</div>
      </div>
      ${noteBox ? `<div class="card-notes">${noteBox}</div>` : ''}
    </div>`
}

const CSS = `
  @page { size: landscape; margin: 0; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #222;
    margin: 0;
    padding: 0;
    font-size: 11px;
    line-height: 1.5;
  }
  .card {
    padding: 48px 56px;
    page-break-after: always;
  }
  .card-title {
    text-align: center;
    font-size: 28px;
    font-weight: bold;
    margin: 0 0 10px 0;
  }
  .card-body {
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }
  .col-left { flex: 0 0 57%; }
  .col-right { flex: 0 0 41%; }
  .card-img {
    width: 100%;
    border-radius: 4px;
    display: block;
    margin-bottom: 10px;
  }
  .box {
    margin-bottom: 8px;
    page-break-inside: avoid;
  }
  .box-teal { border: 2px solid #2e6666; }
  .box-red  { border: 2px solid #913d46; }
  .box-header {
    font-weight: bold;
    text-align: center;
    padding: 3px 8px;
    font-size: 11px;
  }
  .box-teal .box-header { border-bottom: 1px solid #2e6666; }
  .box-red  .box-header { border-bottom: 1px solid #913d46; }
  .box-body { padding: 5px 10px; }
  p { margin: 0 0 3px 0; }
  .card-notes { margin-top: 10px; }
  @media print {
    .card { page-break-after: always; }
    .box  { page-break-inside: avoid; }
  }
`

// Canonical menu category order matching the app / Payload dropdown
const MENU_CATEGORY_ORDER = [
  'snacks',
  'salads',
  'japan',
  'rolls',
  'hot_starters',
  'hot_rock',
  'steak',
  'seafood',
  'sides',
  'desserts',
]

const sortByMenuCategory = (docs: any[]): any[] => {
  return [...docs].sort((a, b) => {
    const ai = MENU_CATEGORY_ORDER.indexOf(a.menuCategory ?? '')
    const bi = MENU_CATEGORY_ORDER.indexOf(b.menuCategory ?? '')
    // Unknown categories go to the end
    const aIdx = ai === -1 ? MENU_CATEGORY_ORDER.length : ai
    const bIdx = bi === -1 ? MENU_CATEGORY_ORDER.length : bi
    if (aIdx !== bIdx) return aIdx - bIdx
    // Within the same category, sort alphabetically by name
    return (a.name ?? '').localeCompare(b.name ?? '')
  })
}

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url)
  const idParam = searchParams.get('id')
  const whereParam = searchParams.get('where')

  const payload = await getPayload({ config: configPromise })

  let docs: any[] = []

  if (idParam) {
    // Single recipe
    const doc = await payload.findByID({
      collection: 'recipes',
      id: idParam,
      depth: 1,
    })
    docs = [doc]
  } else {
    let where: Where = {}
    try {
      if (whereParam) where = JSON.parse(whereParam)
    } catch {
      // malformed where — print all
    }
    const result = await payload.find({
      collection: 'recipes',
      where,
      limit: 300,
      depth: 1,
    })
    docs = sortByMenuCategory(result.docs)
  }

  const cards = docs.map(renderCard).join('\n')

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Recipe Print</title>
    <style>${CSS}</style>
  </head>
  <body>
    ${cards}
    <script>window.addEventListener('load', () => window.print())</script>
  </body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
