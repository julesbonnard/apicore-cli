import * as Interfaces from '@oclif/core/interfaces'
import * as F from '@oclif/core/flags'
import {stdtermwidth} from './screen.js'
import chalk from 'chalk'
import { inspect } from 'util'
import sw from 'string-width'
import { orderBy } from 'natural-orderby'

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

function sumBy<T>(items: T[], iteratee: (item: T) => number): number {
  return items.reduce((sum, item) => sum + iteratee(item), 0)
}

class Table<T extends Record<string, unknown>> {
  options: table.Options & { printLine(s: string): void; rowStart: string }

  columns: (table.Column<T> & { key: string; width?: number; maxWidth?: number })[]

  private processedData: Record<string, string>[] = []

  constructor(private data: T[], columns: table.Columns<T>, options: table.Options = {}) {
    // assign columns
    this.columns = Object.keys(columns).map((key: string) => {
      const col = columns[key]
      const extended = col.extended || false
      const get = col.get || ((row: Record<string, unknown>) => row[key])
      const header = typeof col.header === 'string' ? col.header : capitalize(key.replace(/_/g, ' '))
      const minWidth = Math.max(col.minWidth || 0, sw(header) + 1)

      return {
        extended,
        get,
        header,
        key,
        minWidth,
      }
    })

    // assign options
    const {columns: cols, filter, output, extended, sort, printLine} = options
    this.options = {
      columns: cols,
      output: options.csv ? 'csv' : output,
      extended,
      filter,
      'no-header': options['no-header'] || false,
      'no-truncate': options['no-truncate'] || false,
      printLine: printLine || ((s: string) => process.stdout.write(s + '\n')),
      rowStart: ' ',
      sort,
      title: options.title,
    }
  }

  display() {
    // build table rows from input array data
    let rows = this.data.map(d => {
      const row: Record<string, string> = {}
      for (const col of this.columns) {
        const raw = col.get(d)
        row[col.key] = typeof raw === 'string' ? raw : inspect(raw, {breakLength: Number.POSITIVE_INFINITY})
      }

      return row
    })

    // filter rows
    if (this.options.filter) {
      const [rawHeader, ...regexParts] = this.options.filter!.split('=')
      const regex = regexParts.join('=')
      const isNot = rawHeader[0] === '-'
      const header = isNot ? rawHeader.slice(1) : rawHeader
      const col = this.findColumnFromHeader(header)
      if (!col || !regex) throw new Error('Filter flag has an invalid value')
      rows = rows.filter((d: Record<string, string>) => {
        const re = new RegExp(regex)
        const val = d[col!.key]
        const match = val.match(re)
        return isNot ? !match : match
      })
    }

    // sort rows
    if (this.options.sort) {
      const sorters = this.options.sort!.split(',')
      const sortHeaders = sorters.map(k => k[0] === '-' ? k.slice(1) : k)
      const sortKeys = this.filterColumnsFromHeaders(sortHeaders).map(c => {
        return ((v: Record<string, string>) => v[c.key])
      })
      const sortKeysOrder = sorters.map(k => k[0] === '-' ? 'desc' : 'asc')
      rows = orderBy(rows, sortKeys, sortKeysOrder)
    }

    // and filter columns
    if (this.options.columns) {
      const filters = this.options.columns!.split(',')
      this.columns = this.filterColumnsFromHeaders(filters)
    } else if (!this.options.extended) {
      // show extended columns/properties
      this.columns = this.columns.filter(c => !c.extended)
    }

    this.processedData = rows

    switch (this.options.output) {
    case 'csv':
      this.outputCSV()
      break
    case 'json':
      this.outputJSON()
      break
    default:
      this.outputTable()
    }
  }

  private findColumnFromHeader(header: string): (table.Column<T> & { key: string; width?: number; maxWidth?: number }) | undefined {
    return this.columns.find(c => c.header.toLowerCase() === header.toLowerCase())
  }

