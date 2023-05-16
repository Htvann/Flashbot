import { PathModel, TokenModel, PoolModel } from "../models"
import * as mongoDB from "mongodb"
import { FactoryModel } from "../models"
import { DBConnector } from "./common"
import { Pool } from "../class"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { WineryPair } from "../typechain"
import { BatchPromise } from "../class/batch_promise"
// import { network } from "hardhat"

export async function loadAllFactory(network: string): Promise<FactoryModel[]> {
  const db: mongoDB.Db = await DBConnector.connectToDatabase(network)
  return await Promise.all(
    (await db.collection("factory").find({}).toArray()).map((item) => item as FactoryModel)
  )
}

export async function loadFactory(network: string, address: string): Promise<FactoryModel> {
  const db: mongoDB.Db = await DBConnector.connectToDatabase(network)
  const model = (await db.collection("factory").findOne({ address: address })) as FactoryModel
  return model
}

export async function loadPath(baseToken: string, network: string): Promise<PathModel[]> {
  const db: mongoDB.Db = await DBConnector.connectToDatabase(network)
  return (await db.collection("path").find({ baseToken: baseToken, active: true }).toArray()).map(
    (item) => item as PathModel
  )
}

export async function loadAllPath(network: string): Promise<PathModel[]> {
  const db: mongoDB.Db = await DBConnector.connectToDatabase(network)
  return (await db.collection("path").find({ active: true }).toArray()).map(
    (item) => item as PathModel
  )
}

export async function loadFrequentToken(network: string): Promise<TokenModel[]> {
  const db: mongoDB.Db = await DBConnector.connectToDatabase(network)
  return (await db.collection("token").find({ isFrequentToken: true }).toArray()).map(
    (item) => item as TokenModel
  )
}

export async function loadBaseToken(network: string): Promise<TokenModel[]> {
  const db: mongoDB.Db = await DBConnector.connectToDatabase(network)
  return (await db.collection("token").find({ isBaseToken: true }).toArray()).map(
    (item) => item as TokenModel
  )
}

export async function loadPoolRelatedToToken(token0: string, token1: string, network: string) {
  const db = await DBConnector.connectToDatabase(network)
  const pools: PoolModel[] = (
    await db
      .collection("pool")
      .find({
        $or: [
          { $and: [{ token0Address: token0 }, { token1Address: token1 }] },
          { $and: [{ token0Address: token1 }, { token1Address: token0 }] },
        ],
      })
      .toArray()
  ).map((item) => item as PoolModel)
  return pools
}

export async function getFrequentToken(network: string): Promise<TokenModel[]> {
  const db: mongoDB.Db = await DBConnector.connectToDatabase(network)
  return (await db.collection("token").find({ isFrequentToken: true }).toArray()).map(
    (item) => item as TokenModel
  )
}

export async function getBaseToken(network: string): Promise<TokenModel[]> {
  const db: mongoDB.Db = await DBConnector.connectToDatabase(network)
  return (await db.collection("token").find({ isBaseToken: true }).toArray()).map(
    (item) => item as TokenModel
  )
}

export async function loadAllPoolToMap(
  hre: HardhatRuntimeEnvironment,
  dbName?: string,
): Promise<Map<string, Pool>> {
  console.log("Start load pool")
  const db: mongoDB.Db = await DBConnector.connectToDatabase(dbName ?? hre.network.name)
  let allPool: Map<string, Pool> = new Map<string, Pool>()
  const docs = await db.collection("pool").find({ active: true }).toArray()

  const poolLoader = new BatchPromise<[PoolModel, WineryPair], any>(docs.length, async (index) => {
    const model = PoolModel.fromDocument(docs[index])
    const contract: WineryPair = await hre.ethers.getContractAt("WineryPair", model.address)
    return [model, contract]
  })
    .setMaxRetries(5)
    // .setBatchRange(3000)
    .setAfterBatchResolve(async (result: [PoolModel, WineryPair][]) => {
      console.log("Resolved: " + result.length + " items")
      for (let index = 0; index < result.length; index++) {
        const element = result[index]
        const pool = new Pool(element[0], element[1])
        if (allPool.get(element[0].address)) {
          console.log(element[0].address)
          console.log(index)
        }
        allPool.set(element[0].address, pool)
      }
    })

  await poolLoader.execute()

  console.log("Pool loaded")
  return allPool
}
