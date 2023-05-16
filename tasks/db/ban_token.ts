import { task } from "hardhat/config"
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types"
import { ObjectId } from "mongodb"
import { BatchPromise } from "../../class"
// import FactoryModel from "../../models"
import { DBConnector, loadAllPath } from "../../db"
import { PoolModel, TokenModel } from "../../models"

task("ban-token", "Load pool from factory from saved address in DB")
  .addParam("address", "Token Address")
  .setAction(async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment): Promise<void> => {
    
    const db = await DBConnector.connectToDatabase(hre.network.name)
    const pools = (await db.collection("pool").find({ active: true }).toArray()).map((item) =>
      PoolModel.fromDocument(item)
    )
    let poolInactive: string[] = []

    let batchPromise = new BatchPromise(pools.length, async (it) => {
      const element = pools[it]

      if (element.token0Address == taskArgs.address || element.token1Address == taskArgs.address) {
        poolInactive.push(element.address)
        await db.collection("pool").updateOne({ _id: element._id }, { $set: { active: false } })
      }
    })

    await batchPromise.execute()
    
    const token = TokenModel.fromDocument(
      (await db.collection("token").findOne({ address: taskArgs.address }))!
    )

    await db
      .collection("token")
      .updateOne({ _id: token._id }, { $set: { isBaseToken: false, isFrequentToken: false } })

    const allPath = await loadAllPath(hre.network.name)

    batchPromise = new BatchPromise(allPath.length, async (it) => {
      const element = allPath[it]
      for (let index = 0; index < element.path.length; index++) {
        if (poolInactive.includes(element.path[index])){
          await db.collection("path").updateOne({ _id: element._id }, { $set: { active: false } })
          break
        }
      }
    })

    await batchPromise.execute()
  })