  private filterColumnsFromHeaders(filters: string[]): (table.Column<T> & { key: string; width?: number; maxWidth?: number })[] {
    // unique
    filters = [...(new Set(filters))]
    const cols: (table.Column<T> & {key: string; width?: number; maxWidth?: number})[] = []
    for (const f of filters) {
      const c = this.columns.find(col => col.header.toLowerCase() === f.toLowerCase())
      if (c) cols.push(c)
    }

    return cols
  }

  private getCSVRow(d: Record<string, string>): string[] {
    const values = this.columns.map(col => d[col.key] || '')
    const lineToBeEscaped = values.find((e: string) => e.includes('"') || e.includes('\n') || e.includes('\r\n') || e.includes('\r') || e.includes(','))
    return values.map(e => lineToBeEscaped ? `"${e.replace('"', '""')}"` : e)
  }

  private resolveColumnsToObjectArray() {
    const {processedData, columns} = this
    return processedData.map((d: Record<string, string>) => {
      return columns.reduce<Record<string, string>>((obj, col) => {
        return {
          ...obj,
          [col.key]: d[col.key] || '',
        }
      }, {})
    })
  }

  private outputJSON() {
    this.options.printLine(JSON.stringify(this.resolveColumnsToObjectArray(), undefined, 2))
  }

  private outputCSV() {
    const {processedData, columns, options} = this

    if (!options['no-header']) {
      options.printLine(columns.map(c => c.header).join(','))
    }

    for (const d of processedData) {
      const row = this.getCSVRow(d)
      options.printLine(row.join(','))
    }
  }

  private outputTable() {
    const {processedData, columns, options} = this

    // column truncation
    //
    // find max width for each column
    for (const col of columns) {
      // convert multi-line cell to single longest line
      // for width calculations
      const widthData = processedData.map((row) => {
        const d = row[col.key]
        const manyLines = d.split('\n')
        if (manyLines.length > 1) {
          return '*'.repeat(Math.max(...manyLines.map((r: string) => sw(r))))
        }

        return d
      })
      const widths = ['.'.padEnd(col.minWidth! - 1), col.header, ...widthData].map(r => sw(r))
      col.maxWidth = Math.max(...widths) + 1
      col.width = col.maxWidth!
    }

    // terminal width
    const maxWidth = stdtermwidth - 2
    // truncation logic
    const shouldShorten = () => {
      // don't shorten if full mode
      if (options['no-truncate'] || (!process.stdout.isTTY && !process.env.CLI_UX_SKIP_TTY_CHECK)) return

      // don't shorten if there is enough screen width
      const dataMaxWidth = sumBy(columns, c => c.width!)
      const overWidth = dataMaxWidth - maxWidth
      if (overWidth <= 0) return

      // not enough room, short all columns to minWidth
      for (const col of columns) {
        col.width = col.minWidth
      }

      // if sum(minWidth's) is greater than term width
      // nothing can be done so
      // display all as minWidth
      const dataMinWidth = sumBy(columns, c => c.minWidth!)
      if (dataMinWidth >= maxWidth) return

      // some wiggle room left, add it back to "needy" columns
      let wiggleRoom = maxWidth - dataMinWidth
      const needyCols = columns.map(c => ({key: c.key, needs: c.maxWidth! - c.width!})).toSorted((a, b) => a.needs - b.needs)
      for (const {key, needs} of needyCols) {
        if (!needs) continue
        const col = columns.find(c => key === c.key)
        if (!col) continue
        if (wiggleRoom > needs) {
          col.width = col.width! + needs
          wiggleRoom -= needs
        } else if (wiggleRoom) {
          col.width = col.width! + wiggleRoom
          wiggleRoom = 0
        }
      }
    }

    shouldShorten()

    // print table title
    if (options.title) {
      options.printLine(options.title)
      // print title divider
      options.printLine(''.padEnd(columns.reduce((sum, col) => sum + col.width!, 1), '='))

      options.rowStart = '| '
    }

    // print headers
    if (!options['no-header']) {
      let headers = options.rowStart
      for (const col of columns) {
        const header = col.header!
        headers += header.padEnd(col.width!)
      }

      options.printLine(chalk.bold(headers))

      // print header dividers
      let dividers = options.rowStart
      for (const col of columns) {
        const divider = ''.padEnd(col.width! - 1, '─') + ' '
        dividers += divider.padEnd(col.width!)
      }

      options.printLine(chalk.bold(dividers))
    }

    // print rows
    for (const row of processedData) {
      // find max number of lines
      // for all cells in a row
      // with multi-line strings
      let numOfLines = 1
      for (const col of columns) {
        const d = row[col.key]
        const lines = d.split('\n').length
        if (lines > numOfLines) numOfLines = lines
      }

      const linesIndexes = Array.from({length: numOfLines}, (_, i) => i)

      // print row
      // including multi-lines
      for (const i of linesIndexes) {
        let l = options.rowStart
        for (const col of columns) {
          const width = col.width!
          let d = row[col.key]
          d = d.split('\n')[i] || ''
          const visualWidth = sw(d)
          const colorWidth = (d.length - visualWidth)
          let cell = d.padEnd(width + colorWidth)
          if ((cell.length - colorWidth) > width || visualWidth === width) {
            cell = cell.slice(0, width - 2) + '… '
          }

          l += cell
        }

        options.printLine(l)
      }
    }
  }
}

