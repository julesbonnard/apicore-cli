import { z } from 'zod'

export const HttpServiceDataSchema = z.object({
  href: z.string(),
  user: z.string().optional(),
  password: z.string().optional()
})

export const MailServiceDataSchema = z.object({
  address: z.string()
})

export const JmsServiceDataSchema = z.object({
  url: z.string(),
  type: z.string(),
  queueName: z.string(),
  username: z.string(),
  password: z.string(),
  ttlInSeconds: z.string(),
  qosEnabled: z.string(),
  deliveryMode: z.string()
})

export const SqsServiceDataSchema = z.object({
  accessKey: z.string(),
  secretKey: z.string(),
  region: z.string(),
  queue: z.string(),
  ownerId: z.string()
})

export const ServiceDataSchemaByType = {
  jms: JmsServiceDataSchema,
  mail: MailServiceDataSchema,
  rest: HttpServiceDataSchema,
  sqs: SqsServiceDataSchema
} as const

export type ServiceType = keyof typeof ServiceDataSchemaByType
