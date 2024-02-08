apicore CLI
=================

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![GitHub license](https://img.shields.io/github/license/oclif/hello-world)](https://github.com/oclif/hello-world/blob/main/LICENSE)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @julesbonnard/apicore-cli
$ apicore COMMAND
running command...
$ apicore (--version)
@julesbonnard/apicore-cli/0.0.1 darwin-arm64 node-v20.10.0
$ apicore --help [COMMAND]
USAGE
  $ apicore COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`apicore help [COMMANDS]`](#apicore-help-commands)
* [`apicore login`](#apicore-login)
* [`apicore search [QUERY]`](#apicore-search-query)

## `apicore help [COMMANDS]`

Display help for apicore.

```
USAGE
  $ apicore help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for apicore.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.0.12/src/commands/help.ts)_

## `apicore login`

Get a token for the API

```
USAGE
  $ apicore login [--json] [-a <value>] [-u <value>] [-i]

FLAGS
  -a, --apiKey=<value>   Your API Key
  -i, --info             Just check if you're authenticated
  -u, --baseUrl=<value>  [default: https://afp-apicore-prod.afp.com] The API base url

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Get a token for the API

EXAMPLES
  $ apicore login

  $ apicore login --info

  $ apicore login --json
```

_See code: [src/commands/login/index.ts](https://github.com/julesbonnard/apicore-cli/blob/v0.0.1/src/commands/login/index.ts)_

## `apicore search [QUERY]`

Search documents using the API

```
USAGE
  $ apicore search [QUERY] [--json] [-f <value>] [--from <value>] [-l <value>] [-p <value>] [--size <value>]
    [--sortField <value>] [--sortOrder asc|desc] [--table] [--to <value>] [--columns <value> | -x] [--no-header | [--csv
    | --no-truncate]] [--output csv|json|yaml |  | ]

FLAGS
  -f, --fields=<value>...    [default: afpshortid,uno,revision,country,product,published,lang,headline,slug] Fields to
                             return
  -l, --langs=<value>...     Langs separated by commas, like fr,es
  -p, --products=<value>...  Products separated by commas, like news,photo
  -x, --extended             show extra columns
      --columns=<value>      only show provided columns (comma-separated)
      --csv                  output is csv format [alias: --output=csv]
      --from=<value>         [default: 2012-01-01] From date
      --no-header            hide table header from output
      --no-truncate          do not truncate output to fit screen
      --output=<option>      output in a more machine friendly format
                             <options: csv|json|yaml>
      --size=<value>         [default: 10] Max number of documents to return
      --sortField=<value>    [default: published] Sort field
      --sortOrder=<option>   [default: desc] Sort order
                             <options: asc|desc>
      --table                Print the results as a table
      --to=<value>           [default: now] To date

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Search documents using the API

EXAMPLES
  $ apicore search

  $ apicore search "france" -l fr,es

  $ apicore search --json
```

_See code: [src/commands/search/index.ts](https://github.com/julesbonnard/apicore-cli/blob/v0.0.1/src/commands/search/index.ts)_
<!-- commandsstop -->
