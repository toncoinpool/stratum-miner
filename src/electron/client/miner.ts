import { ChildProcess, execFile } from 'child_process'
import EventEmitter from 'events'
import { resolve } from 'path'
import { BitString, Cell } from 'ton'
import log from './logger'
import { GPU } from './read-gpus'

interface MinedBody {
    op?: bigint
    flags?: bigint
    expire?: bigint
    whom?: bigint
    rdata1?: bigint
    rseed?: bigint
    rdata2?: bigint
}

const getBitStringSlices = (bits: BitString, slices: number[]): bigint[] => {
    if (!slices.length || !bits.length) return []

    let from = 0

    return slices.map((slice) => getBitStringSliceBigInt(bits, from, (from += slice)))
}

const getBitStringSliceBigInt = (bits: BitString, from: number, to: number): bigint => {
    const slice = bits.toString().slice(from, to)

    return BigInt(`0b${slice || 0}`)
}

const parseMinedBody = (bits: BitString): MinedBody => {
    const slices = [32, 8, 32, 256, 256, 128, 256]
    const [op, flags, expire, whom, rdata1, rseed, rdata2] = getBitStringSlices(bits, slices)
    const parsed: MinedBody = { op, flags, expire, whom, rdata1, rseed, rdata2 }

    return parsed
}

export interface Benchmark extends EventEmitter {
    on(event: 'done', listener: (error: Error | null, result?: [number, number]) => void): this
    on(event: 'progress', listener: (progress: number) => void): this

    once(event: 'done', listener: (error: Error | null, result?: [number, number]) => void): this
    once(event: 'progress', listener: (progress: number) => void): this
}

interface Miner {
    emit(event: 'error', error: Error): boolean
    emit(event: 'hashrate', hashrate: string): boolean
    emit(event: 'success', solution: [string, string, string, string]): boolean

    on(event: 'error', listener: (error: Error) => void): this
    on(event: 'hashrate', listener: (hashrate: string) => void): this
    on(event: 'success', listener: (solution: [string, string, string, string]) => void): this

    once(event: 'error', listener: (error: Error) => void): this
    once(event: 'hashrate', listener: (hashrate: string) => void): this
    once(event: 'success', listener: (solution: [string, string, string, string]) => void): this
}

class Miner extends EventEmitter {
    public id: string

    protected expired = ''
    protected complexity = ''
    protected giver = ''
    protected gpu: GPU
    protected iterations: string
    protected ref?: ChildProcess = undefined
    protected seed = ''
    protected solutionPath: string
    protected stopped = false
    protected wallet: string

    constructor(gpu: GPU, wallet: string, dataDir: string, iterations: string) {
        super()
        this.gpu = gpu
        this.id = gpu.id
        this.iterations = iterations
        this.solutionPath = resolve(dataDir, `${this.id}-mined.boc`)
        this.wallet = wallet
    }

    // TODO: add prototype method for stopping the benchmark
    static benchmark(bin: string, id: number, timeout = 10): Benchmark {
        const events: Benchmark = new EventEmitter()
        const child = execFile(
            resolve(__dirname, '..', '..', 'bin', bin),
            [
                ...['-vv', '-g', id.toString(10), '-B', '-t', timeout.toString(10)],
                'kQBWkNKqzCAwA9vjMwRmg7aY75Rf8lByPA9zKXoqGkHi8SM7',
                '229760179690128740373110445116482216837',
                '5391989333430127958933403017403926134727428884508114496220722049840',
                '9223372036854775807'
            ],
            (error, stdout, stderr) => {
                if (error) {
                    const lines = error.message.trim().split('\n')
                    // remove colors and leading log tags
                    const rawLine = (lines[lines.length - 1] || 'unknown error')
                        .replace('\u001b[1;36m', '')
                        .replace('\u001b[1;31m', '')
                        .replace('\u001b[0m', '')
                        .replace(/^\[[^\]]+\]\[[^\]]+\]\[[^\]]+\]/, '')

                    return events.emit('done', new Error(rawLine))
                }

                const [, boost = '16'] = stderr.match(/best boost factor: +(\d+)/) || []
                const [, hashrate = '0'] = stderr.match(/best speed: +(\d+)/) || []

