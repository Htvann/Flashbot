import { assert, expect } from "chai"
import { BigNumber, Signer } from "ethers"
import { deployments, ethers, getNamedAccounts } from "hardhat"
import { MockERC20, WineryFactory, WineryPair, WineryRouter } from "../typechain"

describe("Add pool liquidity test", async function () {
  let f1: WineryFactory,
    f2: WineryFactory,
    f3: WineryFactory,
    r1: WineryRouter,
    r2: WineryRouter,
    r3: WineryRouter,
    accounts: Signer[],
    deployer: any,
    t1: MockERC20,
    t2: MockERC20,
    t3: MockERC20,
    t4: MockERC20,
    t5: MockERC20,
    signers: Signer[]

  beforeEach(async () => {
    await deployments.fixture(["all"])
    deployer = (await getNamedAccounts()).deployer
    signers = await ethers.getSigners()

    r1 = await ethers.getContract("PancakeR")
    r2 = await ethers.getContract("WineryR")
    r3 = await ethers.getContract("UniswapR")

    t1 = await ethers.getContract("MockERC20V1")
    t2 = await ethers.getContract("MockERC20V2")
    t3 = await ethers.getContract("MockERC20V3")
    t4 = await ethers.getContract("MockERC20V4")
    t5 = await ethers.getContract("MockERC20V5")

    f1 = await ethers.getContract("PancakeF")
    f2 = await ethers.getContract("WineryF")
    f3 = await ethers.getContract("UniswapF")
  })

  describe("Test pool add liquidity", async function () {
    it("Add one", async function () {
      const amount0 = "9859407138637024463"
      const amount1 = "664123282474763931164"

      await r1.addLiquidity(
        t1.address,
        t2.address,
        ethers.BigNumber.from(amount0),
        ethers.BigNumber.from(amount1),
        0,
        0,
        deployer,
        ethers.constants.MaxUint256
      )

      const pool1Address = await f1.getPair(t2.address, t1.address)

      let pool1: WineryPair = await ethers.getContractAt("WineryPair", pool1Address)

      const est = Math.sqrt(Number(BigInt(amount0) * BigInt(amount1)))

      const balanceLp = (await pool1.balanceOf(deployer)).add(10 ** 3)
      const totalSupply = await pool1.totalSupply()

      const totalSupplyPow2 = totalSupply.mul(totalSupply)

      //   assert.equal(balanceLp.toString(), totalSupply.toString())

      //   assert.equal(est.toString(), totalSupplyPow2.toString())
      console.log("Liquidity providers lp balance: " + balanceLp.toString())
      console.log("Total lp balance: " + totalSupply.toString())
      console.log(
        "Liquidity providers lp estimate " +
          est.toLocaleString("fullwide", {
            useGrouping: false,
          })
      )
      //   console.log(totalSupplyPow2.toString())
    })

    it("Add multiple one", async function () {
      const amount1 = "9859407138637024463"
      const amount2 = "664123282474763931164"

      const amount02 = "5859407138637024463"
      const amount12 = "5859407138637024463"

      await r1.addLiquidity(
        t1.address,
        t2.address,
        ethers.BigNumber.from(amount1),
        ethers.BigNumber.from(amount2),
        0,
        0,
        deployer,
        ethers.constants.MaxUint256
      )

      const singer1Address = await signers[1].getAddress()

      const pool1Address = await f1.getPair(t2.address, t1.address)

      let pool1: WineryPair = await ethers.getContractAt("WineryPair", pool1Address)

      let { _reserve0, _reserve1 } = await pool1.getReserves()

      let totalSupply = await pool1.totalSupply()

      await (await t1.connect(signers[1])).approve(r1.address, await t1.balanceOf(singer1Address))
      await (await t2.connect(signers[1])).approve(r1.address, await t2.balanceOf(singer1Address))

      await (
        await r1.connect(signers[1])
      ).addLiquidity(
        t1.address,
        t2.address,
        ethers.BigNumber.from(amount02),
        ethers.BigNumber.from(amount12),
        0,
        0,
        singer1Address,
        ethers.constants.MaxUint256
      )

      const estimateS1lp = await pool1.balanceOf(singer1Address)
      let lpCheck1 =
        (BigInt(amount02) * BigInt(totalSupply.toString())) / BigInt(_reserve0.toString())
      let lpCheck2 =
        (BigInt(amount12) * BigInt(totalSupply.toString())) / BigInt(_reserve1.toString())
      let balanceS1lp = lpCheck1 > lpCheck2 ? lpCheck2.toString() : lpCheck1.toString()
      console.log("Liquidity provider lp balance " + balanceS1lp.toString())
      console.log("Liquidity providers lp estimate " + estimateS1lp.toString())
    })
  })
})
