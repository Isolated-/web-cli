data-cli
=================

A new CLI generated with oclif


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/data-cli.svg)](https://npmjs.org/package/data-cli)
[![Downloads/week](https://img.shields.io/npm/dw/data-cli.svg)](https://npmjs.org/package/data-cli)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g data-cli
$ data-cli COMMAND
running command...
$ data-cli (--version)
data-cli/0.0.0 linux-x64 node-v26.2.0
$ data-cli --help [COMMAND]
USAGE
  $ data-cli COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`data-cli hello PERSON`](#data-cli-hello-person)
* [`data-cli hello world`](#data-cli-hello-world)
* [`data-cli help [COMMAND]`](#data-cli-help-command)
* [`data-cli plugins`](#data-cli-plugins)
* [`data-cli plugins add PLUGIN`](#data-cli-plugins-add-plugin)
* [`data-cli plugins:inspect PLUGIN...`](#data-cli-pluginsinspect-plugin)
* [`data-cli plugins install PLUGIN`](#data-cli-plugins-install-plugin)
* [`data-cli plugins link PATH`](#data-cli-plugins-link-path)
* [`data-cli plugins remove [PLUGIN]`](#data-cli-plugins-remove-plugin)
* [`data-cli plugins reset`](#data-cli-plugins-reset)
* [`data-cli plugins uninstall [PLUGIN]`](#data-cli-plugins-uninstall-plugin)
* [`data-cli plugins unlink [PLUGIN]`](#data-cli-plugins-unlink-plugin)
* [`data-cli plugins update`](#data-cli-plugins-update)

## `data-cli hello PERSON`

Say hello

```
USAGE
  $ data-cli hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ data-cli hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/crawler/data-cli/blob/v0.0.0/src/commands/hello/index.ts)_

## `data-cli hello world`

Say hello world

```
USAGE
  $ data-cli hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ data-cli hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/crawler/data-cli/blob/v0.0.0/src/commands/hello/world.ts)_

## `data-cli help [COMMAND]`

Display help for data-cli.

```
USAGE
  $ data-cli help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for data-cli.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/6.2.50/src/commands/help.ts)_

## `data-cli plugins`

List installed plugins.

```
USAGE
  $ data-cli plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ data-cli plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.72/src/commands/plugins/index.ts)_

## `data-cli plugins add PLUGIN`

Installs a plugin into data-cli.

```
USAGE
  $ data-cli plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into data-cli.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the DATA_CLI_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the DATA_CLI_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ data-cli plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ data-cli plugins add myplugin

  Install a plugin from a github url.

    $ data-cli plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ data-cli plugins add someuser/someplugin
```

## `data-cli plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ data-cli plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ data-cli plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.72/src/commands/plugins/inspect.ts)_

## `data-cli plugins install PLUGIN`

Installs a plugin into data-cli.

```
USAGE
  $ data-cli plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into data-cli.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the DATA_CLI_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the DATA_CLI_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ data-cli plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ data-cli plugins install myplugin

  Install a plugin from a github url.

    $ data-cli plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ data-cli plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.72/src/commands/plugins/install.ts)_

## `data-cli plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ data-cli plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ data-cli plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.72/src/commands/plugins/link.ts)_

## `data-cli plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ data-cli plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ data-cli plugins unlink
  $ data-cli plugins remove

EXAMPLES
  $ data-cli plugins remove myplugin
```

## `data-cli plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ data-cli plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.72/src/commands/plugins/reset.ts)_

## `data-cli plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ data-cli plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ data-cli plugins unlink
  $ data-cli plugins remove

EXAMPLES
  $ data-cli plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.72/src/commands/plugins/uninstall.ts)_

## `data-cli plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ data-cli plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ data-cli plugins unlink
  $ data-cli plugins remove

EXAMPLES
  $ data-cli plugins unlink myplugin
```

## `data-cli plugins update`

Update installed plugins.

```
USAGE
  $ data-cli plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/5.4.72/src/commands/plugins/update.ts)_
<!-- commandsstop -->
