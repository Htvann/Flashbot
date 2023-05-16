import { Pool } from "../class/pool"
import { PoolModel } from "../models"

// export type DeepCaculated = {
//   optimal: OptimalEstimate
//   poolPath: Pool[]
// }

export type OptimalEstimate = {
  borrow: bigint
  profit: bigint
}

export type RawCaculated = {
  isProfitable: boolean
  commissionRate: number
  exchangeRate: number
  swapFee: number
  tokenPath: string[]
}

export function calculateChances(cyclic: Pool[], baseToken: string): RawCaculated {
  let currentToken: string
  let tokenPath: string[] = []
  let exchangeRate: number = 1
  let maxSwapFee = 0
  currentToken = baseToken
  tokenPath.push(currentToken)
  for (let i = 0; i < cyclic.length; i++) {
    let r0: number, r1: number
    if (currentToken == cyclic[i].model.token0Address) {
      r0 = Number(cyclic[i].model.token0Reserve)
      r1 = Number(cyclic[i].model.token1Reserve)
      currentToken = cyclic[i].model.token1Address
    } else if (currentToken == cyclic[i].model.token1Address) {
      r0 = Number(cyclic[i].model.token1Reserve)
      r1 = Number(cyclic[i].model.token0Reserve)
      currentToken = cyclic[i].model.token0Address
    } else {
      throw new Error(`cyclic pool is not at correct format with currentoken ${currentToken}`)
    }
    exchangeRate = (exchangeRate * r1) / r0
    if (maxSwapFee < cyclic[i].model.swapFee) {
      maxSwapFee = cyclic[i].model.swapFee
    }
    // commissionRate = commissionRate / ((10000 - cyclic[i].swapFee) / 10000)
    tokenPath.push(currentToken)
  }
  let commissionRate = 1 / ((10000 - maxSwapFee) / 10000) ** cyclic.length

  return {
    isProfitable: exchangeRate > commissionRate ? true : false,
    commissionRate: commissionRate,
    exchangeRate: exchangeRate,
    swapFee: maxSwapFee,
    tokenPath: tokenPath,
  }
}

export function calculateChancesWithModel(cyclic: PoolModel[], baseToken: string): RawCaculated {
  let currentToken: string
  let tokenPath: string[] = []
  let exchangeRate: number = 1
  let maxSwapFee = 0
  currentToken = baseToken
  tokenPath.push(currentToken)
  for (let i = 0; i < cyclic.length; i++) {
    let r0: number, r1: number
    if (currentToken == cyclic[i].token0Address) {
      r0 = Number(cyclic[i].token0Reserve)
      r1 = Number(cyclic[i].token1Reserve)
      currentToken = cyclic[i].token1Address
    } else if (currentToken == cyclic[i].token1Address) {
      r0 = Number(cyclic[i].token1Reserve)
      r1 = Number(cyclic[i].token0Reserve)
      currentToken = cyclic[i].token0Address
    } else {
      throw new Error(`cyclic pool is not at correct format with currentoken ${currentToken}`)
    }
    exchangeRate = (exchangeRate * r1) / r0
    if (maxSwapFee < cyclic[i].swapFee) {
      maxSwapFee = cyclic[i].swapFee
    }
    // commissionRate = commissionRate / ((10000 - cyclic[i].swapFee) / 10000)
    tokenPath.push(currentToken)
  }
  let commissionRate = 1 / ((10000 - maxSwapFee) / 10000) ** cyclic.length

  return {
    isProfitable: exchangeRate > commissionRate ? true : false,
    commissionRate: commissionRate,
    exchangeRate: exchangeRate,
    swapFee: maxSwapFee,
    tokenPath: tokenPath,
  }
}

export async function calcDebtForMaximumProfitFromMultiPool(
  cyclic: Pool[],
  path: string[]
): Promise<OptimalEstimate> {
  const _cyclic: Pool[] = [...cyclic].map((item) => item.copy())

  const [firstCyclic, firstCyclicPath, secondCyclic, secondCyclicPath] = splitCyclicInHalf(
    _cyclic,
    path
  )

  let firstPoolFromCyclicPromise: Promise<Pool | undefined> = mergeMultiPool(
    firstCyclic,
    firstCyclicPath
  )
  let secondPoolFromCyclicPromise: Promise<Pool | undefined> = mergeMultiPool(
    secondCyclic,
    secondCyclicPath
  )
  let firstPool = await firstPoolFromCyclicPromise
  let secondPool = await secondPoolFromCyclicPromise
  if (firstPool && secondPool) {
    let result
    result = calculateOptimalBetweenTwoPool(
      firstPool,
      secondPool,
      firstPool.model.token0Address == path[0]
        ? firstPool.model.token1Address
        : firstPool.model.token0Address
    )
    return result
  } else {
    throw new Error("Something when wrong")
  }
}

