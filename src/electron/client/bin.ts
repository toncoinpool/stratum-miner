import { writeFile } from 'fs'
import { resolve } from 'path'
import readConfig from './config'
import log from './logger'
import readGPUs from './read-gpus'
import TonPoolClient from '.'

void (async function main() {
    const config = readConfig()
    const gpus = await readGPUs(config.baseBinaryPath, config.boost, config.excludeGPUs, config.binary)
    TonPoolClient.on('stop', () => process.exit())
    TonPoolClient.start(config, gpus)

    if (['hiveos', 'msos', 'raveos'].includes(config.integration?.toLowerCase() || '')) {
        const started = Math.floor(Date.now() / 1000)
        const statsPath = resolve(config.dataDir, 'stats.json')

        const defaultStats = gpus.map((gpu) => {
            const key = gpu.id
            const value = {
                accepted: 0,
                duplicate: 0,
                hashrate: 0,
                id: gpu.id,
                invalid: 0,
                stale: 0,
                type: gpu.type
            }

            return [key, value] as const
        })

        const stats = new Map(defaultStats)

        TonPoolClient.on('hashrate', (id, hashrate) => {
            const stat = stats.get(id)
            if (stat) stat.hashrate = Number(BigInt(hashrate) / BigInt(1e6))
        })
        TonPoolClient.on('submit', (id) => {
            const stat = stats.get(id)
            if (stat) stat.accepted++
        })
        TonPoolClient.on('submitDuplicate', (id) => {
            const stat = stats.get(id)
            if (stat) stat.duplicate++
        })
        TonPoolClient.on('submitInvalid', (id) => {
            const stat = stats.get(id)
            if (stat) stat.invalid++
        })
        TonPoolClient.on('submitStale', (id) => {
            const stat = stats.get(id)
            if (stat) stat.stale++
        })

        const writeStats = () => {
            const hs = [...stats.values()].map(({ hashrate }) => hashrate)
            const khs = hs.reduce((acc, current) => acc + current, 0) * 1000
            const acceptedTotal = [...stats.values()].reduce((acc, { accepted }) => acc + accepted, 0)
            const rejectedTotal = [...stats.values()].reduce(
                (acc, { duplicate, invalid, stale }) => acc + duplicate + invalid + stale,
                0
            )
            const json = {
                ar: [acceptedTotal, rejectedTotal],
                gpus: [...stats.values()],
                hs,
                khs,
                uptime: Math.floor(Date.now() / 1000) - started
            }

            writeFile(statsPath, JSON.stringify(json), (error) => {
                if (error) {
                    log.error(`failed to write stats.json: ${error.message}`)
                }
            })
        }

        writeStats()
        setInterval(() => writeStats(), 10000).unref()
    }
})().catch((error: Error) => log.error(`bin main error: ${error.message}`))
