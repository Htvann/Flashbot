import { ObjectId } from "mongodb"
import { DBConnector } from "."
import { PoolModel, TokenModel } from "../models"

export async function checkFrequentToken(network: string, isTesting?: boolean) {
  // console.log("network: " + network)
  const db = await DBConnector.connectToDatabase(network)
  const allPool = await (
    await db.collection("pool").find().toArray()
  ).map((item) => PoolModel.fromDocument(item))

  let tokenMap: Map<string, number> = new Map<string, number>()

  for (let index = 0; index < allPool.length; index++) {
    const element = allPool[index]
    tokenMap.set(element.token0Address, (tokenMap.get(element.token0Address) ?? 0) + 1)
    tokenMap.set(element.token1Address, (tokenMap.get(element.token1Address) ?? 0) + 1)
  }

  for (const [key, value] of tokenMap) {
    const token: TokenModel = new TokenModel(key, value)
    if (isTesting ?? false) {
      token.isBaseToken = true
      token.isFrequentToken = true
    }

    await db
      .collection("token")
      .updateOne({ _id: new ObjectId(token._id) }, { $set: token }, { upsert: true })
  }
}
