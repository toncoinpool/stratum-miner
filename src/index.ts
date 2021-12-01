import Client from "./client"
import Miner from "./miner"
import readConfig from "./config"

void (async function main() {
  const config = readConfig()
  console.log(`mining for wallet ${config.wallet}`)

  const miners = Object.entries(config.gpus)
    .filter(([, enabled]) => enabled)
    .map(([id]) => new Miner(Number.parseInt(id, 10), config.wallet, config.minerPath, config.dataDir))

  console.log(`mining using ${miners.length} gpus`)

  let reconnecting = false
  const client = new Client(config.serverAddress, config.wallet, config.version)
    .on("close", (code, reason) => {
      console.log(`connection closed with ${code} ${reason}`)

      miners.forEach((miner) => miner.shutdown())
    })
    .on("error", ({ message }) => console.error(`connection error: ${message}`))
    .on("open", async () => {
      reconnecting = false
      console.log("connection established")

      const result: any = await client.subscribe()

      miners.forEach((miner) => miner.setComplexity(result[1]))

      await client.authorize()
    })
    .on("message", (message) => {
      if ("method" in message && message.method === "mining.set_target") {
        console.log(message)

        miners.forEach((miner) => miner.setTarget(...message.params))
      }
    })
    .on("reconnect", () => {
      if (!reconnecting) {
        console.log("connection lost, reconnecting...")
        reconnecting = true
      }
    })

  console.log("connecting to the server...")
  await new Promise<void>((resolve) => client.once("open", resolve))

  miners.forEach((miner) => {
    miner.on("success", (solution) => {
      client.submit(solution).then(
        () => console.log(`solution submitted`),
        (error: Error) => console.error(`failed to submit solution: ${error.message}`)
      )
    })
  })
})()
