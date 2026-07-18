# apicore CLI

A modern command-line interface for [AFP apicore](https://afp-apicore-prod.afp.com) — search news, retrieve documents, manage notifications, and handle authentication.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![GitHub license](https://img.shields.io/github/license/julesbonnard/apicore-cli)](https://github.com/julesbonnard/apicore-cli/blob/main/LICENSE)

## Quick start

```sh
npm install -g @julesbonnard/apicore-cli

# Authenticate (interactive prompts for credentials)
apicore login --apiKey YOUR_API_KEY

# Search for recent news
apicore search "climate change" --size 5

# Get a specific document
apicore get TS4XRII6FF
```

## Installation

```sh
npm install -g @julesbonnard/apicore-cli
```

Requires Node.js >= 20.

## Authentication

All commands except `login` require a valid token. Tokens are stored locally in `~/.config/apicore/config.json` (or `~/.config/apicore/<profile>/config.json` when using `--profile`) and refreshed automatically.

```sh
# First-time setup: provide your API key, then enter username/password
apicore login --apiKey YOUR_API_KEY

# Check authentication status
apicore login --info

# Use a separate profile (e.g. for staging)
apicore login --profile staging

# Remove stored credentials
apicore logout
```

You can also pass `--username` and `--password` flags for non-interactive use.

If you run any command without having authenticated yet, the CLI will interactively ask for an API key and base url (leave the API key empty to use anonymous access) and save your answers for next time. This onboarding prompt is skipped in non-interactive environments (CI, piped input) and when using `--json`.

## Commands

### `apicore search [QUERY]`

Search documents with filters and multiple output formats.

```sh
# Basic search
apicore search "france"

# Filter by language and product
apicore search "elections" -l fr,es -p news

# Date range
apicore search --from 2024-01-01 --to 2024-06-01

# Output as JSON (one object per line, streamable)
apicore search --json

# Output as table, CSV or JSON
apicore search --table
apicore search --output csv
apicore search --csv

# Show all columns
apicore search --table --extended
```

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--fields` | `-f` | Fields to return | afpshortid, created, country, countryname, city, headline, lang, product, published, revision, slug, uno, news |
| `--langs` | `-l` | Filter by languages (comma-separated) | |
| `--products` | `-p` | Filter by products (comma-separated) | |
| `--from` | | Start date | 1980-01-01 |
| `--to` | | End date | now |
| `--size` | | Max documents to return | 10 |
| `--sortField` | | Field to sort by | published |
| `--sortOrder` | | `asc` or `desc` | desc |
| `--table` | | Display as formatted table | |
| `--output` | | `csv` or `json` | |
| `--csv` | | Shortcut for `--output csv` | |
| `--columns` | | Show specific columns (comma-separated) | |
| `--extended` | | Show all columns including hidden ones | |

### `apicore get ID`

Retrieve a single document by UNO or shortId (7 characters).

```sh
apicore get TS4XRII6FF
apicore get abc1234       # shortId lookup
apicore get TS4XRII6FF --json
```

### `apicore notifications services`

List and manage notification services.

```sh
# List all services
apicore notifications services

# Register a new mail service
apicore notifications services create my-service --type mail --datas '{"address":"user@example.com"}'

# Register a new rest (webhook) service
apicore notifications services create my-service --type rest --datas '{"href":"https://example.com/hook","user":"u","password":"p"}'

# Delete a service
apicore notifications services delete my-service
```

`--type` accepts `mail`, `rest`, `sqs` or `jms`; `--datas` is a JSON object whose shape depends on the type:

| Type | `--datas` shape |
|------|------------------|
| `mail` | `{ "address": string }` |
| `rest` | `{ "href": string, "user"?: string, "password"?: string }` |
| `sqs` | `{ "accessKey": string, "secretKey": string, "region": string, "queue": string, "ownerId": string }` |
| `jms` | `{ "url": string, "type": string, "queueName": string, "username": string, "password": string, "ttlInSeconds": string, "qosEnabled": string, "deliveryMode": string }` |

### `apicore notifications subscriptions [SERVICENAME]`

List and manage notification subscriptions.

```sh
# List all subscriptions
apicore notifications subscriptions

# List subscriptions for a specific service
apicore notifications subscriptions my-service

# Add a subscription to a service
apicore notifications subscriptions create my-service my-subscription "france" -l fr,es

# Delete a subscription
apicore notifications subscriptions delete my-service sub-123
```

### Global flags

| Flag | Description |
|------|-------------|
| `--json` | Output as JSON (available on `login`, `get`, `search`) |
| `--profile` | Use a named profile for separate auth configs |
| `--help` | Show help for any command |
| `--version` | Show CLI version |

## Development

```sh
git clone https://github.com/julesbonnard/apicore-cli.git
cd apicore-cli
pnpm install
pnpm build

# Run in development mode (no build needed)
./bin/dev.js search "test"
```

## License

MIT
