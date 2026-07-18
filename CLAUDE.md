# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@julesbonnard/apicore-cli` is a CLI tool built with **oclif** for interacting with the AFP apicore news API. It provides authentication, document search/retrieval, and notification management. Uses ES Modules throughout.

## Commands

```bash
# Build (clean + compile TypeScript)
pnpm build

# Run in development (uses tsx, no build needed)
./bin/dev.js <command>

# Run production build
./bin/run.js <command>

# Lint (oxlint)
pnpm lint

# Test (mocha, 60s timeout, runs lint after)
pnpm test

# Run a single test file
npx mocha "test/path/to/file.test.ts"

# Generate oclif manifest + readme
pnpm prepack
```

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
- `src/schemas/document.ts` — zod schema for API documents (used by `get`/`search`)
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
