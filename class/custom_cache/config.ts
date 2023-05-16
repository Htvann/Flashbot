import { Db } from "mongodb"
import { DBConnector } from "../../db"
import { Cache } from "./cache"

export class ConfigCache extends Cache {
  protected static instance: ConfigCache

  private static db: Db

  public static async getInstance(dbName: string): Promise<ConfigCache> {
    if (!this.instance) {
      this.instance = new ConfigCache()
      this.db = await DBConnector.connectToDatabase(dbName)
      await this.instance.init()
    }
    return this.instance
  }

  private async init() {
    const data = await ConfigCache.db.collection("config").find({}).toArray()
    console.log(data)
    data.map((item) => this.setCacheObject(item.data, item.key))
    console.log("======================> Config loaded")
  }
}
