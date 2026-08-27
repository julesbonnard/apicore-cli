import { strict as assert } from 'node:assert'
import { table } from '../../src/components/table.js'

function captureCSV(data: Record<string, unknown>[]): string[] {
  const lines: string[] = []
  table(data, { value: {} }, { csv: true, printLine: (s: string) => lines.push(s) })
  return lines
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
