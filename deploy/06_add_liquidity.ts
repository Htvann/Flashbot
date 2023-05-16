import { DeployFunction } from "hardhat-deploy/types"
import { getNamedAccounts, deployments, network, ethers } from "hardhat"
import { WineryFactory, WineryPair, WineryRouter } from "../typechain"

const deployFunction: DeployFunction = async () => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  const r1: WineryRouter = await ethers.getContract("PancakeR")
  const r2: WineryRouter = await ethers.getContract("WineryR")
  const r3: WineryRouter = await ethers.getContract("UniswapR")

  const f1: WineryFactory = await ethers.getContract("PancakeF")
  const f2: WineryFactory = await ethers.getContract("WineryF")
  const f3: WineryFactory = await ethers.getContract("UniswapF")

  const t1 = await ethers.getContract("MockERC20V1")
  const t2 = await ethers.getContract("MockERC20V2")
  const t3 = await ethers.getContract("MockERC20V3")
  const t4 = await ethers.getContract("MockERC20V4")
  const t5 = await ethers.getContract("MockERC20V5")
  const t6 = await ethers.getContract("MockERC20V6")
  const t7 = await ethers.getContract("MockERC20V7")

  // t1 => 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c => 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
  // t2 => 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82
  // t3 => 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56 => 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
  // t4 => 0x55d398326f99059fF775485246999027B3197955
  // t5 => 0x1f546aD641B56b86fD9dCEAc473d1C7a357276B7
  // t6 => 0x8fF795a6F4D97E7887C79beA79aba5cc76444aDf
  // t7 => 0x1CdB9b4465F4e65B93D0aD802122C7C9279975c9

  // Pool 1: r1 (t1 , t2)
  // Pool 2: r2 (t2 , t3)
  // Pool 3: r3 (t3 , t4)
  // Pool 4: r1 (t4 , t1)
  // Pool 5: r2 (t5 , t1)
  // Pool 6: r3 (t5 , t3)
  // Pool 7: r1 (t1 , t3)
  // Pool 8: r2 (t6, t3)
  // Pool 9: r3 (t6, t3)
  // Pool 10: r1 (t1, t5)
  // Pool 11: r2 (t3, t5)
  // Pool 12: r3 (t3, t1)
  // Pool 13: r1 (t1, t7)
  // Pool 14: r2 (t1, t7)

  // case 2: t1 -> t2 -> t3 -> t4 -> t1

  // case 3: t1 -> t5 -> t3 -> t1

  // case 4: t6 -> t3 -> t6

  // case 5: t1 -> t5 -> t3 -> t1

  // case 6: t1 -> t7 -> t1

  // Pool 1

  await r1.addLiquidity(
    t1.address,
    t2.address,
    ethers.BigNumber.from("9859407138637024463"),
    ethers.BigNumber.from("664123282474763931164"),
    0,
    0,
    deployer,
    ethers.constants.MaxUint256
  )

  let pool1: WineryPair = await ethers.getContractAt(
    "WineryPair",
    await f1.getPair(t2.address, t1.address)
  )

  console.log("Add liquidity pool 1")
  console.log(pool1.address)

  await f1.setSwapFee(pool1.address, 20)

  // Pool 2
  await r2.addLiquidity(
    t2.address,
    t3.address,
    ethers.BigNumber.from("5711357578735209347949"),
    ethers.BigNumber.from("23475949477847591869588"),
    0,
    0,
    deployer,
    ethers.constants.MaxUint256
  )

  let pool2: WineryPair = await ethers.getContractAt(
    "WineryPair",
    await f2.getPair(t2.address, t3.address)
  )
  console.log("Add liquidity pool 2")
  console.log(pool2.address)

  await f2.setSwapFee(pool2.address, 17)

  // Pool 3
  await r3.addLiquidity(
    t4.address,
    t3.address,
    ethers.BigNumber.from("19808746123213168997962"),
    ethers.BigNumber.from("19812893317077734580496"),
    0,
    0,
    deployer,
    ethers.constants.MaxUint256
  )

  // let pool3: WineryPair = await ethers.getContractAt(
  //   "WineryPair",
  //   await f3.getPair(t4.address, t3.address)
  // )
  // console.log("Add liquidity pool 3")
  // console.log(pool3.address)

  // await f3.setSwapFee(pool3.address, 20)

  // Pool 4
  await r1.addLiquidity(
    t4.address,
    t1.address,
    ethers.BigNumber.from("263967716945124059392337"),
    ethers.BigNumber.from("961762707891048013597"),
    0,
    0,
    deployer,
    ethers.constants.MaxUint256
  )

  // let pool4: WineryPair = await ethers.getContractAt(
  //   "WineryPair",
  //   await f1.getPair(t4.address, t1.address)
  // )
  // console.log("Add liquidity pool 4")
  // console.log(pool4.address)

  // await f1.setSwapFee(pool4.address, 20)

  // Pool 5
  await r2.addLiquidity(
    t5.address,
    t1.address,
    ethers.BigNumber.from("143491650376688377642150011"),
    ethers.BigNumber.from("87735723512260205978"),
    0,
    0,
    deployer,
    ethers.constants.MaxUint256
  )

  // let pool5: WineryPair = await ethers.getContractAt(
  //   "WineryPair",
  //   await f2.getPair(t5.address, t1.address)
  // )
  // console.log("Add liquidity pool 5")
  // console.log(pool5.address)

  // await f2.setSwapFee(pool5.address, 20)

  // Pool 6
  await r3.addLiquidity(
    t5.address,
    t3.address,
    ethers.BigNumber.from("205997394203034462948068593"),
    ethers.BigNumber.from("35372890215470510300922"),
    0,
    0,
    deployer,
    ethers.constants.MaxUint256
  )

  // let pool6: WineryPair = await ethers.getContractAt(
  //   "WineryPair",
  //   await f3.getPair(t5.address, t3.address)
  // )
  // console.log("Add liquidity pool 6")
  // console.log(pool6.address)

  // await f3.setSwapFee(pool6.address, 20)

  // Pool 7
  await r1.addLiquidity(
    t1.address,
    t3.address,
    ethers.BigNumber.from("320936768197329834679"),
    ethers.BigNumber.from("88342304190051111359003"),
    0,
    0,
    deployer,
    ethers.constants.MaxUint256
  )

  // let pool7: WineryPair = await ethers.getContractAt(
  //   "WineryPair",
  //   await f1.getPair(t1.address, t3.address)
  // )

  // await f1.setSwapFee(pool7.address, 17)
  // console.log("Add liquidity pool 7")
  // console.log(pool7.address)

  // Pool 8
  await r2.addLiquidity(
    t6.address,
    t3.address,
    ethers.BigNumber.from("22861356184338206720"),
    ethers.BigNumber.from("2913106638588583346176"),
    0,
    0,
    deployer,
    ethers.constants.MaxUint256
  )

  // let pool8: WineryPair = await ethers.getContractAt(
  //   "WineryPair",
  //   await f2.getPair(t6.address, t3.address)
  // )

  // await f2.setSwapFee(pool8.address, 25)
  // console.log("Add liquidity pool 8")
  // console.log(pool8.address)

  // Pool 9
  await r3.addLiquidity(
    t6.address,
    t3.address,
    ethers.BigNumber.from("56195300666840899584"),
    ethers.BigNumber.from("7043812617315845931008"),
    0,
    0,
    deployer,
    ethers.constants.MaxUint256
  )

  let pool9: WineryPair = await ethers.getContractAt(
    "WineryPair",
    await f3.getPair(t6.address, t3.address)
  )

  await f3.setSwapFee(pool9.address, 20)
  console.log("Add liquidity pool 9")
  console.log(pool9.address)

  // Pool 10
  await r1.addLiquidity(
    t1.address,
    t5.address,
    ethers.BigNumber.from("88704769036670926848"),
    ethers.BigNumber.from("141929173162748084723122176"),
    0,
    0,
    deployer,
    ethers.constants.MaxUint256
  )

  let pool10: WineryPair = await ethers.getContractAt(
    "WineryPair",
    await f1.getPair(t1.address, t5.address)
  )

  await f1.setSwapFee(pool10.address, 20)
  console.log("Add liquidity pool 10")
  console.log(pool10.address)

  // Pool 11
  await r2.addLiquidity(
    t3.address,
    t5.address,
    ethers.BigNumber.from("35045991579617851342848"),
    ethers.BigNumber.from("207923385520976485335171072"),
    0,
    0,
    deployer,
    ethers.constants.MaxUint256
  )

  let pool11: WineryPair = await ethers.getContractAt(
    "WineryPair",
    await f2.getPair(t5.address, t3.address)
  )

  await f2.setSwapFee(pool11.address, 20)
  console.log("Add liquidity pool 11")
  console.log(pool11.address)

  // Pool 12
  await r3.addLiquidity(
    t3.address,
    t1.address,
    ethers.BigNumber.from("80957648764785930534912"),
    ethers.BigNumber.from("308183837678036254720"),
    0,
    0,
    deployer,
    ethers.constants.MaxUint256
  )

  let pool12: WineryPair = await ethers.getContractAt(
    "WineryPair",
    await f3.getPair(t1.address, t3.address)
  )

  await f3.setSwapFee(pool12.address, 17)
  console.log("Add liquidity pool 12")
  console.log(pool12.address)

  // Pool 13
  await r1.addLiquidity(
    t1.address,
    t7.address,
    ethers.BigNumber.from("308971895670104326144"),
    ethers.BigNumber.from("1132182207977146648887296"),
    0,
    0,
    deployer,
    ethers.constants.MaxUint256
  )

  let pool13: WineryPair = await ethers.getContractAt(
    "WineryPair",
    await f1.getPair(t1.address, t7.address)
  )

  await f1.setSwapFee(pool13.address, 25)
  console.log("Add liquidity pool 13")
  console.log(pool13.address)

  // Pool 14
  await r2.addLiquidity(
    t1.address,
    t7.address,
    ethers.BigNumber.from("17231755376376449024"),
    ethers.BigNumber.from("62761649979023396175872"),
    0,
    0,
    deployer,
    ethers.constants.MaxUint256
  )

  let pool14: WineryPair = await ethers.getContractAt(
    "WineryPair",
    await f2.getPair(t1.address, t7.address)
  )

  await f2.setSwapFee(pool14.address, 17)
  console.log("Add liquidity pool 14")
  console.log(pool14.address)
}

export default deployFunction
deployFunction.tags = [`all`, `liquid`]
