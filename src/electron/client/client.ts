import EventEmitter from 'events'
import WebSocket, { RawData } from 'ws'
import log from './logger'

type ServerRequest =
    | { id: null; method: 'mining.set_target'; params: [string, string, string, string] }
    | { id: null; method: 'mining.notify'; params: ['expire', string] }
type ServerReply =
    | { id: number; error: [number, string, string | null]; result: null }
    | { id: number; error: null; result: unknown }
type Message = ServerRequest | ServerReply

export class StratumError extends Error {
    constructor(
        public method: string,
        public id: number,
        public code: number,
        public description: string,
        public extra: unknown = null
    ) {
        super(`"${method}" error: ${code} ${description}`)
    }
}

interface Client {
    emit(event: 'close', code: number, reason: string): boolean
    emit(event: 'complexity', complexity: string): boolean
    emit(event: 'error', error: Error): boolean
    emit(event: 'message', message: Message): boolean
    emit(event: 'open'): boolean
    emit(event: 'reconnect'): boolean

    on(event: 'close', listener: (code: number, reason: string) => void): this
    on(event: 'complexity', listener: (complexity: string) => void): this
    on(event: 'error', listener: (error: Error) => void): this
    on(event: 'message', listener: (message: Message) => void): this
    on(event: 'open', listener: () => void): this
    on(event: 'reconnect', listener: () => void): this

    once(event: 'close', listener: (code: number, reason: string) => void): this
    once(event: 'complexity', listener: (complexity: string) => void): this
    once(event: 'error', listener: (error: Error) => void): this
    once(event: 'message', listener: (message: Message) => void): this
    once(event: 'open', listener: () => void): this
    once(event: 'reconnect', listener: () => void): this
}

class Client extends EventEmitter {
    public closed = false

    private endpoint: string
    private destroyed = false
    private id = 1
    private reconnectInterval = 5000
    private reconnectTimeout: NodeJS.Timeout | undefined
    private version: string
    private wallet: string
    private rig: string
    private ws: WebSocket

    constructor(endpoint: string, wallet: string, rig: string, version: string) {
        super()
        this.endpoint = endpoint
        this.version = version
        this.wallet = wallet
        this.rig = rig
        this.ws = new WebSocket(this.endpoint, { perMessageDeflate: false })
            .on('close', (code, reason) => this.onClose(code, reason))
            .on('error', (error) => this.onError(error))
            .on('message', (data) => this.onMessage(data))
            .on('open', () => void this.onOpen())
    }

    destroy() {
        this.destroyed = true

        if (this.ws.readyState === WebSocket.CLOSED) {
            this.closed = true
            if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout)
            return void this.emit('close', 1001, 'Going Away')
        }

        return this.ws.readyState === WebSocket.OPEN ? this.ws.close(1001, 'Going Away') : this.ws.terminate()
    }

    submit(solution: [string, string, string, string]) {
        return this.request('mining.submit', solution)
    }

    subscribe() {
        return this.request('mining.subscribe', [`ton-pool-client/${this.version}`]) as Promise<[string, string]>
    }

    authorize() {
        return this.request('mining.authorize', [this.wallet, this.rig])
    }

    private onClose(code: number, reason: Buffer) {
        if (this.destroyed) {
            this.closed = true
            return this.emit('close', code, reason.toString())
        }

        this.ws.removeAllListeners('close')
        this.ws.removeAllListeners('error')
        this.ws.removeAllListeners('message')
        this.ws.removeAllListeners('open')

        this.reconnectTimeout = setTimeout(() => {
            if (!this.destroyed) {
                this.ws = new WebSocket(this.endpoint, { perMessageDeflate: false })
                    .on('close', (code, reason) => this.onClose(code, reason))
                    .on('error', (error) => this.onError(error))
                    .on('message', (data) => this.onMessage(data))
                    .on('open', () => void this.onOpen())
            }
        }, this.reconnectInterval)

        return this.emit('reconnect')
    }

    private onError(error: Error) {
        this.emit('error', error)
    }

    private onMessage(data: RawData) {
        let message

        try {
            message = JSON.parse(data.toString()) as Message
        } catch (error) {
            return void this.emit(
                'error',
                new Error(`failed to parse server message: ${data.toString()} with error: ${(error as Error).message}`)
            )
        }

        return void this.emit('message', message)
    }

    private async onOpen() {
        try {
            const [, complexity] = await this.subscribe()
            log.debug('connection subscribed')
            this.emit('complexity', complexity)

            await this.authorize()
            log.debug('connection authorized')

            this.emit('open')
        } catch (error) {
            this.emit('error', new Error(`${(error as Error).message}`))
            this.ws.terminate()
        }
    }

    private async request(method: string, params: unknown) {
        const id = this.id++

        await new Promise<void>((resolve, reject) =>
            this.ws.send(JSON.stringify({ id, method, params }), (err) => (err ? reject(err) : resolve()))
        )

        return new Promise((resolve, reject) => {
            const onTimeout = () => {
                this.ws.removeListener('close', onClose)
                this.removeListener('message', onResponse)
                this.ws.terminate()

                return reject(new Error(`"${method}" error: server did not respond for 10 seconds`))
            }
            const onResponse = (message: Message) => {
                // Skip other messages with different ids
                if (message.id !== id) return undefined

                this.ws.removeListener('close', onClose)
                this.removeListener('message', onResponse)
                clearTimeout(timeout)

                return message.error === null
                    ? resolve(message.result)
                    : reject(new StratumError(method, id, message.error[0], message.error[1], message.error[2]))
            }
            const onClose = () => {
                this.removeListener('message', onResponse)
                clearTimeout(timeout)

                return reject(new Error(`"${method}" error: connection closed`))
            }

            this.ws.once('close', onClose)
            this.on('message', onResponse)
            const timeout = setTimeout(onTimeout, 10000)
        })
    }
}

export default Client
