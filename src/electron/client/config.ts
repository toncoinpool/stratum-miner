import { existsSync, readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import commandLineArgs from 'command-line-args'

export interface ConfigJson {
    binary?: string
    boost?: string
    excludeGPUs?: string
    headless?: boolean
    integration?: string
    pool?: string
    rig?: string
    wallet?: string
}

export interface Config extends Required<ConfigJson> {
    baseBinaryPath: string
    dataDir: string
    version: string
}

const resourcePath =
    'pkg' in process
        ? dirname(process.execPath)
        : !process.env.NODE_ENV || process.env.NODE_ENV === 'production'
        ? process.resourcesPath
        : resolve(__dirname, '..', '..')

export default function readConfig(): Config {
    let jsonConfig: ConfigJson = {}
    try {
        const configPath = resolve(resourcePath, 'config', `config.json`)
        if (existsSync(configPath)) {
            jsonConfig = JSON.parse(readFileSync(configPath, 'utf8')) as ConfigJson
        }
    } catch (error) {
        throw new Error(`failed to parse config: ${(error as Error).message}`)
    }

    const cliConfig = parseCliConfig()

    const config: Config = {
        baseBinaryPath: resolve(resourcePath, 'bin'),
        binary: '',
        boost: '',
        dataDir: resolve(resourcePath, 'data'),
        excludeGPUs: '',
        headless: false,
        integration: '',
        pool: 'wss://pplns.toncoinpool.io/stratum',
        rig: 'default',
        version: '1.0.13',
        wallet: '',
        ...jsonConfig,
        ...cliConfig
    }

    return config
}

function parseCliConfig(): Partial<ConfigJson> {
    // fix for "electron:dev" npm script
    const isDevElectron = process.argv.length === 2 && /electron$/i.test(process.argv[0]!) && process.argv[1] === '.' // eslint-disable-line @typescript-eslint/no-non-null-assertion
    const args = commandLineArgs(
        [
            { name: 'bin', alias: 'b' },
            { name: 'boost', alias: 'F' },
            { name: 'exclude-gpus' },
            { name: 'headless', alias: 'h', type: Boolean, defaultValue: false },
            { name: 'integration' },
            { name: 'pool', alias: 'p' },
            { name: 'rig', alias: 'r' },
            { name: 'wallet', alias: 'w' }
        ],
        {
            // see https://github.com/75lb/command-line-args/issues/103
            argv: 'electron' in process.versions && !isDevElectron ? process.argv.slice(1) : undefined,
            partial: true
        }
    )

    const cliConfig: Partial<ConfigJson> = {}

    if (args.bin) cliConfig.binary = args.bin as string
    if (args.boost) cliConfig.boost = args.boost as string
    if (args['exclude-gpus']) cliConfig.excludeGPUs = args['exclude-gpus'] as string
    if ('headless' in args) cliConfig.headless = args.headless as boolean
    if (args.integration) cliConfig.integration = args.integration as string
    if (args.pool) cliConfig.pool = args.pool as string
    if (args.rig) cliConfig.rig = args.rig as string
    if (args.wallet) cliConfig.wallet = args.wallet as string

    return cliConfig
}
