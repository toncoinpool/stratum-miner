import { writeFile } from 'fs'
import { resolve } from 'path'
import { env } from 'process'
import readConfig from './config'
import log from './logger'
import TonPoolClient from '.'

const config = readConfig()

TonPoolClient.start(config)
TonPoolClient.on('stop', () => process.exit())

if (env.TONPOOL_IS_IN_HIVE) {
    const started = Math.floor(Date.now() / 1000)
    const statsPath = resolve(config.dataDir, 'stats.json')
    const hashrates = new Map(config.gpus.map((id) => [id, 0]))
    let acceptedShares = 0
    let rejectedShares = 0

    TonPoolClient.on('hashrate', (gpuId, hashrate) => hashrates.set(gpuId, Number(BigInt(hashrate) / BigInt(1e6))))
    TonPoolClient.on('submit', () => acceptedShares++)
    TonPoolClient.on('submitDuplicate', () => rejectedShares++)
    TonPoolClient.on('submitInvalid', () => rejectedShares++)
    TonPoolClient.on('submitStale', () => rejectedShares++)

    setInterval(() => {
        const hs = [...hashrates.entries()]
            .map<[number, number]>((arr) => [Number.parseInt(arr[0]), arr[1]])
            .sort((a, b) => a[0] - b[0])
            .map(([, hashrate]) => hashrate)
        const khs = hs.reduce((acc, current) => acc + current, 0) * 1000
        const stats = {
            ar: [acceptedShares, rejectedShares],
            hs,
            khs,
            uptime: Math.floor(Date.now() / 1000) - started
        }

        writeFile(statsPath, JSON.stringify(stats), (error) => {
            if (error) {
                log.error(`failed to write stats.json: ${error.message}`)
            }
        })
    }, 10000).unref()
}
