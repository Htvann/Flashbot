import { task } from "hardhat/config"
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types"
import { calculateChances, calcDebtForMaximumProfitFromMultiPool } from "../../utils"
import {
  DBConnector,
  getBaseToken,
  loadAllPath,
  loadAllPoolToMap,
  loadPath,
  savePoolModel,
} from "../../db"

import { boolean } from "hardhat/internal/core/params/argumentTypes"
import { CyclicProfitCalculator, FlashswapMultiPool, WineryERC20 } from "../../typechain"
import { Pool } from "../../class"
import { BigNumber } from "ethers"
import { BatchPromise } from "../../class/batch_promise"
import { GasEstimator } from "../../class/gas_estimator"
import { CyclicRunner } from "../../class/cyclic_runner"

task("run-cyclic", "Run cyclic to find profit")
  .addParam("flashbot", "Flashbot Address")
  .addOptionalParam("reload", "Reload pool reserve before cyclic", true, boolean)
  .addOptionalParam("sync", "Listen to on chain sync event", true, boolean)
  .addOptionalParam("dbname", "Database name")
  .addOptionalParam(
    "basetoken",
    "The address of basetoken, if not set any the task will go all base token exist in db",
    ""
  )
  .setAction(async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment): Promise<void> => {
    const flashbot: FlashswapMultiPool = await hre.ethers.getContractAt(
      "FlashswapMultiPool",
      taskArgs.flashbot
    )

    const dbName: string | undefined = taskArgs.dbname

    const allPath = await loadAllPath(dbName ?? hre.network.name)

    let allPoolMap: Map<string, Pool> = await loadAllPoolToMap(hre, dbName)

    console.log("Pool size: " + allPoolMap.size)
    console.log("Path length: " + allPath.length)

    // let poolAddress = Array.from(allPoolMap.keys())

    let unStorePool: Set<Pool> = new Set<Pool>()

    let poolsAddress = Array.from(allPoolMap.keys())

    let gasEstimator = await GasEstimator.getInstance(dbName ?? hre.network.name)

    const reservePoolSyncer = new BatchPromise(poolsAddress.length, async (index) => {
      const pool = allPoolMap.get(poolsAddress[index])!

      if (taskArgs.reload) {
        await pool.reload(unStorePool)
      }

      if (taskArgs.sync) {
        await pool.attachOnchainSyncEventListener(unStorePool)
      }
    })
      .setBatchRange(500)
      .setMaxRetries(5)

    await reservePoolSyncer.execute()

    console.log("Load base token")

    let baseToken =
      taskArgs.baseToken != ""
        ? (await getBaseToken(dbName ?? hre.network.name)).map((item) => item.address)
        : [taskArgs.baseToken]

    console.log(baseToken.length)

    const cyclic = new CyclicRunner(
      baseToken,
      flashbot,
      allPath,
      gasEstimator,
      allPoolMap,
      hre,
      unStorePool,
      await DBConnector.connectToDatabase(dbName ?? hre.network.name),
      dbName
    )

    await cyclic.execute()
  })
