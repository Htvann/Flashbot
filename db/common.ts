import * as mongoDB from "mongodb";
import * as dotenv from "dotenv";

const defaultMongoDBUrl = "mongodb://localhost:27017/";
export class DBConnector {
  private static instance: mongoDB.Db;

  private constructor() {}

  static async connectToDatabase(name?: string): Promise<mongoDB.Db> {
    if (!DBConnector.instance) {
      dotenv.config();

      const username = process.env.MONGODB_USERNAME;
      const password = process.env.MONGODB_PASSWORD;

      const options: mongoDB.MongoClientOptions = {
        auth: {
          username,
          password,
        },
      };

      const client: mongoDB.MongoClient = new mongoDB.MongoClient(
        process.env.MONGODB_CONN ?? defaultMongoDBUrl,
        options
      );

      await client.connect();

      const db: mongoDB.Db = client.db(name);

      DBConnector.instance = db;
    }
    return DBConnector.instance;
  }
}