                return events.emit('done', null, [Number.parseInt(boost, 10), Number.parseInt(hashrate, 10)])
            }
        )

        if (child.stderr) {
            const step = /cuda/.test(bin) ? 6 : 9
            let attempt = 0

            child.stderr.on('data', (line: string) => {
                if (/START MINER/.test(line)) {
                    // progress is approximate and can slow down towards the end
                    events.emit('progress', step * attempt++)
                }
            })
        }

        return events
    }

    setComplexity(complexity: string) {
        this.complexity = complexity
    }

    setExpire(expire: string) {
        this.expired = expire

        // we were possibly waiting for new expire
        if (!this.ref) {
            this.run()
        }
    }

    setTarget(seed: string, expired: string, giver: string, wallet: string) {
        this.seed = seed
        this.expired = expired
        this.giver = giver
        this.wallet = wallet

        this.ref ? this.ref.kill() : this.run()
    }

    protected run(): void {
        // once stopped, calling start() followed by setTarget() will start the mining loop again
        if (this.stopped) {
            return undefined
        }

        const currentExpire = this.expired

        log.debug(`[${this.id}] miner.run`)

        this.ref = execFile(
            this.gpu.minerPath,
            [
                '-vv',
                ...['-g', this.gpu.deviceId.toString()],
                ...(this.gpu.type === 'OpenCL' ? ['-p', this.gpu.platformId.toString()] : []),
                ...['-F', this.gpu.boost.toString()],
                ...['-e', currentExpire],
                this.wallet,
                ...[this.seed, this.complexity, this.iterations, this.giver],
                this.solutionPath
            ],
            { timeout: 0 },
            (error, stdout, stderr) => {
                log.debug(`[${this.id}] miner.run done ${this.ref?.killed} ${error?.code} ${error?.signal}`)

                this.ref = undefined

                // do not emit errors when closed manually on reconnect or shutdown
                if (this.stopped) {
                    return undefined
                }
                if (error && /expire_base [<>]=/.test(error.message)) {
                    // expire changed while were starting the miner
                    if (currentExpire !== this.expired) {
                        return this.run()
                    }

                    const offset = Number.parseInt(currentExpire) - Math.floor(Date.now() / 1000)
                    const signedOffset = `${offset >= 0 ? '+' : ''}${offset}`
                    this.emit("error", new Error(`[${this.id}] miner error: invalid expire ${signedOffset}, waiting for new one...`)) // prettier-ignore

                    return undefined // no reason to restart the miner, we'll get the same error
                }
                if (error && (error.code || error.signal === 'SIGABRT')) {
                    this.emit("error", new Error(`[${this.id}] miner error ${error.code || 'null'} ${error.signal || 'null'}:\n${stderr.trim()}`)) // prettier-ignore
                }

                return this.run()
            }
        )

        this.ref.stderr?.on('data', (line: string): void => {
            const [, solution] = line.match(/FOUND BOC: (\w+)/) || []

            if (solution) {
                try {
                    const mined = Cell.fromBoc(solution)
                    const body = mined[0]?.refs[0]?.bits

                    if (!body) {
                        return void this.emit('error', new Error('parsed invalid boc'))
                    }

                    const { expire, rdata1, rseed } = parseMinedBody(body)

                    return void this.emit('success', [
                        expire?.toString() || '',
                        rdata1?.toString() || '',
                        rseed?.toString() || '',
                        ''
                    ])
                } catch (error) {
                    return void this.emit('error', new Error(`error parsing boc: ${(error as Error).message}`))
                }
            }

            if (/\[ mining in progress, /.test(line)) {
                const [, hashrate] = line.match(/instant speed: (\d+\.?\d*) Mhash\/s/) || []

                if (!hashrate) {
                    return undefined
                }

                const value = BigInt(Math.round(Number.parseFloat(hashrate))) * BigInt(1e6)

                return void this.emit('hashrate', value.toString())
            }
        })
    }

    start() {
        this.stopped = false
    }

    stop(): void {
        if (this.stopped) {
            return undefined
        }

        this.stopped = true
        this.ref?.kill()
    }
}

export default Miner
