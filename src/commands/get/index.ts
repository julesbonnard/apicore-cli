import { Args, Flags } from '@oclif/core'
import chalk from 'chalk'

import { BaseCommand } from '../../base-command.js'
import { BaseDocSchema, parseBaseDoc } from '../../schemas/document.js'

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

  static flags = {
    extended: Flags.boolean({default: false, description: 'Return all available fields instead of the base set', required: false})
  }

  async run(): Promise<unknown> {
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

    // apiCore.get() has no `fields` param to restrict at the API level, so the
    // base/extended field selection happens client-side: --extended keeps the raw
    // document as-is, the base case goes through parseDocument() (AfpDocument).
    const parsed = this.flags.extended ? BaseDocSchema.loose().parse(doc) : parseBaseDoc(doc)

    if (this.jsonEnabled()) {
      return parsed
    }

    this.log(chalk.bold(parsed.headline))
    this.log()
    const location = [parsed.countryname?.toUpperCase(), parsed.city].filter(Boolean).join(', ')
    const newsText = parsed.news?.join('\n\n') ?? ''
    this.log(`${location}${location && newsText ? ' - ' : ''}${newsText}`)
  }
}
