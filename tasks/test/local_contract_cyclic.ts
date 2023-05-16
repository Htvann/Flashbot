import { task } from "hardhat/config"
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types"
import { DBConnector } from "../../db"

import {
  CyclicProfitCalculator,
  FlashswapMultiPool,
  MockERC20,
  WineryFactory,
  WineryPair,
  WineryRouter,
} from "../../typechain"
import { ConfigCache } from "../../class/custom_cache/config"
import { ObjectId, Document, WithId } from "mongodb"
import { PoolModel } from "../../models"
import { Pool } from "../../class"
import { BigNumber } from "ethers"
import {
  calcDebtForMaximumProfitFromMultiPool,
  calculateChances,
  calculateChancesWithModel,
} from "../../utils"

task("test-cyclic", "Run cyclic to find profit")
  .addParam("database", "Database name")
  .setAction(async (taskArgs: TaskArguments, hre: HardhatRuntimeEnvironment): Promise<void> => {
    const config = await ConfigCache.getInstance(taskArgs.database ?? hre.network.name)
    const currentTestCase = config.safeGetCacheObject<string>("current_test_case")

    await hre.deployments.fixture(["cyclic-test"])

    const { deployer } = await hre.getNamedAccounts()

    const r1: WineryRouter = await hre.ethers.getContract("PancakeR")
    const r2: WineryRouter = await hre.ethers.getContract("WineryR")
    const r3: WineryRouter = await hre.ethers.getContract("UniswapR")
    const rs = [r1, r2, r3]

    const f1: WineryFactory = await hre.ethers.getContract("PancakeF")
    const f2: WineryFactory = await hre.ethers.getContract("WineryF")
    const f3: WineryFactory = await hre.ethers.getContract("UniswapF")
    const fs = [f1, f2, f3]

    const db = await DBConnector.connectToDatabase()
    const swapData = await db.collection("swapped").findOne({ _id: new ObjectId(currentTestCase) })

    const cyclic: string[] = swapData!["cyclicPath"]
    const mapToken: Map<string, string> = new Map()
    let tokenMock: MockERC20[] = []

    for (let index = 0; index < 7; index++) {
      const token: MockERC20 = await hre.ethers.getContract(`MockERC20V${index + 1}`)
      tokenMock.push(token)
    }

    console.log(tokenMock.map((item) => item.address))

    let tokenMockCnt = 0
    let pools: PoolModel[] = []

    for (let index = 0; index < cyclic.length; index++) {
      const element = cyclic[index]
      const doc = await db.collection("pool").findOne({ address: element })
      const pool: PoolModel = PoolModel.fromDocument(doc!)
      pools.push(pool)

      if (!mapToken.get(pool.token0Address)) {
        mapToken.set(pool.token0Address, tokenMock[tokenMockCnt].address)
        tokenMockCnt++
      }

      if (!mapToken.get(pool.token1Address)) {
        mapToken.set(pool.token1Address, tokenMock[tokenMockCnt].address)
        tokenMockCnt++
      }
    }

    for (let index = 0; index < pools.length; index++) {
      const element = pools[index]
      let isOk = false
      for (let jindex = 0; jindex < 3; jindex++) {
        const token0 = mapToken.get(element.token0Address)!
        const token1 = mapToken.get(element.token1Address)!
        let pairAddress = await fs[jindex].getPair(token0, token1)
        if (pairAddress == hre.ethers.constants.AddressZero) {
          await rs[jindex].addLiquidity(
            token0,
            token1,
            hre.ethers.BigNumber.from(element.token0Reserve),
            hre.ethers.BigNumber.from(element.token1Reserve),
            0,
            0,
            deployer,
            hre.ethers.constants.MaxUint256
          )
          pairAddress = await fs[jindex].getPair(token0, token1)
          element.address = pairAddress
          const pool: WineryPair = await hre.ethers.getContractAt("WineryPair", pairAddress)
          element.token0Address = await pool.token0()
          element.token1Address = await pool.token1()
          const reserve = await pool.getReserves()
          element.token0Reserve = reserve._reserve0.toString()
          element.token1Reserve = reserve._reserve1.toString()
          await fs[jindex].setSwapFee(pairAddress, element.swapFee)
          isOk = true
          break
        }
      }
      if (isOk == false) {
        throw new Error("Not distinct")
      }
    }

    const poolzs: Pool[] = []

    for (let index = 0; index < pools.length; index++) {
      const element = pools[index]
      const pool = await Pool.fromModel(element, hre)
      poolzs.push(pool)
    }

    const rawCal = calculateChances(poolzs, mapToken.get(swapData!["baseToken"])!)

    console.log("Raw Cal ---------------------------")
    console.log(rawCal)

    // const deepCal = await calcDebtForMaximumProfitFromMultiPool(poolzs, rawCal.tokenPath)

    // console.log("Deep Cal ---------------------------")
    // console.log(deepCal)

    const flashbot: FlashswapMultiPool = await hre.ethers.getContract("Flashbot")
    await flashbot.startSwapInMultiPool(
      pools.map((item) => item.toPoolStruct()),
      mapToken.get(swapData!["baseToken"])!,
      swapData!["borrow"],
      "test",
    )
  })
