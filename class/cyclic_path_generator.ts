import { HardhatRuntimeEnvironment } from "hardhat/types"
import { Db, ObjectId } from "mongodb"
import { loadPoolRelatedToToken } from "../db"
import { PathModel, TokenModel } from "../models"
import { combineAll, generateAllTokenPath } from "../utils/generate-combination"
import { BatchPromise } from "./batch_promise"

export class CyclicPathGenerator {
  private currentBaseToken: string
  private currentGeneratedTokenPath: string[][] = []
  private currentGeneratedPoolPath: any[] = []
  private poolRelatedToken: Map<string, string[]> = new Map()

  constructor(
    private baseToken: string[],
    private frequentToken: TokenModel[],
    private hre: HardhatRuntimeEnvironment,
    private pathLength: number[],
    private db: Db
  ) {
    this.currentBaseToken = baseToken[0]
    // db = await connectToDatabase(this.hre.network.name)
  }

  async execute() {
    // await this.preload()
    for (let index = 0; index < this.baseToken.length; index++) {
      const element = this.baseToken[index]
      console.log(element)
      this.currentBaseToken = element
      await this.generateTokenPath()
      console.log("Generated token path")
      await this.generatePoolPath()
      console.log("Generated pool valid path")
      await this.storeToDb()
      console.log("Stored to db")
    }
  }

  async generateTokenPath() {
    const srcArray = this.frequentToken.map((item) => item.address)

    for (let index = 0; index < this.pathLength.length; index++) {
      const element = this.pathLength[index]
      const pathsWithinBase = await generateAllTokenPath(srcArray, element, this.currentBaseToken)
      this.currentGeneratedTokenPath = this.currentGeneratedTokenPath.concat(pathsWithinBase)
    }

    console.log(`total length ${this.currentGeneratedTokenPath.length}`)
  }

  // async preload() {
  //   console.log("Preload all pool pairs")
  //   let allPoolPairs: string[][] = []
  //   const srcArray = this.frequentToken.map((item) => item.address)
  //   for (let index = 0; index < this.baseToken.length; index++) {
  //     console.log(`${index}/${this.baseToken.length}`)
  //     const pathsWithinBase = await generateAllTokenPath(srcArray, 3, this.baseToken[index])
  //     allPoolPairs = allPoolPairs.concat(pathsWithinBase)
  //   }
  //   console.log("Length: " + allPoolPairs.length)
  //   // for (let index = 0; index < allPoolPairs.length; index++) {
  //   //   console.log(`${index}/${allPoolPairs.length}`)

  //   // }
  //   // console.log("Preload finish")
  //   const poolPairsBatch = new BatchPromise(allPoolPairs.length, async (index) => {
  //     let temp = (
  //       await loadPoolRelatedToToken(
  //         allPoolPairs[index][0],
  //         allPoolPairs[index][1],
  //         this.hre.network.name
  //       )
  //     ).map((item) => item.address)

  //     this.poolRelatedToken.set(allPoolPairs[index][0] + allPoolPairs[index][1], temp)
  //     this.poolRelatedToken.set(allPoolPairs[index][1] + allPoolPairs[index][0], temp)
  //     console.log(`${index}/${allPoolPairs.length}`)
  //   })
  //     .setBatchRange(1000)
  //     .setMaxRetries(3)
  //   await poolPairsBatch.execute()
  // }

  public async generatePoolPath() {
    for (let i = 0; i < this.currentGeneratedTokenPath.length; i++) {
      let relatedPoolAtEach: string[][] = []
      for (let j = 0; j < this.currentGeneratedTokenPath[i].length - 1; j++) {
        let related = this.poolRelatedToken.get(
          this.currentGeneratedTokenPath[i][j] + this.currentGeneratedTokenPath[i][j + 1]
        )
        if (!related) {
          related = (
            await loadPoolRelatedToToken(
              this.currentGeneratedTokenPath[i][j],
              this.currentGeneratedTokenPath[i][j + 1],
              this.hre.network.name
            )
          ).map((item) => item.address)
          this.poolRelatedToken.set(
            this.currentGeneratedTokenPath[i][j] + this.currentGeneratedTokenPath[i][j + 1],
            related
          )
          this.poolRelatedToken.set(
            this.currentGeneratedTokenPath[i][j + 1] + this.currentGeneratedTokenPath[i][j],
            related
          )
        }
        relatedPoolAtEach.push(related!)
      }
      let merged = combineAll(relatedPoolAtEach)
      let currentValidPool: string[][] = []
      for (let i = 0; i < merged.length; i++) {
        let isValid = true
        for (let j = 0; j < merged[i].length; j++) {
          if (merged[i][j] == merged[i][j + 1]) {
            isValid = false
            break
          }
        }
        if (isValid) {
          currentValidPool.push(merged[i])
        }
      }
      if (i % 500 == 0) {
        console.log(
          `current pool path length ${this.currentGeneratedPoolPath.length} at index ${i} with all loaded pool size ${this.poolRelatedToken.size}`
        )
      }

      this.currentGeneratedPoolPath = this.currentGeneratedPoolPath.concat(
        currentValidPool.map(
          (item) => new PathModel(this.hre.network.name, item, this.currentBaseToken)
        )
      )
    }
  }

  public async storeToDb() {
    const batchLoader = new BatchPromise(this.currentGeneratedPoolPath.length, (index) =>
      this.db.collection("path").updateOne(
        { _id: new ObjectId(this.currentGeneratedPoolPath[index]._id) },
        {
          $set: {
            ...this.currentGeneratedPoolPath[index],
            length: this.currentGeneratedPoolPath[index].path.length,
            active: true,
          },
        },
        { upsert: true }
      )
    ).setMaxRetries(5)

    await batchLoader.execute()
    this.clean()
  }

  public clean() {
    this.currentGeneratedTokenPath = []
    this.currentGeneratedPoolPath = []
  }
}
