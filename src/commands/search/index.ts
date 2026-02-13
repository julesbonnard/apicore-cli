import { Args, Flags } from '@oclif/core'
import ora from 'ora'
import { table } from '../../components/table.js'
import { SearchQuerySortOrder, defaultSearchParams } from 'afpnews-api'

import { BaseCommand } from '../../base-command.js'
import { SearchDocSchema } from '../../schemas/document.js'

/**
 * Function to fix double quotes escaping in CSV export
 * Issue in OCLIF table module, see https://github.com/oclif/core/issues/944
 * @param {string} value - The value to fix
 * @returns string
 */
function fixCSVQuotesExport (value: string) {
  let i = 0
  return value.replaceAll('"', () => {
    i++
    return i > 1 ? '""' : '"'
  })
}

export default class Search extends BaseCommand<typeof Search> {
  static args = {
    query: Args.string({
      description: 'Search query',
      name: 'query',
      required: false
    })
  }

  static description = 'Search documents using the API'
  public static enableJsonFlag = true

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> "france" -l fr,es',
    '<%= config.bin %> <%= command.id %> --json'
  ]

  static flags = {
    fields: Flags.string({char: 'f', default: SearchDocSchema.keyof().options, description: 'Fields to return', multiple: true, required: false}),
    from: Flags.string({default: defaultSearchParams.dateFrom, description: 'From date', required: false}),
    langs: Flags.string({char: 'l', description: 'Langs separated by commas, like fr,es', multiple: true, required: false}),
    products: Flags.string({char: 'p', description: 'Products separated by commas, like news,photo', multiple: true, required: false}),
    size: Flags.integer({default: defaultSearchParams.size, description: 'Max number of documents to return', required: false}),
    sortField: Flags.string({default: defaultSearchParams.sortField, description: 'Sort field', required: false}),
    sortOrder: Flags.string({default: defaultSearchParams.sortOrder, description: 'Sort order', options: ['asc', 'desc'], required: false}),
    table: Flags.boolean({default: false, description: 'Print the results as a table', required: false}),
    to: Flags.string({default: defaultSearchParams.dateTo, description: 'To date', required: false}),
    extended: Flags.boolean({default: false, required: false}),
    csv: Flags.boolean({default: false, required: false}),
    ...table.flags({except: ['sort', 'filter']})
  }

  async run(): Promise<void> {
    const spinner = ora('Searching documents').start()

    const docs = []
    for await (const document of this.apiCore.searchAll({
      dateFrom: this.flags.from,
      dateTo: this.flags.to,
      langs: this.flags.langs,
      product: this.flags.products,
      query: this.args.query,
      size: this.flags.size,
      sortField: this.flags.sortField,
      sortOrder: this.flags.sortOrder as SearchQuerySortOrder
    }, this.flags.fields)) {
      try {
        const doc = this.flags.extended ? SearchDocSchema.passthrough().parse(document) : SearchDocSchema.parse(document)
        if (this.jsonEnabled()) {
          console.log(JSON.stringify(doc))
        } else {
          docs.push(doc)
        }
      } catch (error) {
        this.log('Error parsing document', error, document)
      }
    }

    spinner.stop()

    if (this.jsonEnabled()) {
      return
    }

    table(docs, {
      afpshortid: {},
      uno: {
        header: 'uno',
        extended: true
      },
      revision: {
        header: 'revision',
        extended: true
      },
      country: {
        header: 'country',
        extended: true
      },
      product: {
        header: 'product'
      },
      created: {
        header: 'created',
        extended: true,
        get: row => row.created.toLocaleString()
      },
      published: {
        header: 'published',
        get: row => row.published.toLocaleString()
      },
      lang: {
        header: 'lang'
      },
      headline: {
        header: 'headline',
        get: row => this.flags.csv && row.headline ? fixCSVQuotesExport(row.headline) : row.headline
      },
      slug: {
        header: 'slug',
        extended: true,
        get: row => row.slug?.join(',')
      }
    }, {
      printLine: this.log.bind(this),
      ...this.flags
    })
  }
}
