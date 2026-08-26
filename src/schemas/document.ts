import { z } from 'zod'
import { parseDocument, type AfpDocument } from 'afpnews-api'

// Conservé pour le mode --extended : coerce created/published en Date et laisse tous les
// autres champs bruts passer tels quels (schema `.loose()`), sans passer par parseDocument().
export const BaseDocSchema = z.object({
  afpshortid: z.string().optional(),
  created: z.coerce.date(),
  country: z.string().optional(),
  countryname: z.string().optional(),
  city: z.string().optional(),
  headline: z.string().optional(),
  lang: z.string().optional(),
  product: z.string().optional(),
  published: z.coerce.date(),
  revision: z.number().optional(),
  slug: z.array(z.string()).optional(),
  uno: z.string(),
  news: z.array(z.string()).optional(),
})

export type BaseDoc = z.infer<typeof BaseDocSchema>

export const BASE_DOC_FIELDS = [...BaseDocSchema.keyof().options] as const

// Champs bruts que parseDocument() exige toujours (DocumentSourceSchema du SDK), quels que
// soient les champs demandés par l'appelant.
const MANDATORY_API_FIELDS = ['uno', 'class', 'urgency', 'created', 'published', 'revision', 'provider', 'status', 'lang']

/** Ajoute le socle requis par parseDocument() à une liste de champs à demander à l'API. */
export function toApiFields(fields: readonly string[]): string[] {
  return [...new Set([...fields, ...MANDATORY_API_FIELDS])]
}

/**
 * Parse un document brut via le modèle canonique afpnews-api (AfpDocument), puis le
 * ramène au vocabulaire de sortie historique du CLI (mêmes noms de champs, même forme
 * JSON) — c'est le seul pont entre le modèle du SDK et le contrat public de cette CLI.
 *
 * `product` n'existe pas sur AfpDocument (distinct de `class` : encode la ligne de
 * produit/fournisseur — ex. `photo` vs `getty_extra` — pas le type de contenu) et se lit
 * donc directement sur le document brut plutôt que sur le modèle parsé.
 */
export function parseBaseDoc(raw: unknown): BaseDoc {
  const doc: AfpDocument = parseDocument(raw)
  const rawProduct = (raw as { product?: unknown })?.product

  return {
    afpshortid: doc.shortId,
    created: doc.created,
    country: doc.country.id,
    countryname: doc.country.name,
    city: doc.city,
    headline: doc.headline,
    lang: doc.lang,
    product: typeof rawProduct === 'string' ? rawProduct : undefined,
    published: doc.published,
    revision: doc.revision,
    slug: doc.slugs,
    uno: doc.uno,
    news: newsLines(doc),
  }
}

// Une vidéo n'a pas de paragraphs sur AfpDocument (le SDK y peuple `shots` à la place) —
// sans ce fallback, `news` serait silencieusement vide pour tout document vidéo.
function newsLines(doc: AfpDocument): string[] {
  if (doc.paragraphs.length > 0) return doc.paragraphs.map(p => p.text)
  return (doc.shots ?? []).flatMap(shot => [
    `${shot.numero}. ${shot.start}-${shot.end} ${shot.description}`.trimEnd(),
    ...shot.citations.map(c => `"${c.text}"`),
  ])
}
