import { z } from 'zod'

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
});