export async function mergeMultiPool(cyclic: Pool[], path: string[]): Promise<Pool | undefined> {
  const _cyclic: Pool[] = [...cyclic].map((item) => item.copy())

  if (_cyclic.length == 0) {
    throw new Error("Yo WTF")
  }

  if (_cyclic.length == 1) {
    return _cyclic[0]
  }

  if (_cyclic.length == 2) {
    if (path.length != 3) {
      throw new Error("Path is not at correct format")
    }
    return merge2Pool(_cyclic[0], _cyclic[1], path[1])
  } else {
    // const cyclicHalf = Math.ceil(cyclic.length / 2)
    // let firstCyclic = cyclic.splice(0, cyclicHalf)
    // let secondCyclic = cyclic.splice(-cyclicHalf)
    // let firstCyclicPath = path.slice(0, firstCyclic.length + 1)
    // let secondCyclicPath = path.slice(-secondCyclic.length - 1)

    const [firstCyclic, firstCyclicPath, secondCyclic, secondCyclicPath] = splitCyclicInHalf(
      _cyclic,
      path
    )

    let firstPoolFromCyclicPromise: Promise<Pool | undefined> = mergeMultiPool(
      firstCyclic,
      firstCyclicPath
    )
    let secondPoolFromCyclicPromise: Promise<Pool | undefined> = mergeMultiPool(
      secondCyclic,
      secondCyclicPath
    )
    let firstPool = await firstPoolFromCyclicPromise
    let secondPool = await secondPoolFromCyclicPromise
    if (firstPool && secondPool) {
      return merge2Pool(firstPool, secondPool, firstCyclicPath[firstCyclicPath.length - 1])
    }
  }
}

function splitCyclicInHalf(cyclic: Pool[], path: string[]): [Pool[], string[], Pool[], string[]] {
  const _cyclic: Pool[] = [...cyclic].map((item) => item.copy())
  const cyclicHalf = Math.ceil(cyclic.length / 2)
  let firstCyclic = _cyclic.splice(0, cyclicHalf)
  let secondCyclic = _cyclic.splice(-cyclicHalf)
  let firstCyclicPath = path.slice(0, firstCyclic.length + 1)
  let secondCyclicPath = path.slice(-secondCyclic.length - 1)
  return [firstCyclic, firstCyclicPath, secondCyclic, secondCyclicPath]
}

function compare(a: any, b: any) {
  if (a > b) return a
  else return b
}

export async function merge2Pool(
  pool0: Pool,
  pool1: Pool,
  intermediaryToken: string
): Promise<Pool> {
  let a12: bigint,
    a21: bigint,
    a23: bigint,
    a32: bigint,
    token0ReserveMerged: bigint,
    token1ReserveMerged: bigint

  let token0AddressMerged: string, token1AddressMerged: string
  if (pool0.model.token0Address == intermediaryToken) {
    a12 = BigInt(pool0.model.token1Reserve)
    a21 = BigInt(pool0.model.token0Reserve)
    token0AddressMerged = pool0.model.token1Address
  } else if (pool0.model.token1Address == intermediaryToken) {
    a12 = BigInt(pool0.model.token0Reserve)
    a21 = BigInt(pool0.model.token1Reserve)
    token0AddressMerged = pool0.model.token0Address
  } else {
    throw new Error("Cant Merged")
  }

  if (pool1.model.token0Address == intermediaryToken) {
    a32 = BigInt(pool1.model.token1Reserve)
    a23 = BigInt(pool1.model.token0Reserve)
    token1AddressMerged = pool1.model.token1Address
  } else if (pool1.model.token1Address == intermediaryToken) {
    a32 = BigInt(pool1.model.token0Reserve)
    a23 = BigInt(pool1.model.token1Reserve)
    token1AddressMerged = pool1.model.token0Address
  } else {
    throw new Error("Cant Merged")
  }

  let _swapComission = BigInt(10000) - BigInt(compare(pool0.model.swapFee, pool1.model.swapFee))
  // let _swapComission = 1

  token0ReserveMerged = (a12 * a23) / (a23 + (_swapComission * a21) / BigInt(10000))
  token1ReserveMerged =
    (_swapComission * a21 * a32) / BigInt(10000) / (a23 + (_swapComission * a21) / BigInt(10000))

  let mergedPool: Pool = new Pool(
    new PoolModel(
      pool0.model.address,
      token0AddressMerged,
      token1AddressMerged,
      token0ReserveMerged.toString(),
      token1ReserveMerged.toString(),
      compare(pool0.model.swapFee, pool1.model.swapFee)
    ),
    pool0.contract
  )

  return mergedPool
}

