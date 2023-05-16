import { PathModel, PoolModel } from "../models"
import { Pool } from "./pool"
import {
  calcDebtForMaximumProfitFromMultiPool,
  calculateChances,
  OptimalEstimate,
  RawCaculated,
} from "../utils/cyclic-arbit-helper-offchain"
import { ObjectId } from "mongodb"

export class CyclicCaculator {
  public optimalEst: OptimalEstimate | undefined
  public rawCal: RawCaculated | undefined
  public cyclicPath: string[]

  constructor(private cyclic: Pool[], private baseToken: string) {
    this.cyclicPath = Array.from(cyclic, (item) => item.model.address)
  }

  public async deepCalculate() {
    this.rawCal = calculateChances(this.cyclic, this.baseToken)
    if (!this.rawCal.isProfitable) return
    this.optimalEst = await calcDebtForMaximumProfitFromMultiPool(
      this.cyclic,
      this.rawCal.tokenPath
    )
  }

  public toJson() {
    return {
      profit: this.optimalEst?.profit.toString(),
      borrow: this.optimalEst?.borrow.toString(),
      baseToken: this.baseToken,
      length: this.cyclic.length,
      cyclicPath: this.cyclicPath,
      rawCalIsProfitable: this.rawCal?.isProfitable,
      rawCalCommissionRate: this.rawCal?.commissionRate,
      rawCalExchangeRate: this.rawCal?.exchangeRate,
    }
  }
}

export class CyclicSwapping {
  public isSuccess: boolean
  public gasUsed: string | undefined
  public gasBaseEstimated: string | undefined
  public gasNativeEstimated: string | undefined
  public errorMessage: string | undefined
  public balanceAfter: string | undefined
  public trueProfit: string | undefined
  public isProfit: boolean | undefined

  constructor(public cal: CyclicCaculator, public balanceBefore: string) {
    this.isSuccess = false
  }

  toJson() {
    const cycCalJson = this.cal.toJson()
    return {
      ...cycCalJson,
      _id: new ObjectId(PathModel.convertPathToId(this.cal.cyclicPath)),
      success: this.isSuccess,
      error: this.errorMessage,
      before: this.balanceBefore,
      after: this.balanceAfter,
      gasUsed: this.gasUsed,
      gasEstInBaseToken: this.gasBaseEstimated,
      gasEst: this.gasNativeEstimated,
      trueProfit: this.trueProfit,
      isProfit: this.isProfit,
    }
  }
}
