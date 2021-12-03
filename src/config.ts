import { readFileSync } from "fs"
import { resolve } from "path"

interface ConfigJson {
  gpus: { [id: string]: boolean }
  pool: string
  wallet: string
  binary: string
}

interface Config extends ConfigJson {
  dataDir: string
  minerPath: string
  version: string
}

export default function readConfig(): Config {
  let config: ConfigJson
  try {
    config = JSON.parse(readFileSync(resolve(__dirname, "..", "config", `config.json`), "utf8")) as ConfigJson
  } catch (error) {
    throw new Error(`failed to parse config: ${(error as Error).message}`)
  }

  if (!config.gpus) throw new Error(`"config.gpus" field is missing`)
  if (Object.entries(config.gpus).length === 0) throw new Error(`"config.gpus" field is empty`)
  const hasInvalidKeys = Object.keys(config.gpus).some((key) => !/^\d+$/.test(key))
  if (hasInvalidKeys) throw new Error(`"config.gpus" field has malformed keys`)
  const allGpusDisabled = Object.values(config.gpus).every((v) => !v)
  if (allGpusDisabled) throw new Error(`"config.gpus" field must have at least one enabled entry`)
  if (!config.pool) throw new Error(`"config.pool" field is missing`)
  if (!config.wallet) throw new Error(`"config.wallet" field is missing`)
  if (!config.binary) throw new Error(`"config.binary" field is missing`)

  const dataDir = resolve(__dirname, "..", "data")
  const minerPath = resolve(__dirname, "..", "bin", config.binary)
  const version = "1.0.0"

  return { ...config, dataDir, minerPath, version }
}
