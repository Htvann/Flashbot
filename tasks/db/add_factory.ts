import { task } from "hardhat/config"
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types"
import { utils } from "ethers"
import { FactoryModel } from "../../models"
import { DBConnector } from "../../db"
import { ObjectId } from "mongodb"
import { WineryFactory } from "../../typechain"
import { boolean, int } from "hardhat/internal/core/params/argumentTypes"

task("add-factory", "Add factory for analyze for current network")
  .addParam("address", "The factory's address")
  .addParam("defaultswapfee", "The factory's default swapfee", 10, int)
  .addOptionalParam(
    "ishaveswapfee",
    "Is each pool of factory have their own fee, default is false",
    false,
    boolean
  )
  .setAction(async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment): Promise<void> => {
    const model = new FactoryModel(
      utils.getAddress(taskArgs.address),
      taskArgs.ishaveswapfee,
      taskArgs.defaultswapfee,
      0
    )

    const contract: WineryFactory = await hre.ethers.getContractAt("WineryFactory", model.address)
    model.allPairsLength = (await contract.allPairsLength()).toNumber()
    const db = await DBConnector.connectToDatabase(hre.network.name)
    await db
      .collection("factory")
      .updateOne({ _id: new ObjectId(model._id) }, { $set: model }, { upsert: true })
  })
