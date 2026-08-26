import { strict as assert } from 'node:assert'
import { BASE_DOC_FIELDS, parseBaseDoc, safeParseBaseDoc, toApiFields } from '../../src/schemas/document.js'

const BASE_RAW_DOC = {
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
  product: 'news',
}

const VIDEO_RAW_DOC = {
  ...BASE_RAW_DOC,
  'class': 'video',
  news: [
    '1. 00:05-00:09 Players arrive at training',
    '2. 00:09-00:14 SOUNDBITE 1 - Coach (male, English, 10 sec):',
    '"We are ready for the match."',
  ],
}

describe('toApiFields', () => {
  it('adds the mandatory socle required by parseDocument()', () => {
    const fields = toApiFields(['uno', 'headline'])
    for (const f of ['class', 'urgency', 'created', 'published', 'revision', 'provider', 'status', 'lang']) {
      assert.ok(fields.includes(f), `expected ${f} in ${fields}`)
    }
  })

  it('does not duplicate fields already requested', () => {
    const fields = toApiFields(['uno', 'class'])
    assert.equal(fields.filter(f => f === 'class').length, 1)
  })
})

describe('parseBaseDoc', () => {
  it('preserves the historical field vocabulary and shape', () => {
    const doc = parseBaseDoc(BASE_RAW_DOC)
    assert.deepEqual(Object.keys(doc).toSorted(), [...BASE_DOC_FIELDS].toSorted())
  })

  it('keeps country and countryname as separate fields', () => {
    const doc = parseBaseDoc(BASE_RAW_DOC)
    assert.equal(doc.country, 'esp')
    assert.equal(doc.countryname, 'Spain')
  })

  it('returns created/published as Date instances', () => {
    const doc = parseBaseDoc(BASE_RAW_DOC)
    assert.ok(doc.created instanceof Date)
    assert.ok(doc.published instanceof Date)
  })

  it('reads product straight off the raw document (not modeled by AfpDocument)', () => {
    const doc = parseBaseDoc(BASE_RAW_DOC)
    assert.equal(doc.product, 'news')
  })

  it('reads news from paragraphs for a text document', () => {
    const doc = parseBaseDoc(BASE_RAW_DOC)
    assert.deepEqual(doc.news, ['First paragraph.', 'Second paragraph.'])
  })

  it('falls back to a rendered shot list for a video document (no paragraphs on AfpDocument)', () => {
    const doc = parseBaseDoc(VIDEO_RAW_DOC)
    assert.ok(doc.news && doc.news.some(line => line.includes('Players arrive at training')))
    assert.ok(doc.news && doc.news.some(line => line.includes('We are ready for the match.')))
  })
})

describe('safeParseBaseDoc', () => {
  it('returns the same result as parseBaseDoc for a valid document', () => {
    const doc = safeParseBaseDoc(BASE_RAW_DOC)
    assert.equal(doc?.uno, BASE_RAW_DOC.uno)
    assert.equal(doc?.product, 'news')
  })

  it('returns undefined instead of throwing for a malformed document', () => {
    assert.equal(safeParseBaseDoc({ uno: 'incomplete' }), undefined)
  })
})
