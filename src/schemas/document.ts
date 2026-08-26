import { z } from 'zod'
import { parseDocument, DocumentSourceSchema, MANDATORY_RAW_FIELDS, type AfpDocument, type AfpDocumentClass } from 'afpnews-api'

// Mode --extended : schéma brut canonique du SDK, en mode `.loose()` pour laisser passer tous
// les champs bruts non déclarés (channel, keyword, mediatopic, ...) sans passer par parseDocument().
// Type annoté explicitement : le type inféré de `.loose()` référence des symboles internes de
// zod non nommables de façon portable d'un package à l'autre (déclarations .d.ts).
export type ExtendedDoc = z.infer<typeof DocumentSourceSchema> & Record<string, unknown>
export const ExtendedDocSchema: z.ZodType<ExtendedDoc> = DocumentSourceSchema.loose()

export type BaseDoc = {
  afpshortid?: string
  created: Date
  country?: string
  countryname?: string
  city?: string
  headline?: string
  lang: string
  'class': AfpDocumentClass
  published: Date
  revision: number
  slug?: string[]
  uno: string
  news: string[]
}

export const BASE_DOC_FIELDS = [
  'afpshortid', 'created', 'country', 'countryname', 'city', 'headline',
  'lang', 'class', 'published', 'revision', 'slug', 'uno', 'news',
] as const

/** Ajoute le socle requis par parseDocument() à une liste de champs à demander à l'API. */
export function toApiFields(fields: readonly string[]): string[] {
  return [...new Set([...fields, ...MANDATORY_RAW_FIELDS])]
}

/**
 * Ramène un AfpDocument déjà parsé au vocabulaire de sortie historique du CLI (mêmes noms de
 * champs, même forme JSON) — c'est le seul pont entre le modèle du SDK et le contrat public de
 * cette CLI.
 */
export function toBaseDoc(doc: AfpDocument): BaseDoc {
  return {
    afpshortid: doc.shortId,
    created: doc.created,
    country: doc.country.id,
    countryname: doc.country.name,
    city: doc.city,
    headline: doc.headline,
    lang: doc.lang,
    'class': doc.class,
    published: doc.published,
    revision: doc.revision,
    slug: doc.slugs,
    uno: doc.uno,
    news: newsLines(doc),
  }
}

/** Parse un document brut ; lève si `raw` ne correspond pas au modèle canonique. */
export function parseBaseDoc(raw: unknown): BaseDoc {
  return toBaseDoc(parseDocument(raw))
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
