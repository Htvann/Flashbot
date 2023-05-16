import { ObjectId } from "mongodb"
import { PoolModel } from "../models"
import { DBConnector } from "./common"

export async function savePoolModel(pool: PoolModel, network: string) {
  const db = await DBConnector.connectToDatabase(network)
  await db
    .collection("pool")
    .updateOne(
      { _id: new ObjectId(pool._id) },
      { $set: { ...pool, active: true } },
      { upsert: true }
    )
}


// {
//   active: {$ne: ["$length", 2]},
// }


// export async function changeLoadedPool()
// export async function savePoolModel(pool: PoolModel, network?: string) {
//   const db = await connectToDatabase(network)
//   await db
//     .collection("pool")
//     .updateOne(
//       { _id: new ObjectId(pool._id) },
//       { $set: { ...pool, active: true } },
//       { upsert: true }
//     )
// }

// export async function addFactory(p)
