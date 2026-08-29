import { strict as assert } from 'node:assert'
import { runCliCommand } from '../helpers/run-command.js'

const RAW_DOC = {
  uno: 'newsml.afp.com.20260826T112239Z.doc-c6j92ke',
  afpshortid: 'c6j92ke',
  headline: 'Test headline',
  news: ['First paragraph.', 'Second paragraph.'],
  lang: 'en',
  urgency: 4,
  created: '2026-08-26T11:22:39Z',
  published: '2026-08-26T11:39:26Z',
  revision: 2,
  provider: 'AFP',
  status: 'Usable',
  'class': 'text',
  country: 'esp',
  countryname: 'Spain',
  city: 'Sant Joan Despí',
  slug: ['sport', 'football'],
}

describe('get', () => {
  it('fetches by UNO when the id is not 7 characters long', async () => {
    const calls: unknown[] = []
    const { error, result } = await runCliCommand('src/commands/get/index.js', [RAW_DOC.uno, '--json'], {
      apiCore: {
        async get(uno: string) {
          calls.push(uno)
          return RAW_DOC
        },
      },
    })
    assert.equal(error, undefined)
    assert.deepEqual(calls, [RAW_DOC.uno])
    assert.equal((result as { headline: string }).headline, 'Test headline')
  })

  it('searches by afpshortid when the id is exactly 7 characters long', async () => {
    const searchCalls: unknown[] = []
    const { error, result } = await runCliCommand('src/commands/get/index.js', ['c6j92ke', '--json'], {
      apiCore: {
        async search(params: unknown) {
          searchCalls.push(params)
          return { count: 1, documents: [RAW_DOC] }
        },
      },
    })
    assert.equal(error, undefined)
    assert.deepEqual(searchCalls, [{ afpshortid: 'c6j92ke', size: 1 }])
    assert.equal((result as { headline: string }).headline, 'Test headline')
  })

  it('errors when the afpshortid search returns no document', async () => {
    // No --json here: under --json, oclif's default `catch()` logs the error as JSON to
    // stdout and returns normally instead of rethrowing (see command.js `catch()`), so the
    // thrown error is only observable via captureOutput's `error` in non-JSON mode.
    const { error } = await runCliCommand('src/commands/get/index.js', ['c6j92ke'], {
      apiCore: { async search() { return { count: 0, documents: [] } } },
    })
    assert.ok(error?.message.includes('Document c6j92ke not found'), error?.message)
  })

  it('errors when apiCore.get rejects', async () => {
    const { error } = await runCliCommand('src/commands/get/index.js', [RAW_DOC.uno], {
      apiCore: { async get() { throw new Error('network down') } },
    })
    assert.ok(error?.message.includes(`Failed to fetch document ${RAW_DOC.uno}`), error?.message)
    assert.ok(error?.message.includes('network down'), error?.message)
  })

  it('--extended keeps the raw document shape instead of parseBaseDoc', async () => {
    const { error, result } = await runCliCommand('src/commands/get/index.js', [RAW_DOC.uno, '--json', '--extended'], {
      apiCore: { async get() { return RAW_DOC } },
    })
    assert.equal(error, undefined)
    // DocumentSourceSchema (afpnews-api) uppercases afpshortid, unlike parseBaseDoc's shape.
    assert.equal((result as { afpshortid: string }).afpshortid, 'C6J92KE')
    assert.ok((result as { created: unknown }).created instanceof Date)
  })

  it('--extended errors on a document missing a field required by the schema', async () => {
    const { status: _status, ...docWithoutStatus } = RAW_DOC as Record<string, unknown>
    const { error } = await runCliCommand('src/commands/get/index.js', [RAW_DOC.uno, '--extended'], {
      apiCore: { async get() { return docWithoutStatus } },
    })
    assert.ok(error?.message.includes('Error parsing document'), error?.message)
  })

  it('prints headline, location and news body in non-JSON mode', async () => {
    const { stdout } = await runCliCommand('src/commands/get/index.js', [RAW_DOC.uno], {
      apiCore: { async get() { return RAW_DOC } },
    })
    assert.ok(stdout.includes('Test headline'), stdout)
    assert.ok(stdout.includes('SPAIN, Sant Joan Despí - First paragraph.\n\nSecond paragraph.'), stdout)
  })

  it('omits the trailing separator when there is no location', async () => {
    const { country: _country, countryname: _countryname, city: _city, ...docWithoutLocation } = RAW_DOC as Record<string, unknown>
    const { stdout } = await runCliCommand('src/commands/get/index.js', [RAW_DOC.uno], {
      apiCore: { async get() { return docWithoutLocation } },
    })
    assert.ok(stdout.includes('First paragraph.'), stdout)
    assert.ok(!stdout.includes(' - First paragraph.'), stdout)
  })
})
