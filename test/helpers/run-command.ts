import { Config } from '@oclif/core'
import { captureOutput } from '@oclif/test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const root = join(dirname(fileURLToPath(import.meta.url)), '../..')

export type FakeApiCore = Record<string, unknown>

type UserConfigSeed = {
  apiKey?: string
  baseUrl?: string
  token?: Record<string, unknown>
}

export type RunCommandResult<T> = {
  configDir: string
  error?: Error & { message: string }
  result?: T
  runCommandCalls: Array<{ argv?: string[]; id: string }>
  stderr: string
  stdout: string
}

// `oclif`'s ts-path resolution can't parse this project's tsconfig.json under TypeScript 7
// (its native compiler lacks `parseConfigFileTextToJson`), so `Config`-based command discovery
// (`findCommand`, `runCommand`) silently falls back to `./dist/commands` regardless of NODE_ENV —
// see the investigation in PR/issue history. Importing the command class straight from `src/`
// sidesteps that resolution entirely and provably exercises source, not a stale build.
let baseCommandModulePromise: Promise<{ BaseCommand: { prototype: { initApiCore(): void } } }> | undefined
function getBaseCommandModule() {
  baseCommandModulePromise ??= import(join(root, 'src/base-command.ts'))
  return baseCommandModulePromise
}

/**
 * Loads a `Config` whose `configDir` is an isolated tmp directory, never the user's real
 * `~/.config/apicore`. Any test that instantiates a command directly (rather than going through
 * `runCliCommand`) must use this — a `Config.load({root})` result points at the real config dir
 * by default, and a command that ends up calling `saveUserConfig()`/`authenticate()` against it
 * would silently overwrite real credentials.
 */
export async function loadIsolatedConfig(): Promise<{ config: Config; configDir: string }> {
  const config = await Config.load({ root })
  const configDir = mkdtempSync(join(tmpdir(), 'apicore-cli-test-'))
  if (!configDir.startsWith(tmpdir())) {
    throw new Error('refusing to run a test outside an isolated tmp directory')
  }

  config.configDir = configDir
  return { config, configDir }
}

/**
 * Runs a CLI command against `src/` with an isolated config directory (never the user's real
 * `~/.config/apicore`) and a fake `apiCore`, bypassing network calls entirely.
 */
export async function runCliCommand<T = unknown>(
  commandPath: string,
  argv: string[],
  options: { apiCore?: FakeApiCore; seedConfigFile?: boolean; userConfig?: UserConfigSeed } = {}
): Promise<RunCommandResult<T>> {
  const { config, configDir: tmpDir } = await loadIsolatedConfig()
  // seedConfigFile: false leaves configDir empty, e.g. to exercise the ENOENT/"not logged in" path.
  if (options.seedConfigFile !== false) {
    writeFileSync(join(tmpDir, 'config.json'), JSON.stringify(options.userConfig ?? {}))
  }

  const runCommandCalls: Array<{ argv?: string[]; id: string }> = []
  config.runCommand = (async (id: string, cmdArgv?: string[]) => {
    runCommandCalls.push({ argv: cmdArgv, id })
  }) as typeof config.runCommand

  const BaseCommandModule = await getBaseCommandModule()
  const original = BaseCommandModule.BaseCommand.prototype.initApiCore
  BaseCommandModule.BaseCommand.prototype.initApiCore = function (this: { apiCore: unknown }) {
    this.apiCore = options.apiCore ?? {}
  }

  try {
    const { default: CommandClass } = await import(join(root, commandPath))
    const cmd = new CommandClass(argv, config)
    const { error, result, stderr, stdout } = await captureOutput<T>(() => cmd['_run']())
    return { configDir: tmpDir, error, result, runCommandCalls, stderr, stdout }
  } finally {
    BaseCommandModule.BaseCommand.prototype.initApiCore = original
    rmSync(tmpDir, { recursive: true, force: true })
  }
}
