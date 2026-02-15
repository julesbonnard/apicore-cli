import { Args } from '@oclif/core'
import chalk from 'chalk'

import { BaseCommand } from '../../base-command.js'
import { BaseDocSchema } from '../../schemas/document.js'

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
    let doc
    try {
      if (this.args.id.length === 7) {
        const docs = await this.apiCore.search({ afpshortid: this.args.id, size: 1 })
        doc = docs.documents[0]
      } else {
        doc = await this.apiCore.get(this.args.id)
      }
    } catch (error) {
      this.error(`Failed to fetch document ${this.args.id}: ${error}`, { exit: 1 })
    }

    if (!doc) {
      this.error(`Document ${this.args.id} not found`, { exit: 1 })
    }

    if (this.jsonEnabled()) {
      this.log(JSON.stringify(doc, null, 2))
      return
    }

    const parsed = BaseDocSchema.parse(doc)

this.log(chalk.bold(parsed.headline))
this.log()
const location = [parsed.countryname?.toUpperCase(), parsed.city].filter(Boolean).join(', ')
const newsText = parsed.news?.join('\n\n') ?? ''
this.log(`${location}${location && newsText ? ' - ' : ''}${newsText}`)
  }
}
