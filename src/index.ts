import Client from "./client"
import { Config } from "./config"
import Miner from "./miner"

let client: Client

const start = (config: Config) => {
  console.log("starting client...")
  console.log(`mining for wallet ${config.wallet}`)

  const miners = config.gpus.map(
    (id) => new Miner(Number.parseInt(id, 10), config.wallet, config.minerPath, config.dataDir)
  )

  console.log(`mining using ${miners.length} gpus`)

  console.log(`choosen pool is "${config.pool.replace("wss://", "")}"`)

  let reconnecting = false
  client = new Client(config.pool, config.wallet, config.rig, config.version)
    .on("close", (code, reason) => {
      console.log(`connection closed with ${code} ${reason}`)

      miners.forEach((miner) => miner.stop())
    })
    .on("error", ({ message }) => console.error(`connection error: ${message}`))
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    .on("open", async () => {
      reconnecting = false
      miners.forEach((miner) => miner.start())
      console.log("connection established")

      // TODO: move subscribe() and authorize() inside the Client
      // TODO: do not reconnect when server rejects subscribe or authorize requests
      try {
        const result: any = await client.subscribe()
        console.log("connection subscribed")
        miners.forEach((miner) => miner.setComplexity(result[1]))

        await client.authorize()
        console.log("connection authorized")
      } catch (error) {
        console.log((<Error>error).message)
      }
    })
    .on("message", (message) => {
      if ("method" in message && message.method === "mining.set_target") {
        console.log("new job received")

        miners.forEach((miner) => miner.setTarget(...message.params))
      }
    })
    .on("reconnect", () => {
      if (!reconnecting) {
        console.log("connection lost, reconnecting...")
        reconnecting = true
        miners.forEach((miner) => miner.stop())
      }
    })

  console.log("connecting to the server...")

  miners.forEach((miner) => {
    miner.on("success", (solution) => {
      client.submit(solution).then(
        () => console.log("share submitted"),
        (error: Error) => console.error(`failed to submit share: ${error.message}`)
      )
    })
  })
}

const stop = (): Promise<void> => {
  console.log("stopping client...")

  if (!client || client.closed) {
    return Promise.resolve()
  }

  return Promise.all([new Promise((resolve) => client.once("close", resolve)), client.destroy()]).then(() => undefined)
}

const TonPoolClient = { start, stop }
export default TonPoolClient
