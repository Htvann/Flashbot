import { task } from "hardhat/config"
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types"
import { DBConnector } from "../../db"

import {
  CyclicProfitCalculator,
  FlashswapMultiPool,
  MockERC20,
  WineryFactory,
  WineryPair,
  WineryRouter,
} from "../../typechain"
import { ConfigCache } from "../../class/custom_cache/config"
import { ObjectId, Document, WithId } from "mongodb"
import { PoolModel } from "../../models"
import { Pool } from "../../class"
import { BigNumber } from "ethers"

task("test-forking-cyclic", "Run cyclic to find profit")
  .addParam("database", "Database name")
  .setAction(async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment): Promise<void> => {
    const config = await ConfigCache.getInstance(taskArgs.database ?? hre.network.name)
    const currentTestCase = config.safeGetCacheObject<string>("current_test_case")

    const db = await DBConnector.connectToDatabase()
    const swapData = await db.collection("swapped").findOne({ _id: new ObjectId(currentTestCase) })

    const cyclic: string[] = swapData!["cyclicPath"]

    let pools: PoolModel[] = []
    for (let index = 0; index < cyclic.length; index++) {
      const element = cyclic[index]
      const doc = await db.collection("pool").findOne({ address: element })
      const pool: PoolModel = PoolModel.fromDocument(doc!)
      pools.push(pool)
    }

    const flashbot: FlashswapMultiPool = await hre.ethers.getContract("Flashbot")

    await flashbot.startSwapInMultiPool(
      pools.map((item) => item.toPoolStruct()),
      swapData!["baseToken"]!,
      swapData!["borrow"],
      "test"
    )
  })
// yarn hardhat test-forking-cyclic --database bscMainnet --network localhost
