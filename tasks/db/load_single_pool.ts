import { task } from "hardhat/config"
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types"
import { utils } from "ethers"
// import FactoryModel from "../../models"
import { DBConnector, loadAllFactory, loadFactory, savePoolModel } from "../../db"
import { boolean, int } from "hardhat/internal/core/params/argumentTypes"
import { WineryFactory } from "../../typechain"
import { FactoryModel } from "../../models"
import { loadPoolAndSave } from "./load_pool"
import { Factory } from "../../class"

task("load-single-pool", "Load pool from factory from saved address in DB")
  .addParam("address", "Factory Address")
  .addParam("index", "Factory Pool Index")
  .setAction(async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment): Promise<void> => {
    const contract: WineryFactory = await hre.ethers.getContractAt(
      "WineryFactory",
      taskArgs.address
    )

    const db = await DBConnector.connectToDatabase(hre.network.name)
    const doc = await db.collection("factory").findOne({ address: taskArgs.address })
    const model: FactoryModel = FactoryModel.fromDocument(doc!)

    const factory = new Factory(model, contract)
    await loadPoolAndSave(factory, taskArgs.index, 5, hre)
  })
// yarn hardhat load-single-pool --address 0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73 --index 11067 --network bscMainnet