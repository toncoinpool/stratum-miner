/* eslint-disable @typescript-eslint/no-non-null-assertion */
import EventEmitter from 'events'
import { nextTick } from 'process'
import Client, { StratumError } from './client'
import { Config } from './config'
import log from './logger'
import Miner from './miner'
import { GPU } from './read-gpus'

interface TonPoolClient {
    emit(event: 'connect'): boolean
    emit(event: 'error', error: Error): boolean
    emit(event: 'hashrate', gpuId: string, hashrate: string): boolean
    emit(event: 'reconnect'): boolean
    emit(event: 'stop'): boolean
    emit(event: 'submit', gpuId: string): boolean
    emit(event: 'submitDuplicate', gpuId: string): boolean
    emit(event: 'submitInvalid', gpuId: string): boolean
    emit(event: 'submitStale', gpuId: string): boolean

    on(event: 'connect', listener: () => void): this
    on(event: 'error', listener: (error: Error) => void): this
    on(event: 'hashrate', listener: (gpuId: string, hashrate: string) => void): this
    on(event: 'reconnect', listener: () => void): this
    on(event: 'stop', listener: () => void): this
    on(event: 'submit', listener: (gpuId: string) => void): this
    on(event: 'submitDuplicate', listener: (gpuId: string) => void): this
    on(event: 'submitInvalid', listener: (gpuId: string) => void): this
    on(event: 'submitStale', listener: (gpuId: string) => void): this

    once(event: 'connect', listener: () => void): this
    once(event: 'error', listener: (error: Error) => void): this
    once(event: 'hashrate', listener: (gpuId: string, hashrate: string) => void): this
    once(event: 'reconnect', listener: () => void): this
    once(event: 'stop', listener: () => void): this
    once(event: 'submit', listener: (gpuId: string) => void): this
    once(event: 'submitDuplicate', listener: (gpuId: string) => void): this
    once(event: 'submitInvalid', listener: (gpuId: string) => void): this
    once(event: 'submitStale', listener: (gpuId: string) => void): this
}

class TonPoolClient extends EventEmitter {
    public readonly DISCONNECTED = 0
    public readonly CONNECTING = 1
    public readonly CONNECTED = 2
    public readonly RECONNECTING = 3
    public readonly MINING = 4
    public state:
        | TonPoolClient['DISCONNECTED']
        | TonPoolClient['CONNECTING']
        | TonPoolClient['CONNECTED']
        | TonPoolClient['RECONNECTING']
        | TonPoolClient['MINING'] = this.DISCONNECTED

    private client?: Client
    private miners: Miner[] = []

    constructor() {
        super()
    }

    start(config: Config, gpus: GPU[]): void {
        log.info(`starting client ${config.version}${config.binary ? ` using ${config.binary}` : ''}...`)

        if (gpus.length === 0) {
            log.error(`no GPUs were selected for mining`)

            return nextTick(() => this.emit('stop'))
        }

        log.info(`using ${gpus.length} GPUs:`)
        for (const gpu of gpus) {
            log.info(`  ${gpu.type} id ${gpu.id} boost ${gpu.boost} ${gpu.name}`)
        }

        if (!config.wallet) {
            log.error(`no wallet configured`)

            return nextTick(() => this.emit('stop'))
        }

        log.info(`mining for wallet ${config.wallet}`)

        const onError = (error: Error) => {
            log.error(error)

            if (this.listenerCount('error') > 0) {
                this.emit('error', error)
            }
        }

        for (const gpu of gpus) {
            const miner = new Miner(gpu, config.wallet, config.dataDir, config.iterations)
            miner.on('error', ({ message }) => onError(new Error(`miner error: ${message}`)))
            miner.on('hashrate', (hashrate) => this.emit('hashrate', miner.id, hashrate))

            this.miners.push(miner)
        }

        log.info(`chosen pool is "${config.pool.replace('wss://', '')}"`)

        let reconnecting = false
        this.client = new Client(config.pool, config.wallet, config.rig, config.version)
            .on('close', (code, reason) => {
                log.info(`connection closed with ${code} ${reason}`)
                this.miners.forEach((miner) => miner.stop())

                this.state = this.DISCONNECTED
                this.emit('stop')
            })
            .on('complexity', (complexity) => {
                this.miners.forEach((miner) => miner.setComplexity(complexity))
            })
            .on('error', ({ message }) => onError(new Error(`connection error: ${message}`)))
            .on('open', () => {
                reconnecting = false
                log.info('connection established')

                this.miners.forEach((miner) => miner.start())

                this.state = this.CONNECTED
                this.emit('connect')
            })
            .on('message', (message) => {
                if ('method' in message && message.method === 'mining.set_target') {
                    log.debug('mining.set_target')

                    this.state = this.MINING

                    this.miners.forEach((miner) => miner.setTarget(...message.params))
                }

                if ('method' in message && message.method === 'mining.notify') {
                    if (message.params[0] === 'expire') {
                        log.debug('mining.notify.expire')
                        this.miners.forEach((miner) => miner.setExpire(message.params[1]))
                    }
                }
            })
            .on('reconnect', () => {
                if (!reconnecting) {
                    log.warn('connection lost, reconnecting...')

                    reconnecting = true
                    this.state = this.RECONNECTING
                    this.emit('reconnect')

                    this.miners.forEach((miner) => miner.stop())
                }
            })

        log.info('connecting to the server...')

        this.state = this.CONNECTING

        this.miners.forEach((miner) => {
            miner.on('success', (solution) => {
                this.client!.submit(solution).then(
                    () => {
                        this.emit('submit', miner.id)
                    },
                    (error: Error) => {
                        const submitError = new Error(`failed to submit share: ${error.message}`)
                        log.warn(submitError)

                        if (this.listenerCount('error') > 0) {
                            this.emit('error', submitError)
                        }

                        if (error instanceof StratumError) {
                            if (error.code === 21) return this.emit('submitStale', miner.id)
                            if (error.code === 22) return this.emit('submitDuplicate', miner.id)
                            if (error.code === 23) return this.emit('submitInvalid', miner.id)
                        }

                        return undefined
                    }
                )
            })
        })
    }

    stop(): Promise<void> {
        log.info('stopping client...')

        this.miners.forEach((miner) => miner.stop())

        if (!this.client || this.client.closed) {
            return Promise.resolve()
        }

        return Promise.all([new Promise<void>((resolve) => this.once('stop', resolve)), this.client.destroy()]).then(
            () => {
                for (const miner of this.miners) {
                    miner.removeAllListeners()
                }

                this.miners = []
            }
        )
    }
}

const tonPoolClient = new TonPoolClient()
export default tonPoolClient
