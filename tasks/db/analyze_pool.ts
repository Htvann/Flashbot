import { task } from "hardhat/config"
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types"
import { PathModel, TokenModel } from "../../models"
import { DBConnector, checkFrequentToken } from "../../db"
import { ObjectId } from "mongodb"
import { WineryERC20 } from "../../typechain"
import { boolean, int } from "hardhat/internal/core/params/argumentTypes"
import axios, { AxiosResponse } from "axios"

task("analyze-pool", "Add pool plan usage").setAction(
  async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment): Promise<void> => {
    await createPoolPlanUsage(hre.network.name)
  }
)

async function createPoolPlanUsage(dbName: string) {
  const db = await DBConnector.connectToDatabase(dbName)
  const allPath = await (
    await db.collection("path").find({}).toArray()
  ).map((item) => item as PathModel)
  let poolMap: Map<string, number> = new Map<string, number>()
  for (let index = 0; index < allPath.length; index++) {
    const element = allPath[index]
    for (let jindex = 0; jindex < element.path.length; jindex++) {
      poolMap.set(element.path[jindex], (poolMap.get(element.path[jindex]) ?? 0) + 1)
    }
  }

  for (const [key, value] of poolMap) {
    console.log(value)
    await db
      .collection("pool")
      .updateOne(
        { _id: new ObjectId(key.slice(2, 26)) },
        { $set: { usage: value, active: true } },
        { upsert: true }
      )
  }
  console.log("Size: " + poolMap.size)
}
