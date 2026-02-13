# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@julesbonnard/apicore-cli` is a CLI tool built with **oclif** for interacting with the AFP apicore news API. It provides authentication, document search/retrieval, and notification management. Uses ES Modules throughout.

## Commands

```bash
# Build (clean + compile TypeScript)
pnpm build

# Run in development (uses ts-node, no build needed)
./bin/dev.js <command>

# Run production build
./bin/run.js <command>

# Lint
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
- Profile-based config persistence (`~/.config/apicore/[profile]/config.json`)
- Authentication token lifecycle (auto-save on token change events)
- `--json` and `--profile` flags inherited by all commands

Commands live in `src/commands/` and map to the CLI via directory structure with oclif's `topicSeparator: " "` (space-separated topics, e.g. `apicore notifications services`).

### Command Tree

- `login` — authenticate (interactive prompts or `--username`/`--password` flags)
- `get <ID>` — fetch single document by UNO or shortId
- `search [QUERY]` — search documents with filters, supports table/CSV/JSON output
- `notifications services` — list notification services
- `notifications services delete` — delete a service
- `notifications subscriptions [SERVICENAME]` — list subscriptions
- `notifications subscriptions delete` — delete a subscription

### Components

- `src/components/table.ts` — custom table renderer with responsive column sizing, CSV/JSON export, filtering, and sorting
- `src/components/screen.ts` — terminal width detection utilities

### Key Libraries

- **afpnews-api** — AFP API client (handles auth, search, notifications)
- **zod** — schema validation for API responses (e.g. document parsing in `get` command)
- **@inquirer/prompts** — interactive CLI input
- **chalk** / **ora** — terminal styling and spinners

### TypeScript Config

- Strict mode, target ES2022, module NodeNext
- Source in `src/`, compiled output in `dist/`
- ts-node with ESM for development (`bin/dev.js`)
