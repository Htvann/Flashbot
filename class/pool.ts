import { PoolModel } from "../models"
import { WineryFactory, WineryPair } from "../typechain"
// import { ethers, network } from "hardhat"
import { BigNumber, utils } from "ethers"
import { PoolStruct } from "../typechain/contracts/Flashbot.sol/FlashswapMultiPool"
import { Copiable } from "../interface"
import { HardhatRuntimeEnvironment } from "hardhat/types"

export class Pool implements Copiable {
  public model: PoolModel
  public contract: WineryPair

  constructor(model: PoolModel, contract: WineryPair) {
    this.model = model
    this.contract = contract
  }

  copy(): Pool {
    return new Pool(this.model.copy(), this.contract)
  }

  static async fromModel(model: PoolModel, hre: HardhatRuntimeEnvironment): Promise<Pool> {
    const contract: WineryPair = await hre.ethers.getContractAt("WineryPair", model.address)
    return new Pool(model, contract)
  }

  static async fromNetwork(
    address: string,
    defaultSwapFee: number,
    hre: HardhatRuntimeEnvironment,
    haveSwapFee?: boolean
  ): Promise<Pool | undefined> {
    const contract: WineryPair = await hre.ethers.getContractAt("WineryPair", address)
    let model: PoolModel
    try {
      const token0 = await contract.token0()
      const token1 = await contract.token1()
      const reversePromise = await contract.getReserves()
      model = new PoolModel(
        address,
        token0,
        token1,
        reversePromise[0].toString(),
        reversePromise[1].toString(),
        defaultSwapFee
      )
    } catch (error) {
      console.log(error)
      return
    }

    if (haveSwapFee ?? true) {
      try {
        const swapFee = await contract.swapFee()
        model.swapFee = swapFee
        return new Pool(model, contract)
      } catch (error) {
        return new Pool(model, contract)
      }
    }
    return new Pool(model, contract)
  }

  toPoolStruct(): PoolStruct {
    return this.model.toPoolStruct()
  }

  async reloadPoolReserve() {
    try {
      const reserveResult = await this.contract!.getReserves()
      this.model.token0Reserve = BigInt(Number(reserveResult[0])).toString()
      this.model.token1Reserve = BigInt(Number(reserveResult[1])).toString()
      this.model.lastUpdateTimeStamp = Date.now()
    } catch (error) {
      console.log("Cannot load token resever at pool: " + this.model.address + ", error: " + error)
    }
  }

  async attachOnchainSyncEventListener(pool: Set<Pool>) {
    this.contract.on("Sync", async (r0, r1) => {
      console.log(`Pool ${this.model.address} updated at ${Date.now()}`)
      this.model.token0Reserve = BigInt(Number(r0)).toString()
      this.model.token1Reserve = BigInt(Number(r1)).toString()
      this.model.lastUpdateTimeStamp = Date.now()
      pool.add(this)
    })
  }

  async reload(pool: Set<Pool>) {
    const reserveResult = await this.contract!.getReserves()
    this.model.token0Reserve = BigInt(Number(reserveResult[0])).toString()
    this.model.token1Reserve = BigInt(Number(reserveResult[1])).toString()
    this.model.lastUpdateTimeStamp = Date.now()
    pool.add(this)
  }

  swapWithToken(address: string, amount: bigint): bigint {
    let amountTokenOut: bigint

    if (address == this.model.token0Address) {
      amountTokenOut = getAmountOut(
        BigInt(amount),
        BigInt(this.model.token0Reserve),
        BigInt(this.model.token1Reserve),
        this.model.swapFee
      )
    } else if (address == this.model.token1Address) {
      amountTokenOut = getAmountOut(
        BigInt(amount),
        BigInt(this.model.token1Reserve),
        BigInt(this.model.token0Reserve),
        this.model.swapFee
      )
    } else {
      throw new Error("This pool don't contain this token")
    }

    return amountTokenOut
  }
}

function getAmountOut(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  swapFee: number
): bigint {
  let amountInWithFee = amountIn * BigInt(10000 - swapFee)
  // let amountInWithFee = amountIn * ((10000 - swapFee)/10000)
  let numerator = amountInWithFee * reserveOut
  let denominator = reserveIn * BigInt(10000) + amountInWithFee
  if (denominator == BigInt(0)) {
    return BigInt(-1)
  }
  return numerator / denominator
}

function getAmountIn(
  amountOut: number,
  reserveIn: number,
  reserveOut: number,
  swapFee: number
): number {
  let numerator = reserveIn * amountOut * 10000
  let denominator = (reserveOut - amountOut) * (10000 - swapFee)
  return numerator / denominator + 1
}