export function table<T extends Record<string, unknown>>(data: T[], columns: table.Columns<T>, options: table.Options = {}): void {
  new Table(data, columns, options).display()
}

export namespace table {
  export const Flags: {
    columns: Interfaces.OptionFlag<string | undefined>;
    sort: Interfaces.OptionFlag<string | undefined>;
    filter: Interfaces.OptionFlag<string | undefined>;
    output: Interfaces.OptionFlag<string | undefined>;
  } = {
    columns: F.string({exclusive: ['extended'], description: 'only show provided columns (comma-separated)'}),
    sort: F.string({description: 'property to sort by (prepend \'-\' for descending)'}),
    filter: F.string({description: 'filter property by partial string matching, ex: name=foo'}),
    output: F.string({
      exclusive: ['no-truncate', 'csv'],
      description: 'output in a more machine friendly format',
      options: ['csv', 'json'],
    }),
  }

  type IFlags = typeof Flags
  type ExcludeFlags<T, Z> = Pick<T, Exclude<keyof T, Z>>
  type IncludeFlags<T, K extends keyof T> = Pick<T, K>

  export function flags(): IFlags
  export function flags<Z extends keyof IFlags = keyof IFlags>(opts: { except: Z | Z[] }): ExcludeFlags<IFlags, Z>
  export function flags<K extends keyof IFlags = keyof IFlags>(opts: { only: K | K[] }): IncludeFlags<IFlags, K>
  export function flags(opts?: Record<string, string | string[]>): Record<string, Interfaces.OptionFlag<string | undefined>> {
    if (opts) {
      const f: Record<string, Interfaces.OptionFlag<string | undefined>> = {}
      const o = (opts.only && typeof opts.only === 'string' ? [opts.only] : opts.only) || Object.keys(Flags)
      const e = (opts.except && typeof opts.except === 'string' ? [opts.except] : opts.except) || []
      for (const key of o) {
        if (!e.includes(key)) {
          f[key] = (Flags as Record<string, Interfaces.OptionFlag<string | undefined>>)[key]
        }
      }

      return f
    }

    return Flags
  }

  export interface Column<T extends Record<string, unknown>> {
    header: string;
    extended: boolean;
    minWidth: number;
    get(row: T): unknown;
  }

  export type Columns<T extends Record<string, unknown>> = { [key: string]: Partial<Column<T>> }

  export interface Options {
    [key: string]: unknown;
    sort?: string;
    filter?: string;
    columns?: string;
    csv?: boolean;
    extended?: boolean;
    'no-truncate'?: boolean;
    output?: string;
    'no-header'?: boolean;
    title?: string;
    printLine?(s: string): void;
  }
}
