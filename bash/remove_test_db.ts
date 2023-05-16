import { DBConnector } from "../db"

async function removeTestDb() {
  const db = await DBConnector.connectToDatabase("localhost")
  await db.dropDatabase()
}

removeTestDb()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
