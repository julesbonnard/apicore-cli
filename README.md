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
@julesbonnard/apicore-cli/0.1.1 darwin-arm64 node-v20.10.0
$ apicore --help [COMMAND]
USAGE
  $ apicore COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`apicore get ID`](#apicore-get-id)
* [`apicore help [COMMAND]`](#apicore-help-command)
* [`apicore login`](#apicore-login)
* [`apicore notifications services`](#apicore-notifications-services)
* [`apicore notifications services delete [SERVICENAME]`](#apicore-notifications-services-delete-servicename)
* [`apicore notifications subscriptions [SERVICENAME]`](#apicore-notifications-subscriptions-servicename)
* [`apicore notifications subscriptions delete SERVICENAME SUBSCRIPTIONIDENTIFIER`](#apicore-notifications-subscriptions-delete-servicename-subscriptionidentifier)
* [`apicore search [QUERY]`](#apicore-search-query)

## `apicore get ID`

Get document using the API

```
USAGE
  $ apicore get ID [--json] [--profile <value>]

ARGUMENTS
  ID  UNO or shortId of the document to retrieve

FLAGS
  --profile=<value>  Define a custom profile to save auth config

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Get document using the API
```

_See code: [src/commands/get/index.ts](https://github.com/julesbonnard/apicore-cli/blob/v0.1.1/src/commands/get/index.ts)_

## `apicore help [COMMAND]`

Display help for apicore.

```
USAGE
  $ apicore help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for apicore.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.0.18/src/commands/help.ts)_

## `apicore login`

Get a token for the API

```
USAGE
  $ apicore login [--json] [--profile <value>] [-a <value>] [-u <value>] [-i]

FLAGS
  -a, --apiKey=<value>   Your API Key
  -i, --info             Just check if you're authenticated
  -u, --baseUrl=<value>  [default: https://afp-apicore-prod.afp.com] The API base url
      --profile=<value>  Define a custom profile to save auth config

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Get a token for the API

EXAMPLES
  $ apicore login

  $ apicore login --info

  $ apicore login --json
```

_See code: [src/commands/login/index.ts](https://github.com/julesbonnard/apicore-cli/blob/v0.1.1/src/commands/login/index.ts)_

## `apicore notifications services`

List notifications services

```
USAGE
  $ apicore notifications services [--profile <value>]

FLAGS
  --profile=<value>  Define a custom profile to save auth config

DESCRIPTION
  List notifications services
```

_See code: [src/commands/notifications/services/index.ts](https://github.com/julesbonnard/apicore-cli/blob/v0.1.1/src/commands/notifications/services/index.ts)_

## `apicore notifications services delete [SERVICENAME]`

Delete notifications service

```
USAGE
  $ apicore notifications services delete [SERVICENAME] [--profile <value>]

FLAGS
  --profile=<value>  Define a custom profile to save auth config

DESCRIPTION
  Delete notifications service
```

_See code: [src/commands/notifications/services/delete.ts](https://github.com/julesbonnard/apicore-cli/blob/v0.1.1/src/commands/notifications/services/delete.ts)_

## `apicore notifications subscriptions [SERVICENAME]`

List notifications subscriptions

```
USAGE
  $ apicore notifications subscriptions [SERVICENAME] [--profile <value>]

ARGUMENTS
  SERVICENAME  Name of the service to list subscriptions for

FLAGS
  --profile=<value>  Define a custom profile to save auth config

DESCRIPTION
  List notifications subscriptions
```

_See code: [src/commands/notifications/subscriptions/index.ts](https://github.com/julesbonnard/apicore-cli/blob/v0.1.1/src/commands/notifications/subscriptions/index.ts)_

## `apicore notifications subscriptions delete SERVICENAME SUBSCRIPTIONIDENTIFIER`

Delete notifications subscription

```
USAGE
  $ apicore notifications subscriptions delete SERVICENAME SUBSCRIPTIONIDENTIFIER [--profile <value>]

ARGUMENTS
  SERVICENAME             Name of the service to delete the subscription from
  SUBSCRIPTIONIDENTIFIER  Identifier of the subscription to delete

FLAGS
  --profile=<value>  Define a custom profile to save auth config

DESCRIPTION
  Delete notifications subscription
```

_See code: [src/commands/notifications/subscriptions/delete.ts](https://github.com/julesbonnard/apicore-cli/blob/v0.1.1/src/commands/notifications/subscriptions/delete.ts)_

## `apicore search [QUERY]`

Search documents using the API

```
USAGE
  $ apicore search [QUERY] [--json] [--profile <value>] [-f <value>] [--from <value>] [-l <value>] [-p
    <value>] [--size <value>] [--sortField <value>] [--sortOrder asc|desc] [--table] [--to <value>] [--columns <value> |
    -x] [--no-header | [--csv | --no-truncate]] [--output csv|json|yaml |  | ]

ARGUMENTS
  QUERY  Search query

FLAGS
  -f, --fields=<value>...    [default: afpshortid,uno,revision,country,product,created,published,lang,headline,slug]
                             Fields to return
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
      --profile=<value>      Define a custom profile to save auth config
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

_See code: [src/commands/search/index.ts](https://github.com/julesbonnard/apicore-cli/blob/v0.1.1/src/commands/search/index.ts)_
<!-- commandsstop -->
