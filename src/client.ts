import EventEmitter from "events"
import WebSocket, { RawData } from "ws"

type ServerRequest = { id: null; method: "mining.set_target"; params: [string, string, string, string] }
type ServerReply =
  | { id: number; error: [number, string, string | null]; result: null }
  | { id: number; error: null; result: unknown }
type Message = ServerRequest | ServerReply

interface Client {
  emit(event: "close", code: number, reason: string): boolean
  emit(event: "error", error: Error): boolean
  emit(event: "message", message: Message): boolean
  emit(event: "open"): boolean
  emit(event: "reconnect"): boolean

  on(event: "close", listener: (code: number, reason: string) => void): this
  on(event: "error", listener: (error: Error) => void): this
  on(event: "message", listener: (message: Message) => void): this
  on(event: "open", listener: () => void): this
  on(event: "reconnect", listener: () => void): this

  once(event: "close", listener: (code: number, reason: string) => void): this
  once(event: "error", listener: (error: Error) => void): this
  once(event: "message", listener: (message: Message) => void): this
  once(event: "open", listener: () => void): this
  once(event: "reconnect", listener: () => void): this
}

function heartbeat(this: any, stop = false) {
  clearTimeout(this.pingTimeout)

  if (!stop) {
    // Delay should be equal to the interval at which your server
    // sends out pings plus a conservative assumption of the latency.
    this.pingTimeout = setTimeout(() => {
      this.terminate()
    }, 5000 + 1000)
  }
}

class Client extends EventEmitter {
  private endpoint: string
  private destroyed = false
  private id = 1
  private reconnectInterval = 5000
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
      .on("close", (code, reason) => this.onClose(code, reason))
      .on("error", (error) => this.onError(error))
      .on("message", (data) => this.onMessage(data))
      .on("open", () => this.onOpen())
      .on("ping", () => this.onPing())
  }

  destroy() {
    this.destroyed = true
    this.ws.readyState === WebSocket.OPEN ? this.ws.close(1001, "Going Away") : this.ws.terminate()
  }

  submit(solution: [string, string, string, string]) {
    return this.request("mining.submit", solution)
  }

  subscribe() {
    return this.request("mining.subscribe", [`ton-pool-client/${this.version}`])
  }

  authorize() {
    return this.request("mining.authorize", [this.wallet, this.rig])
  }

  private onClose(code: number, reason: Buffer) {
    if (this.destroyed) {
      heartbeat.bind(this.ws, true)

      return this.emit("close", code, reason.toString())
    }

    this.ws.removeAllListeners("close")
    this.ws.removeAllListeners("error")
    this.ws.removeAllListeners("message")
    this.ws.removeAllListeners("open")

    setTimeout(() => {
      if (!this.destroyed) {
        this.ws = new WebSocket(this.endpoint, { perMessageDeflate: false })
          .on("close", (code, reason) => this.onClose(code, reason))
          .on("error", (error) => this.onError(error))
          .on("message", (data) => this.onMessage(data))
          .on("open", () => this.onOpen())
          .on("ping", () => this.onPing())
      }
    }, this.reconnectInterval)

    return this.emit("reconnect")
  }

  private onError(error: Error) {
    this.emit("error", error)
  }

  private onMessage(data: RawData) {
    let message

    try {
      message = JSON.parse(data.toString()) as Message
    } catch (error) {
      return void this.emit(
        "error",
        new Error(`failed to parse server message: ${data.toString()} with error: ${(error as Error).message}`)
      )
    }

    return void this.emit("message", message)
  }

  private onOpen() {
    this.emit("open")
    this.onPing()
  }

  private onPing() {
    heartbeat.bind(this.ws)
  }

  private async request(method: string, params: unknown) {
    const id = this.id++

    console.log({ id, method, params })

    await new Promise<void>((resolve, reject) =>
      this.ws.send(JSON.stringify({ id, method, params }), (err) => (err ? reject(err) : resolve()))
    )

    return new Promise((resolve, reject) => {
      const onResponse = (message: Message) => {
        // Skip other messages with different ids
        if (message.id !== id) return undefined

        this.removeListener("message", onResponse)

        return message.error === null
          ? resolve(message.result)
          : reject(new Error(`"${method}" error: ${message.error[0]} ${message.error[1]}`))
      }

      this.on("message", onResponse)
    })
  }
}

export default Client
