import { HardhatRuntimeEnvironment } from "hardhat/types"
import { savePoolModel } from "../db"
import { PathModel } from "../models"
import { CyclicProfitCalculator, ERC20, FlashswapMultiPool } from "../typechain"
import { CyclicCaculator, CyclicSwapping } from "./cyclic_calculator"
import { GasEstimator } from "./gas_estimator"
import { Pool } from "./pool"
import { BatchPromise } from "./batch_promise"
import { calcDebtForMaximumProfitFromMultiPool } from "../utils"
import * as mongoDB from "mongodb"

export class CyclicRunner {
  private currentBaseToken: string
  public isSuccessOnce: boolean = false

  constructor(
    private baseToken: string[],
    private flashbot: FlashswapMultiPool,
    private allPath: PathModel[],
    private gasEstimate: GasEstimator,
    private allPoolMap: Map<string, Pool>,
    private hre: HardhatRuntimeEnvironment,
    private unStorePool: Set<Pool>,
    private db: mongoDB.Db,
    private networkOverride?: string
  ) {
    console.log("Init new cyclic runner enviroment")
    this.currentBaseToken = baseToken[0]
  }

  public async execute() {
    for (let j = 0; j < this.baseToken.length; j++) {
      this.currentBaseToken = this.baseToken[j]
      if (this.isSuccessOnce) {
        break
      }
      await this.onEachBaseToken()
    }
    // await this.updateAll()
  }

  public async onEachBaseToken() {
    // let currentPathOnBaseToken = this.allPath
    let currentPathOnBaseToken = this.allPath.filter((item) => {
      return item.baseToken == this.currentBaseToken
    })

    console.log("Basetoken: " + currentPathOnBaseToken.length)
    console.log("allPoolMap: " + this.allPoolMap.size)

    let cyclicCaculator: CyclicCaculator[] = Array.from(currentPathOnBaseToken, (paths) => {
      const poolPath: Pool[] = Array.from(paths.path, (item) => {
        return this.allPoolMap.get(item)!.copy()
      })
      return new CyclicCaculator(poolPath, this.currentBaseToken)
    })

    const batch = new BatchPromise(cyclicCaculator.length, async (index) =>
      cyclicCaculator[index].deepCalculate()
    )

    await batch.execute()

    // for (let index = 0; index < cyclicCaculator.length; index++) {
    //   const element = cyclicCaculator[index]
    //   await element.deepCalculate()
    // }

    cyclicCaculator = cyclicCaculator.filter((item) => {
      return item.rawCal!.isProfitable
    })

    cyclicCaculator = cyclicCaculator.filter((item) => {
      return (item.optimalEst?.borrow ?? BigInt(0)) > BigInt(0)
    })

    cyclicCaculator.sort((a, b) => Number(b.optimalEst!.profit) - Number(a.optimalEst!.profit))

    const end = cyclicCaculator.length > 10 ? 10 : cyclicCaculator.length
    // const end = cyclicCaculator.length

    for (let index = 0; index < end; index++) {
      const element = cyclicCaculator[index]
      // await this.db.collection("swapped").insertOne(cyclicCaculator[index].toJson())
      const isSuccess = await this.onchainSwapping(element)
      // const isSuccess =
      // if (isSuccess) {
      //   this.isSuccessOnce = true
      //   break
      // }
    }

    // if (cyclicCaculator.length > 0) {
    // }
  }

  private async onchainSwapping(cyc: CyclicCaculator): Promise<boolean> {
    let recoverPath: Pool[] = Array.from(cyc.cyclicPath, (f) => this.allPoolMap.get(f)!)

    const token: ERC20 = await this.hre.ethers.getContractAt("ERC20", this.currentBaseToken)

    let cyclicSwapping = new CyclicSwapping(
      cyc,
      (await token.balanceOf(this.flashbot.address)).toString()
    )
    try {
      const tx = await this.flashbot.startSwapInMultiPool(
        recoverPath.map((item) => item.toPoolStruct()),
        this.currentBaseToken,
        cyc.optimalEst!.borrow,
        PathModel.convertPathToId(cyc.cyclicPath),
        {
          gasLimit: 9900000,
        }
      )
      const receipt = await tx.wait(1)

      const balanceAfter = BigInt((await token.balanceOf(this.flashbot.address)).toString())
      cyclicSwapping.balanceAfter = balanceAfter.toString()

      const gasUsed = receipt.gasUsed

      cyclicSwapping.gasUsed = (
        BigInt(gasUsed.toString()) * BigInt(this.gasEstimate.gasFee)
      ).toString()

      const gas = this.gasEstimate.calculateGas(this.currentBaseToken, cyc.cyclicPath.length)

      cyclicSwapping.trueProfit = (
        balanceAfter -
        BigInt(cyclicSwapping.balanceBefore) -
        gas.toBase!
      ).toString()

      cyclicSwapping.isProfit = Number(cyclicSwapping.trueProfit) > 0

      cyclicSwapping.gasNativeEstimated = gas.toNative?.toString()

      cyclicSwapping.gasBaseEstimated = gas.toBase?.toString()

      await Promise.all(recoverPath.map((item) => item.reload(this.unStorePool)))
      cyclicSwapping.isSuccess = true
    } catch (error: any) {
      console.log(error.message)
      cyclicSwapping.isSuccess = false
      cyclicSwapping.errorMessage = error.message
    }

    // await this.db.collection("swapped").updateOne(cyclicSwapping.toJson())
    const jsonObject = cyclicSwapping.toJson()
    await this.db
      .collection("swapped")
      .updateOne({ _id: jsonObject._id }, { $set: jsonObject }, { upsert: true })

    return cyclicSwapping.isSuccess
  }

  private async save() {
    Array.from(this.unStorePool.values()).map(async (item) => {
      await savePoolModel(item.model, this.hre.network.name)
    })
  }

  private async updateAll() {
    const arr = Array.from(this.allPoolMap.entries())
    const batchSave = new BatchPromise(arr.length, async (index) => {
      await savePoolModel(arr[index][1].model, this.hre.network.name)
    })
    await batchSave.execute()
  }
}

// first time is sqrt a * b
// second time is
// a * r1 / r0
