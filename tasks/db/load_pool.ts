import { task } from "hardhat/config"
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types"
import { utils } from "ethers"
// import FactoryModel from "../../models"
import { DBConnector, loadAllFactory, loadFactory, savePoolModel } from "../../db"
import { boolean, int } from "hardhat/internal/core/params/argumentTypes"
import { WineryFactory } from "../../typechain"
import { FactoryModel } from "../../models"
import { Pool, Factory } from "../../class"
import { Db, ObjectId } from "mongodb"

task("load-pool", "Load pool from factory from saved address in DB")
  .addOptionalParam("all", "Load all pool from all factory ?", true, boolean)
  .addOptionalParam("maxrange", "Range of each load to network", 800, int)
  .addOptionalParam("retries", "Retry on load pool failed", 1, int)
  .addOptionalParam("address", "If all is false then set up address for factory")
  .setAction(async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment): Promise<void> => {
    if (taskArgs.all) {
      const models: FactoryModel[] = await loadAllFactory(hre.network.name)
      for (let index = 0; index < models.length; index++) {
        const element = models[index]
        const contract: WineryFactory = await hre.ethers.getContractAt(
          "WineryFactory",
          element.address
        )
        const factory = new Factory(element, contract)
        await loadPoolWithinMaxRange(
          factory,
          Number(taskArgs.maxrange),
          Number(taskArgs.retries),
          hre
        )
      }
    } else {
      const address: string = utils.getAddress(taskArgs.address)
      const element: FactoryModel = await loadFactory(hre.network.name, address)
      const contract: WineryFactory = await hre.ethers.getContractAt(
        "WineryFactory",
        element.address
      )
      const factory = new Factory(element, contract)
      await loadPoolWithinMaxRange(factory, taskArgs.maxrange, taskArgs.retries, hre)
    }
  })

async function loadPoolWithinMaxRange(
  factory: Factory,
  range: number,
  retries: number,
  hre: HardhatRuntimeEnvironment
) {
  console.log("allPairs: " + factory.model.allPairsLength)
  let times = Math.ceil(factory.model.allPairsLength / range)
  console.log("total times: " + times)
  let skipIndex = Math.floor(factory.model.loadedPool / range)
  for (let index = skipIndex; index < times; index++) {
    console.log("times: " + index)
    const end =
      range * (index + 1) > factory.model.allPairsLength
        ? factory.model.allPairsLength
        : range * (index + 1)
    console.log("start index: " + range * index)
    console.log("end index: " + end)
    let loadPoolPromise: Promise<any>[] = []
    for (let j = range * index; j < end; j++) {
      loadPoolPromise.push(loadPoolAndSave(factory, j, retries, hre))
    }
    try {
      await Promise.all(loadPoolPromise)
      const db = await DBConnector.connectToDatabase(hre.network.name)
      await db
        .collection("factory")
        .updateOne(
          { _id: new ObjectId(factory.model._id) },
          { $set: { loadedPool: end } },
          { upsert: true }
        )
    } catch (error) {
      console.log(error)
    }
  }
}

export async function loadPoolAndSave(
  factory: Factory,
  index: number,
  retries: number,
  hre: HardhatRuntimeEnvironment
) {
  let retriesCount = 0
  while (retriesCount <= (retries ?? 1)) {
    try {
      const address = await factory.contract.allPairs(index)
      const pool = await Pool.fromNetwork(
        address,
        factory.model.defaultSwapFee,
        hre,
        factory.model.isPoolHaveSwapfee
      )
      if (
        pool &&
        BigInt(pool.model.token0Reserve) > BigInt(1000000000000000000) &&
        BigInt(pool.model.token1Reserve) > BigInt(1000000000000000000)
      ) {
        console.log("Add pool: " + pool.model.address)
        pool.model.factory_address = factory.contract.address
        pool.model.index = index
        await savePoolModel(pool.model, hre.network.name)
      }
      return
    } catch (error) {
      console.log(error)
      retriesCount++
    }
  }

  console.log("Load pool at index: " + index + " failed after " + (retries ?? 1) + " tries")
}

// yarn hardhat add-factory --address <address> --defaultswapfee 17 --ishaveswapfee true --network localhost
