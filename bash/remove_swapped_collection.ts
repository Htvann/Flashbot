import { DBConnector } from "../db"

async function removeCollection() {
  // try {
  //   const db = await DBConnector.connectToDatabase("bscMainnet")
  //   await db.dropCollection("swapped")
  // } catch (e) {
  //   console.log(e)
  // }
}

removeCollection()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
