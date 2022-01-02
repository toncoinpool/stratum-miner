/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { writeFile } from 'fs'
import { resolve } from 'path'
import readConfig from './config'
import log from './logger'
import readGPUs from './read-gpus'
import TonPoolClient from '.'

let isShuttingDown = false
const onShutdown: NodeJS.SignalsListener = (signal) => {
    if (isShuttingDown) {
        return undefined
    }

    isShuttingDown = true
    log.info(`${signal} received, shutting down...`)

    return void TonPoolClient.stop().finally(() => process.exit())
}

process.once('SIGHUP', onShutdown)
process.once('SIGINT', onShutdown)
process.once('SIGTERM', onShutdown)

void (async function main() {
    const config = readConfig()
    const gpus = await readGPUs(config.baseBinaryPath, config.boost, config.excludeGPUs, config.binary)
    TonPoolClient.start(config, gpus)

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

    const poolWallet = 'EQCUp88072pLUGNQCXXXDFJM3C5v9GXTjV7ou33Mj3r0Xv2W'
    let prevTimestamp = 0
    let prevBalance = '0.0000'

    const getBalance = () => {
        fetch(`https://api.ton.sh/getTransactions?address=${poolWallet}`)
            .then((res) => (res.status === 200 ? res.json() : { ok: false, error_code: res.status }))
            .then((transaction) => {
                if (!transaction.ok) return

                const lastBlock = transaction.result[0]

                // Check new block from POW giver
                if (lastBlock.timestamp > prevTimestamp && lastBlock.received?.nanoton / 10 ** 9 === 100) {
                    fetch(`https://pplns.toncoinpool.io/api/v1/public/miners/${config.wallet}`)
                        .then((res) => res.json())
                        .then((miner) => {
                            const balance = (miner.balance / 10 ** 9).toFixed(4)

                            // Check new balance because of pool cache
                            if (balance !== prevBalance) {
                                prevTimestamp = lastBlock.timestamp
                                prevBalance = balance

                                log.info(`balance: ${balance}`)
                            }
                        })
                        .catch((err) => log.error(`failed to get balance: ${err}`))
                }
            })
            .catch((err) => log.error(`failed to get transactions: ${err}`))
    }

    setInterval((): void => {
        if ([TonPoolClient.CONNECTED, TonPoolClient.MINING].includes(TonPoolClient.state) === false) {
            return undefined
        }

        const values = [...stats.values()]
        const hashrateList = values
            .reduce((acc, { hashrate }) => acc + `+${(hashrate / 1000).toFixed(2)}`, '')
            .substring(1)
        const hashrates = (values.reduce((acc, { hashrate }) => acc + hashrate, 0) / 1000).toFixed(2)
        const hs = values.length === 1 ? `${hashrateList} Ghash/s` : `${hashrateList}=${hashrates} Ghash/s`
        const accepted = values.reduce((acc, { accepted }) => acc + accepted, 0)
        const rejected = values.reduce((acc, { duplicate, invalid, stale }) => acc + duplicate + invalid + stale, 0)

        log.info(`hs: ${hs} | shares: ${accepted}|${rejected}`)
        getBalance()
    }, 1000 * 60).unref()

    if (['hiveos', 'msos', 'raveos'].includes(config.integration?.toLowerCase() || '')) {
        const started = Math.floor(Date.now() / 1000)
        const statsPath = resolve(config.dataDir, 'stats.json')

        const writeStats = () => {
            const values = [...stats.values()]
            const hs = values.map(({ hashrate }) => hashrate)
            const khs = hs.reduce((acc, current) => acc + current, 0) * 1000
            const acceptedTotal = values.reduce((acc, { accepted }) => acc + accepted, 0)
            const rejectedTotal = values.reduce(
                (acc, { duplicate, invalid, stale }) => acc + duplicate + invalid + stale,
                0
            )
            const json = {
                ar: [acceptedTotal, rejectedTotal],
                gpus: values,
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
