#!/usr/bin/env node
/* eslint-disable n/no-unpublished-bin */

async function main() {
  const {execute} = await import('@oclif/core')
  await execute({dir: import.meta.url})
}

await main()
