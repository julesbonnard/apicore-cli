# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@julesbonnard/apicore-cli` is a CLI tool built with **oclif** for interacting with the AFP apicore news API. It provides authentication, document search/retrieval, and notification management. Uses ES Modules throughout.

## Commands

```bash
# Build (clean + compile TypeScript)
pnpm build

# Run in development (intended: tsx, no build needed — currently broken, see Testing below;
# run `pnpm build` first or this fails with "Command <x> not found")
./bin/dev.js <command>

# Run production build
./bin/run.js <command>

# Lint (oxlint)
pnpm lint

# Test (mocha, 60s timeout, runs lint after)
pnpm test

# Test with coverage (c8)
pnpm test:coverage

# Run a single test file
npx mocha "test/path/to/file.test.ts"

# Generate oclif manifest + readme
pnpm prepack
```

## Testing

- **`Config`-based command discovery (`findCommand`, `@oclif/test`'s `runCommand`, and `bin/dev.js`) always resolves to `./dist/commands`, never `src/`.** `@oclif/core`'s ts-path resolution needs to parse `tsconfig.json` to rewrite `dist` → `src`, but its reader targets the classic TypeScript API (`parseConfigFileTextToJson`), which this project's TypeScript 7 (native compiler) doesn't expose — the reader throws, is caught, and falls back to compiled output. This holds regardless of `NODE_ENV`, so it isn't just a test-discovery quirk: `./bin/dev.js <command>` without a prior `pnpm build` fails with "Command &lt;x&gt; not found" too (`rm -rf dist && ./bin/dev.js get --help` reproduces it). Consequence for tests: anything going through `Config.findCommand()`/`runCommand()` silently tests a stale build, not the source you just edited — confirmed by removing `dist/` and watching those tests still pass. This is an upstream `@oclif/core`/TypeScript 7 incompatibility, not a `package.json` misconfiguration; fixing it properly (pin to a classic-API-compatible TypeScript for dev tooling, or wait for `@oclif/core` to support TS 7) is tracked separately from the test-suite work below.
- Command tests therefore import the command class straight from `src/` (`import Cmd from '../../src/commands/x/index.js'`, resolved through `tsx` per `.mocharc.json`) and drive it directly (`new Cmd(argv, config)._run()`), never through discovery. `test/helpers/run-command.ts` (`runCliCommand()`) wraps this: isolated tmp `configDir` (never the real `~/.config/apicore`), a fake `apiCore` (monkey-patches `BaseCommand.prototype.initApiCore` for the duration of the call, restored after), a stub for `config.runCommand` (commands like `notifications services create` re-invoke another command on success — that re-entry would hit the same broken discovery), and `@oclif/test`'s `captureOutput` for stdout/stderr/result/error.
- Under `--json`, oclif's default `Command.catch()` logs the error as JSON to stdout and returns normally instead of rethrowing — so `captureOutput`'s `error` field is only populated for a thrown command error when the command is run **without** `--json`. Tests asserting an error path drop `--json` for that reason.
- `test/base-command.test.ts` exercises `BaseCommand` directly via a minimal concrete subclass, calling its methods (`loadUserConfig`, `saveUserConfig`, `initApiCore`, `authenticate`, …) without going through `_run()`/`init()` — needed to test state transitions (e.g. the `tokenChanged` listener persisting to disk) in isolation.
- Interactive prompt branches (`@inquirer/prompts` — the token-refresh confirmation in `login --info`, the first-run onboarding prompts in `createUserConfig`) are intentionally not covered: the test environment is non-TTY, which already routes every command test through the non-interactive branch, and mocking `@inquirer/prompts` itself was judged lower value than the rest of the checklist.

## Architecture

### Command Pattern (oclif)

All CLI commands extend `BaseCommand` (`src/base-command.ts`), which provides:
- AFP API client initialization via `afpnews-api` library
- Profile-based config persistence (`~/.config/apicore/config.json`, or `~/.config/apicore/<profile>/config.json` when `--profile` is used)
- Interactive first-run onboarding (prompts for API key/base url when no config file exists yet — skipped for `login`, non-TTY environments, and `--json`)
- Authentication token lifecycle (auto-save on token change events)
- `--profile` flag inherited by all commands; `--json` on commands that opt in (`login`, `get`, `search`)

Commands live in `src/commands/` and map to the CLI via directory structure with oclif's `topicSeparator: " "` (space-separated topics, e.g. `apicore notifications services`).

### Command Tree

- `login` — authenticate (interactive prompts or `--username`/`--password` flags)
- `logout` — remove stored credentials
- `get <ID>` — fetch single document by UNO or shortId
- `search [QUERY]` — search documents with filters, supports table/CSV/JSON output
- `notifications services` — list notification services
- `notifications services create <NAME>` — register a mail/rest/sqs/jms service
- `notifications services delete` — delete a service
- `notifications subscriptions [SERVICENAME]` — list subscriptions
- `notifications subscriptions create <SERVICENAME> <SUBSCRIPTIONNAME> [QUERY]` — add a subscription to a service
- `notifications subscriptions delete` — delete a subscription

### Components

- `src/components/table.ts` — custom table renderer with responsive column sizing, CSV/JSON export, filtering, and sorting (no external table library dependency)
- `src/components/screen.ts` — terminal width detection utilities
- `src/schemas/document.ts` — base document vocabulary for `get`/`search`. `parseBaseDoc()` parses raw AFP payloads via afpnews-api's canonical `parseDocument()`/`AfpDocument` model, then maps back to the CLI's historical field names/shape (`FIELD_ACCESSORS`-style bridge — output contract stays stable even if `AfpDocument`'s internal shape changes). `--extended` bypasses this entirely and keeps `BaseDocSchema.loose()` on the raw document, since it exists specifically to show fields `AfpDocument` doesn't model (e.g. `product`, read directly off the raw payload either way).
- `src/schemas/notification.ts` — zod schemas for the four notification service data shapes (mail/rest/sqs/jms), used to validate `notifications services create --datas` client-side before hitting the API

### Key Libraries

- **afpnews-api** — AFP API client (handles auth, search, notifications)
- **zod** — schema validation for API responses and command input
- **@inquirer/prompts** — interactive CLI input
- **chalk** / **ora** — terminal styling and spinners

### TypeScript Config

- Strict mode, target ES2023, module NodeNext, explicit `types: ["node"]`
- Source in `src/`, compiled output in `dist/`
- TypeScript 7 (native compiler).
- **tsx** (not ts-node) powers ESM+TS execution for both `bin/dev.js` and mocha (`.mocharc.json`, `node-option: import=tsx`) — registered via `tsx/esm/api`'s `register()` rather than a CLI flag, since a `--import tsx` shebang confuses tsx's own dynamic-import transform.
- Requires Node.js >= 20 (uses `Array.prototype.toSorted`).
