import { Args, Flags, ux } from '@oclif/core'
import { SearchQuerySortOrder, defaultSearchParams } from 'afpnews-api'
import { z } from 'zod'

import { BaseCommand } from '../../base-command.js'

/* eslint-disable perfectionist/sort-objects */
const DocSchema = z.object({
  afpshortid: z.string(),
  uno: z.string(),
  revision: z.number(),
  country: z.string(),
  product: z.string(),
  published: z.coerce.date(),
  lang: z.string(),
  headline: z.string().optional(),
  slug: z.string().array(),
})
/* eslint-enable perfectionist/sort-objects */

export default class Search extends BaseCommand {
  static args = {
    query: Args.string()
  }

  static description = 'Search documents using the API'
  public static enableJsonFlag = true

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> "france" -l fr,es',
    '<%= config.bin %> <%= command.id %> --json'
  ]

  static flags = {
    fields: Flags.string({char: 'f', default: DocSchema.keyof().options, description: 'Fields to return', multiple: true, required: false}),
    from: Flags.string({default: defaultSearchParams.dateFrom, description: 'From date', required: false}),
    langs: Flags.string({char: 'l', description: 'Langs separated by commas, like fr,es', multiple: true, required: false}),
    products: Flags.string({char: 'p', description: 'Products separated by commas, like news,photo', multiple: true, required: false}),
    size: Flags.integer({default: defaultSearchParams.size, description: 'Max number of documents to return', required: false}),
    sortField: Flags.string({default: defaultSearchParams.sortField, description: 'Sort field', required: false}),
    sortOrder: Flags.string({default: defaultSearchParams.sortOrder, description: 'Sort order', options: ['asc', 'desc'], required: false}),
    table: Flags.boolean({default: false, description: 'Print the results as a table', required: false}),
    to: Flags.string({default: defaultSearchParams.dateTo, description: 'To date', required: false}),
    ...ux.table.flags({except: ['sort', 'filter']})
  }

  async run(): Promise<void> {
    await this.authenticate()

    const { args, flags } = await this.parse(Search)

    ux.action.start('Searching documents')
    const docs = []
    for await (const document of this.apiCore.searchAll({
      dateFrom: flags.from,
      dateTo: flags.to,
      langs: flags.langs,
      product: flags.products,
      query: args.query,
      size: flags.size,
      sortField: flags.sortField,
      sortOrder: flags.sortOrder as SearchQuerySortOrder
    }, flags.fields)) {
      const doc = flags.extended ? DocSchema.passthrough().parse(document) : DocSchema.parse(document)
      if (this.jsonEnabled()) {
        console.log(JSON.stringify(doc))
      } else {
        docs.push(doc)
      }
    }

    /* eslint-disable perfectionist/sort-objects */
    ux.table(docs, {
      afpshortid: {},
      uno: {
        extended: true
      },
      revision: {
        extended: true
      },
      country: {
        extended: true
      },
      product: {},
      published: {
        get: row => row.published.toLocaleString()
      },
      lang: {},
      headline: {},
      slug: {
        extended: true,
        get: row => row.slug.join(',')
      }
    }, {
      printLine: this.log.bind(this),
      ...flags
    })
    /* eslint-enable perfectionist/sort-objects */

    ux.action.stop()
  }
}
