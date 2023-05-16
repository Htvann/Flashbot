// import { task } from "hardhat/config"
// import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types"
// import { calculateChances, calcDebtForMaximumProfitFromMultiPool } from "../../utils"
// import {
//   DBConnector,
//   getBaseToken,
//   loadAllPath,
//   loadAllPoolToMap,
//   loadPath,
//   savePoolModel,
// } from "../../db"

// import { boolean } from "hardhat/internal/core/params/argumentTypes"
// import { FlashswapMultiPool, WineryERC20 } from "../../typechain"
// import { Pool } from "../../class"
// import { BigNumber } from "ethers"
// import { BatchPromise } from "../../class/batch_promise"
// import { GasEstimator } from "../../class/gas_estimator"
// import { CyclicRunner } from "../../class/cyclic_runner"
// import { ConfigCache } from "../../class/custom_cache/config"
// import { ObjectId, Document } from "mongodb"
// import { PoolModel } from "../../models"

// task("test-cyclic", "Run cyclic to find profit")
//   .addOptionalParam("dbname", "Database name")
//   .setAction(async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment): Promise<void> => {
//     const config = await ConfigCache.getInstance(taskArgs.dbname ?? hre.network.name)
//     const currentTestCase = config.safeGetCacheObject<string>("current_test_case")
//     await hre.deployments.fixture(["cyclic-test"])
//     const db = await DBConnector.connectToDatabase()
//     const swapData: Document = await db
//       .collection("swapped")
//       .find({ _id: new ObjectId(currentTestCase) })

//     const cyclic: string[] = swapData["cyclicPath"]
//     for (let index = 0; index < cyclic.length; index++) {
//       const element = cyclic[index]
//       const pool: PoolModel = PoolModel.fromDocument(
//         await db.collection("pool").find({ address: cyclic[index] })
//       )
//     }

//     // rawCal = calculateChances(this.cyclic, this.baseToken)
//     // if (!this.rawCal.isProfitable) return
//     // this.optimalEst = await calcDebtForMaximumProfitFromMultiPool(
//     //   this.cyclic,
//     //   this.rawCal.tokenPath
//     // )
//   })
