import { z } from 'zod'

const BaseDocSchema = z.object({
  afpshortid: z.string().optional(),
  created: z.coerce.date(),
  headline: z.string().optional(),
  lang: z.string().optional(),
  product: z.string().optional(),
  published: z.coerce.date(),
  revision: z.number().optional(),
  slug: z.string().array().optional(),
  uno: z.string(),
})

export const SearchDocSchema = BaseDocSchema.extend({
  country: z.string().optional(),
})

export const GetDocSchema = BaseDocSchema.required({
  revision: true,
}).extend({
  city: z.string(),
  countryname: z.string(),
  news: z.string().array().optional(),
})

export type SearchDoc = z.infer<typeof SearchDocSchema>
export type GetDoc = z.infer<typeof GetDocSchema>
