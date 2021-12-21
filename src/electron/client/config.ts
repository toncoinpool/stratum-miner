import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import commandLineArgs from 'command-line-args'

export interface ConfigJson {
    binary: string
    boost: number[]
    gpus: string[]
    headless: boolean
    integration?: string
    pool: string
    rig: string
    wallet: string
}

export interface Config extends ConfigJson {
    baseBinaryPath: string
    dataDir: string
    minerPath: string
    version: string
}

const resourcePath =
    'pkg' in process
        ? dirname(process.execPath)
        : !process.env.NODE_ENV || process.env.NODE_ENV === 'production'
        ? process.resourcesPath
        : resolve(__dirname, '..', '..')

const updateFromEnv = (config: ConfigJson) => {
    const { MINER_GPUS, MINER_WALLET, MINER_RIG, MINER_POOL, MINER_BINARY } = process.env

    config.binary = MINER_BINARY ?? config.binary
    config.pool = MINER_POOL ?? config.pool
    config.wallet = MINER_WALLET ?? config.wallet
    config.rig = MINER_RIG ?? config.rig
    config.gpus = MINER_GPUS ? MINER_GPUS.replace(/ /g, '').split(',') : config.gpus
}

const parseCliConfig = (jsonConfig: ConfigJson): ConfigJson => {
    // fix for "electron:dev" npm script
    const isDevElectron = process.argv.length === 2 && /electron$/i.test(process.argv[0]!) && process.argv[1] === '.' // eslint-disable-line @typescript-eslint/no-non-null-assertion
    const args = commandLineArgs(
        [
            { name: 'bin', alias: 'b', defaultValue: jsonConfig.binary },
            {
                name: 'boost',
                alias: 'F',
                type(boosts) {
                    return boosts
                        .split(',')
                        .map((boost) => boost.trim())
                        .filter(Boolean)
                        .map((boost) => Number.parseInt(boost, 10))
                },
                defaultValue: jsonConfig.boost
            },
            {
                name: 'gpus',
                alias: 'g',
                type(gpus) {
                    return gpus
                        .split(',')
                        .map((gpu) => gpu.trim())
                        .filter(Boolean)
                },
                defaultValue: jsonConfig.gpus
            },
            { name: 'headless', alias: 'h', type: Boolean, defaultValue: false },
            { name: 'integration', defaultValue: jsonConfig.integration },
            { name: 'pool', alias: 'p', defaultValue: jsonConfig.pool },
            { name: 'rig', alias: 'r', defaultValue: jsonConfig.rig },
            { name: 'wallet', alias: 'w', defaultValue: jsonConfig.wallet }
        ],
        // see https://github.com/75lb/command-line-args/issues/103
        { argv: 'electron' in process.versions && !isDevElectron ? process.argv.slice(1) : undefined }
    )

    return {
        binary: args.bin as string,
        boost: args.boost as number[],
        gpus: args.gpus as string[],
        headless: args.headless as boolean,
        integration: args.integration as string,
        pool: args.pool as string,
        rig: args.rig as string,
        wallet: args.wallet as string
    }
}

export default function readConfig(): Config {
    let jsonConfig: ConfigJson
    try {
        jsonConfig = JSON.parse(readFileSync(resolve(resourcePath, 'config', `config.json`), 'utf8')) as ConfigJson
    } catch (error) {
        throw new Error(`failed to parse config: ${(error as Error).message}`)
    }

    const cliConfig = parseCliConfig(jsonConfig)

    if (!process.env.TONPOOL_IS_IN_HIVE && !cliConfig.integration) {
        updateFromEnv(jsonConfig)
    }

    const config = { ...jsonConfig, ...cliConfig }

    if (config.boost.length === 0) {
        config.boost = [16]
    }
    config.boost = config.boost.map((boost) => (boost > 16384 ? 16384 : boost)).map((boost) => (boost < 1 ? 1 : boost))

    if (!config.gpus) throw new Error(`"config.gpus" field is missing`)
    if (config.gpus.length === 0) throw new Error(`"config.gpus" field is empty`)
    const hasInvalidKeys = config.gpus.some((id) => !/^\d+$/.test(id))
    if (hasInvalidKeys) throw new Error(`"config.gpus" field has malformed keys`)
    const hasDuplicatedValue = new Set(config.gpus).size !== config.gpus.length
    if (hasDuplicatedValue) throw new Error(`"config.gpus" field has duplicated values`)
    if (!config.pool) throw new Error(`"config.pool" field is missing`)
    if (!config.wallet) throw new Error(`"config.wallet" field is missing`)
    if (!config.rig) throw new Error(`"config.rig" field is missing`)
    if (!config.binary) throw new Error(`"config.binary" field is missing`)

    const dataDir = resolve(resourcePath, 'data')
    const baseBinaryPath = resolve(resourcePath, 'bin')
    const minerPath = resolve(baseBinaryPath, config.binary)
    const version = '1.0.10'

    return { ...config, dataDir, baseBinaryPath, minerPath, version }
}
