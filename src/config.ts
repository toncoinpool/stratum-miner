import { readFileSync } from "fs"
import { resolve } from "path"

interface ConfigJson {
  gpus: string[]
  pool: string
  wallet: string
  rig: string
  binary: string
}

interface Config extends ConfigJson {
  dataDir: string
  minerPath: string
  version: string
}

const updateFromEnv = (config: ConfigJson) => {
  const { MINER_GPUS, MINER_WALLET, MINER_RIG, MINER_POOL, MINER_BINARY } = process.env

  config.binary = MINER_BINARY ?? config.binary
  config.pool = MINER_POOL ?? config.pool
  config.wallet = MINER_WALLET ?? config.wallet
  config.rig = MINER_RIG ?? config.rig
  config.gpus = MINER_GPUS ? MINER_GPUS.replace(/ /g, "").split(",") : config.gpus
}

export default function readConfig(): Config {
  let config: ConfigJson
  try {
    config = JSON.parse(readFileSync(resolve(__dirname, "..", "config", `config.json`), "utf8")) as ConfigJson
  } catch (error) {
    throw new Error(`failed to parse config: ${(error as Error).message}`)
  }

  updateFromEnv(config)

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

  const dataDir = resolve(__dirname, "..", "data")
  const minerPath = resolve(__dirname, "..", "bin", config.binary)
  const version = "1.0.0"

  return { ...config, dataDir, minerPath, version }
}
