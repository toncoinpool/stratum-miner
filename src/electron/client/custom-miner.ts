import { execFile } from 'child_process'
import { BitString, Cell } from 'ton'
import Miner from './miner'

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

export default class CustomMiner extends Miner {
    protected run(): void {
        // once stopped, calling start() followed by setTarget() will start the mining loop again
        if (this.stopped) {
            return undefined
        }

        const currentExpire = this.expired

        this.ref = execFile(
            this.minerPath,
            [
                '-vv',
                ...['-g', this.id.toString()],
                ...['-F', this.boost.toString()],
                ...['-t', '100'],
                ...['-e', currentExpire],
                this.wallet,
                ...[this.seed, this.complexity, this.iterations, this.giver],
                this.solutionPath
            ],
            { timeout: 0 },
            (error) => {
                this.ref = undefined

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
                if (error && error.code && error.code > 1) {
                    this.emit("error", new Error(`[${this.id}] miner had unexpected exit code ${error.code} with error: ${error.message.trim()}`)) // prettier-ignore
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
}
