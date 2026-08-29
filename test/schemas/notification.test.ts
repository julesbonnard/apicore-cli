import { strict as assert } from 'node:assert'
import {
  HttpServiceDataSchema,
  JmsServiceDataSchema,
  MailServiceDataSchema,
  ServiceDataSchemaByType,
  SqsServiceDataSchema,
} from '../../src/schemas/notification.js'

describe('HttpServiceDataSchema (rest)', () => {
  it('requires href, accepts optional user/password', () => {
    assert.equal(HttpServiceDataSchema.safeParse({ href: 'https://example.com/hook' }).success, true)
    assert.equal(HttpServiceDataSchema.safeParse({ href: 'https://example.com/hook', password: 'p', user: 'u' }).success, true)
    assert.equal(HttpServiceDataSchema.safeParse({}).success, false)
  })
})

describe('MailServiceDataSchema', () => {
  it('requires address', () => {
    assert.equal(MailServiceDataSchema.safeParse({ address: 'user@example.com' }).success, true)
    assert.equal(MailServiceDataSchema.safeParse({}).success, false)
  })
})

describe('JmsServiceDataSchema', () => {
  it('requires all eight fields', () => {
    const valid = {
      url: 'jms://x', type: 't', queueName: 'q', username: 'u',
      password: 'p', ttlInSeconds: '60', qosEnabled: 'true', deliveryMode: '1',
    }
    assert.equal(JmsServiceDataSchema.safeParse(valid).success, true)
    const { url: _url, ...missingUrl } = valid
    assert.equal(JmsServiceDataSchema.safeParse(missingUrl).success, false)
  })
})

describe('SqsServiceDataSchema', () => {
  it('requires all five fields', () => {
    const valid = { accessKey: 'a', secretKey: 's', region: 'eu-west-1', queue: 'q', ownerId: 'o' }
    assert.equal(SqsServiceDataSchema.safeParse(valid).success, true)
    const { region: _region, ...missingRegion } = valid
    assert.equal(SqsServiceDataSchema.safeParse(missingRegion).success, false)
  })
})

describe('ServiceDataSchemaByType', () => {
  it('exposes exactly the four service types', () => {
    assert.deepEqual(Object.keys(ServiceDataSchemaByType).toSorted(), ['jms', 'mail', 'rest', 'sqs'])
  })

  it('routes each type to its own schema', () => {
    assert.equal(ServiceDataSchemaByType.mail, MailServiceDataSchema)
    assert.equal(ServiceDataSchemaByType.rest, HttpServiceDataSchema)
    assert.equal(ServiceDataSchemaByType.jms, JmsServiceDataSchema)
    assert.equal(ServiceDataSchemaByType.sqs, SqsServiceDataSchema)
  })
})