export function calculateOptimalBetweenTwoPool(
  pool0: Pool,
  pool1: Pool,
  intermediaryToken: string
): OptimalEstimate {
  let a13z: bigint, a31z: bigint, a13: bigint, a31: bigint
  if (pool0.model.token0Address == intermediaryToken) {
    a13z = BigInt(pool0.model.token1Reserve)
    a31z = BigInt(pool0.model.token0Reserve)
  } else if (pool0.model.token1Address == intermediaryToken) {
    a13z = BigInt(pool0.model.token0Reserve)
    a31z = BigInt(pool0.model.token1Reserve)
  } else {
    throw new Error("Cant Merged")
  }

  if (pool1.model.token0Address == intermediaryToken) {
    a13 = BigInt(pool1.model.token1Reserve)
    a31 = BigInt(pool1.model.token0Reserve)
  } else if (pool1.model.token1Address == intermediaryToken) {
    a13 = BigInt(pool1.model.token0Reserve)
    a31 = BigInt(pool1.model.token1Reserve)
  } else {
    throw new Error("Cant Merged")
  }
  // console.log("---------------------------------")
  // console.log("a13z: ", a13z)
  // console.log("a31z: ", a31z)
  // console.log("a13: ", a13)
  // console.log("a31: ", a31)

  let _swapComission: bigint = BigInt(10000 - compare(pool0.model.swapFee, pool1.model.swapFee))
  // let _swapComission = 1

  let a = (a13z * a31) / (a31 + (_swapComission * a31z) / BigInt(10000))
  let az =
    (_swapComission * a13 * a31z) /
    ((a31 + (_swapComission * a31z) / BigInt(10000)) * BigInt(10000))
  // console.log("_swapComission: ", _swapComission)
  // console.log("a: " + a)
  // console.log("az: " + az)

  let optimalValue
  try {
    optimalValue =
      ((BigInt(
        Math.floor(
          Number(
            Math.sqrt(Number((_swapComission * az * a) / BigInt(10000))).toLocaleString(
              "fullwide",
              {
                useGrouping: false,
              }
            )
          )
        )
      ) -
        a) *
        BigInt(10000)) /
      _swapComission
  } catch (e) {
    console.log(e)
    optimalValue = BigInt(0)
  }

  // console.log(optimalValue)
  // console.log("---------------------------------")
  const intermediaryFromPool0 = pool0.swapWithToken(
    pool0.model.token0Address == intermediaryToken
      ? pool0.model.token1Address
      : pool0.model.token0Address,
    BigInt(optimalValue)
  )
  const allTokenFroomPool1 = pool1.swapWithToken(
    pool1.model.token0Address == intermediaryToken
      ? pool1.model.token0Address
      : pool0.model.token1Address,
    intermediaryFromPool0
  )
  // return [optimalValue, allTokenFroomPool1 - BigInt(optimalValue)]
  return {
    borrow: optimalValue,
    profit: allTokenFroomPool1 - BigInt(optimalValue),
  }
}

// export function multiPoolSwapToCheckK(cyclic: Pool[], path: string[], amountIn: bigint): bigint {
//   let currentAmount: bigint = BigInt(amountIn)
//   let clone = cyclic.map((it) => it.copy())
//   for (let i: number = 0; i < cyclic.length; i++) {
//     currentAmount = clone[i].swapWithToken(path[i], BigInt(currentAmount))
//     if (currentAmount <= 0) {
//       return currentAmount
//     }
//   }
//   return currentAmount
// }
