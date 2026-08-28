import { parseDocument } from 'afpnews-api'
import { strict as assert } from 'node:assert'
import { runCliCommand } from '../helpers/run-command.js'

const RAW_DOC = {
  uno: 'newsml.afp.com.20260826T112239Z.doc-c6j92ke',
  afpshortid: 'c6j92ke',
  headline: 'Test headline',
  news: ['First paragraph.'],
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
  slug: ['sport'],
}

function makeSearchAllSpy(docs: unknown[]) {
  const calls: Array<{ fields: unknown; options?: unknown; params: unknown }> = []
  return {
    calls,
    // eslint-disable-next-line require-yield
    searchAll: async function * (params: unknown, fields: unknown, options?: unknown) {
      calls.push({ fields, options, params })
      for (const doc of docs) yield doc
    },
  }
}

describe('search', () => {
  it('requests the base field socle by default and renders a table without crashing', async () => {
    // Non-extended mode passes { parse: true, lenient: true } to searchAll(), so the real SDK
    // would yield already-parsed AfpDocument instances, not raw JSON — parseDocument() here
    // mirrors that.
    const spy = makeSearchAllSpy([parseDocument(RAW_DOC)])
    const { error, stdout } = await runCliCommand('src/commands/search/index.js', [], { apiCore: spy })

    assert.equal(error, undefined)
    const [{ fields, options, params }] = spy.calls
    assert.ok((fields as string[]).includes('uno'))
    assert.ok((fields as string[]).includes('headline'))
    assert.deepEqual(options, { parse: true, lenient: true })
    assert.equal((params as { dateFrom: string }).dateFrom, '1980-01-01')
    assert.ok(stdout.includes('Test headline'), stdout)
  })

  it('--fields overrides the default field socle', async () => {
    const spy = makeSearchAllSpy([])
    await runCliCommand('src/commands/search/index.js', ['--fields', 'uno,slug'], { apiCore: spy })

    const [{ fields }] = spy.calls
    assert.ok((fields as string[]).includes('uno'))
    assert.ok((fields as string[]).includes('slug'))
  })

  it('--extended requests no field restriction (empty fields array)', async () => {
    const spy = makeSearchAllSpy([])
    await runCliCommand('src/commands/search/index.js', ['--extended', '--json'], { apiCore: spy })

    const [{ fields, options }] = spy.calls
    assert.deepEqual(fields, [])
    // extended mode does its own per-document safeParse instead of the SDK's parse/lenient options.
    assert.equal(options, undefined)
  })

  it('--langs and --class are split on commas into the search params', async () => {
    const spy = makeSearchAllSpy([])
    await runCliCommand('src/commands/search/index.js', ['--langs', 'fr,es', '--class', 'text,picture'], { apiCore: spy })

    const [{ params }] = spy.calls
    assert.deepEqual((params as { langs: string[] }).langs, ['fr', 'es'])
    assert.deepEqual((params as { 'class': string[] })['class'], ['text', 'picture'])
  })

  it('--json streams one NDJSON line per document, bypassing the table', async () => {
    const secondRawDoc = { ...RAW_DOC, uno: 'newsml.afp.com.20260826T112240Z.doc-c6j92kf', afpshortid: 'c6j92kf' }
    const spy = makeSearchAllSpy([parseDocument(RAW_DOC), parseDocument(secondRawDoc)])
    const { error, stdout } = await runCliCommand('src/commands/search/index.js', ['--json'], { apiCore: spy })

    assert.equal(error, undefined)
    const lines = stdout.trim().split('\n').filter(Boolean)
    assert.equal(lines.length, 2)
    const parsed = lines.map(l => JSON.parse(l))
    assert.deepEqual(parsed.map(d => d.uno), [RAW_DOC.uno, secondRawDoc.uno])
  })

  it('--extended skips a malformed document with a warning instead of aborting the search', async () => {
    const { status: _status, ...malformedDoc } = RAW_DOC as Record<string, unknown>
    const spy = makeSearchAllSpy([RAW_DOC, malformedDoc])
    const { error, stderr, stdout } = await runCliCommand('src/commands/search/index.js', ['--extended'], { apiCore: spy })

    assert.equal(error, undefined)
    assert.ok(stdout.includes('Test headline'), stdout)
    assert.ok(stderr.includes('Error parsing document'), stderr)
  })

  it('--extended --json silently skips a malformed document (this.warn is a no-op under --json)', async () => {
    const { status: _status, ...malformedDoc } = RAW_DOC as Record<string, unknown>
    const spy = makeSearchAllSpy([malformedDoc])
    const { error, stdout } = await runCliCommand('src/commands/search/index.js', ['--extended', '--json'], { apiCore: spy })

    assert.equal(error, undefined)
    assert.equal(stdout.trim(), '')
  })
})
