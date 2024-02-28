import { Args } from '@oclif/core'
import chalk from 'chalk'
import { z } from 'zod'

import { BaseCommand } from '../../base-command.js'

/* eslint-disable perfectionist/sort-objects */
const DocSchema = z.object({
  afpshortid: z.string(),
  uno: z.string(),
  revision: z.number(),
  countryname: z.string(),
  city: z.string(),
  product: z.string(),
  created: z.coerce.date(),
  published: z.coerce.date(),
  lang: z.string(),
  headline: z.string().optional(),
  slug: z.string().array().optional(),
  news: z.string().array().optional()
})
/* eslint-enable perfectionist/sort-objects */

export default class Get extends BaseCommand<typeof Get> {
  static args = {
    id: Args.string({
      description: 'UNO or shortId of the document to retrieve',
      name: 'id',
      required: true
    })
  }

  static description = 'Get document using the API'
  public static enableJsonFlag = true

  async run(): Promise<void> {
    const { args } = await this.parse(Get)

    let doc
    if (args.id.length === 7) {
      const docs = await this.apiCore.search({ afpshortid: args.id, size: 1 })
      doc = docs.documents[0]
    } else {
      doc = await this.apiCore.get(args.id)
    }

    if (!doc) {
      this.error(`Document ${args.id} not found`)
    }

    if (this.jsonEnabled()) {
      this.log(JSON.stringify(doc, null, 2))
      return
    }

    doc = DocSchema.parse(doc)
    
    this.log(chalk.bold(doc.headline))
    this.log()
    this.log(`${doc.countryname.toUpperCase()}, ${doc.city} - ${doc.news?.join(`

`)}`)
  }
}
