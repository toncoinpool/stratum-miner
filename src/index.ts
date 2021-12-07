import Client from "./client"
import readConfig from "./config"
import Miner from "./miner"

void (async function main() {
  const config = readConfig()
  console.log(`mining for wallet ${config.wallet}`)

  const miners = config.gpus.map(
    (id) => new Miner(Number.parseInt(id, 10), config.wallet, config.minerPath, config.dataDir)
  )

  console.log(`mining using ${miners.length} gpus`)

  console.log(`choosen pool is "${config.pool.replace("wss://", "")}"`)

  let reconnecting = false
  const client = new Client(config.pool, config.wallet, config.rig, config.version)
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

      const result: any = await client.subscribe()

      console.log("connection subscribed")

      miners.forEach((miner) => miner.setComplexity(result[1]))

      await client.authorize()

      console.log("connection authorized")
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
  await new Promise<void>((resolve) => client.once("open", resolve))

  miners.forEach((miner) => {
    miner.on("success", (solution) => {
      client.submit(solution).then(
        () => console.log("share submitted"),
        (error: Error) => console.error(`failed to submit share: ${error.message}`)
      )
    })
  })
})()
