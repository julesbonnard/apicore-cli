import { strict as assert } from 'node:assert'
import { table } from '../../src/components/table.js'

function captureCSV(data: Record<string, unknown>[]): string[] {
  const lines: string[] = []
  table(data, { value: {} }, { csv: true, printLine: (s: string) => lines.push(s) })
  return lines
}

function captureJSON(data: Record<string, unknown>[], columns: Parameters<typeof table>[1], options: Parameters<typeof table>[2] = {}): unknown[] {
  const lines: string[] = []
  table(data, columns, { ...options, output: 'json', printLine: (s: string) => lines.push(s) })
  return JSON.parse(lines[0])
}

describe('table — CSV escaping', () => {
  it('escapes every double quote in a value, not just the first', () => {
    const lines = captureCSV([{ value: 'a "first" and "second" quote' }])
    assert.equal(lines[1], '"a ""first"" and ""second"" quote"')
  })

  it('leaves a value with no special character unquoted', () => {
    const lines = captureCSV([{ value: 'plain text' }])
    assert.equal(lines[1], 'plain text')
  })
})

describe('table — filter', () => {
  const columns = { name: {} }
  const data = [{ name: 'apple' }, { name: 'banana' }, { name: 'apricot' }]

  it('keeps only rows whose column value matches the regex', () => {
    const rows = captureJSON(data, columns, { filter: 'name=^ap' })
    assert.deepEqual(rows, [{ name: 'apple' }, { name: 'apricot' }])
  })

  it('inverts the match when the header is prefixed with -', () => {
    const rows = captureJSON(data, columns, { filter: '-name=^ap' })
    assert.deepEqual(rows, [{ name: 'banana' }])
  })

  it('throws when the filter header does not match any column', () => {
    assert.throws(() => table(data, columns, { filter: 'nope=x' }), /Filter flag has an invalid value/)
  })

  it('throws when the filter has no regex part', () => {
    assert.throws(() => table(data, columns, { filter: 'name=' }), /Filter flag has an invalid value/)
  })
})

describe('table — sort', () => {
  const columns = { name: {} }
  const data = [{ name: 'banana' }, { name: 'apple' }, { name: 'cherry' }]

  it('sorts ascending by default', () => {
    const rows = captureJSON(data, columns, { sort: 'name' })
    assert.deepEqual(rows, [{ name: 'apple' }, { name: 'banana' }, { name: 'cherry' }])
  })

  it('sorts descending when prefixed with -', () => {
    const rows = captureJSON(data, columns, { sort: '-name' })
    assert.deepEqual(rows, [{ name: 'cherry' }, { name: 'banana' }, { name: 'apple' }])
  })
})

describe('table — columns filtering / extended', () => {
  const columns = {
    uno: {},
    revision: { extended: true },
  }
  const data = [{ revision: 3, uno: 'x1' }]

  it('hides extended columns by default', () => {
    const rows = captureJSON(data, columns)
    assert.deepEqual(rows, [{ uno: 'x1' }])
  })

  it('shows extended columns when options.extended is set', () => {
    const rows = captureJSON(data, columns, { extended: true })
    assert.deepEqual(rows, [{ revision: '3', uno: 'x1' }])
  })

  it('restricts to the columns named in options.columns, by header, case-insensitively', () => {
    const rows = captureJSON(data, columns, { columns: 'Revision' })
    assert.deepEqual(rows, [{ revision: '3' }])
  })
})
