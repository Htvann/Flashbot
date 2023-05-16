import { DeployFunction } from "hardhat-deploy/types"
import { getNamedAccounts, deployments, network, ethers } from "hardhat"
import { WineryFactory, WineryPair, WineryRouter } from "../typechain"

const deployFunction: DeployFunction = async () => {

  const r1: WineryRouter = await ethers.getContract("PancakeR")
  const r2: WineryRouter = await ethers.getContract("WineryR")
  const r3: WineryRouter = await ethers.getContract("UniswapR")

  const t1 = await ethers.getContract("MockERC20V1")
  const t2 = await ethers.getContract("MockERC20V2")
  const t3 = await ethers.getContract("MockERC20V3")
  const t4 = await ethers.getContract("MockERC20V4")
  const t5 = await ethers.getContract("MockERC20V5")
  const t6 = await ethers.getContract("MockERC20V6")
  const t7 = await ethers.getContract("MockERC20V7")

  await t1.approve(r1.address, ethers.constants.MaxUint256)
  await t2.approve(r1.address, ethers.constants.MaxUint256)
  await t3.approve(r1.address, ethers.constants.MaxUint256)
  await t4.approve(r1.address, ethers.constants.MaxUint256)
  await t5.approve(r1.address, ethers.constants.MaxUint256)
  await t6.approve(r1.address, ethers.constants.MaxUint256)
  await t7.approve(r1.address, ethers.constants.MaxUint256)

  await t1.approve(r2.address, ethers.constants.MaxUint256)
  await t2.approve(r2.address, ethers.constants.MaxUint256)
  await t3.approve(r2.address, ethers.constants.MaxUint256)
  await t4.approve(r2.address, ethers.constants.MaxUint256)
  await t5.approve(r2.address, ethers.constants.MaxUint256)
  await t6.approve(r2.address, ethers.constants.MaxUint256)
  await t7.approve(r2.address, ethers.constants.MaxUint256)

  await t1.approve(r3.address, ethers.constants.MaxUint256)
  await t2.approve(r3.address, ethers.constants.MaxUint256)
  await t3.approve(r3.address, ethers.constants.MaxUint256)
  await t4.approve(r3.address, ethers.constants.MaxUint256)
  await t5.approve(r3.address, ethers.constants.MaxUint256)
  await t6.approve(r3.address, ethers.constants.MaxUint256)
  await t7.approve(r3.address, ethers.constants.MaxUint256)

}

export default deployFunction
deployFunction.tags = [`all`, `testnet`, `approve`, `cyclic-test`]
