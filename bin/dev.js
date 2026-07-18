#!/usr/bin/env node
import { register } from 'tsx/esm/api'

register()

async function main() {
  const {execute} = await import('@oclif/core')
  await execute({development: true, dir: import.meta.url})
}

await main()
