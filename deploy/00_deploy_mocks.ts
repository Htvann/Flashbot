import { DeployFunction } from "hardhat-deploy/types"
import { getNamedAccounts, deployments, network, ethers } from "hardhat"
import { MockERC20 } from "../typechain"

const deployFunction: DeployFunction = async () => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId: number | undefined = network.config.chainId

  // If we are on a local development network, we need to deploy mocks!
  // if (chainId === 31337) {
  //   log(`Local network detected! Deploying mocks...`)

  await deploy("WETH", {
    contract: "WETH9",
    from: deployer,
    log: true,
  })

  await deploy("MockERC20V1", {
    contract: "MockERC20",
    from: deployer,
    log: true,
    args: ["Mock1ERC20", "M1", ethers.constants.MaxUint256],
  })

  await deploy("MockERC20V2", {
    contract: "MockERC20",
    from: deployer,
    log: true,
    args: ["Mock2ERC20", "M2", ethers.constants.MaxUint256],
  })

  await deploy("MockERC20V3", {
    contract: "MockERC20",
    from: deployer,
    log: true,
    args: ["Mock3ERC20", "M3", ethers.constants.MaxUint256],
  })

  await deploy("MockERC20V4", {
    contract: "MockERC20",
    from: deployer,
    log: true,
    args: ["Mock3ERC20", "M4", ethers.constants.MaxUint256],
  })

  await deploy("MockERC20V5", {
    contract: "MockERC20",
    from: deployer,
    log: true,
    args: ["Mock3ERC20", "M5", ethers.constants.MaxUint256],
  })

  await deploy("MockERC20V6", {
    contract: "MockERC20",
    from: deployer,
    log: true,
    args: ["Mock3ERC20", "M6", ethers.constants.MaxUint256],
  })

  await deploy("MockERC20V7", {
    contract: "MockERC20",
    from: deployer,
    log: true,
    args: ["Mock3ERC20", "M7", ethers.constants.MaxUint256],
  })

  log(`Mocks Deployed!`)

  const signers = await ethers.getSigners()

  const value = BigInt(ethers.constants.MaxUint256.toString()) / BigInt(signers.length)

  const t: MockERC20[] = []

  for (let index = 0; index < 6; index++) {
    const contract: MockERC20 = await ethers.getContract(`MockERC20V${index + 1}`)
    t.push(contract)
  }

  for (let index = 0; index < signers.length; index++) {
    const element = signers[index]
    const address = await element.getAddress()
    for (let jindex = 0; jindex < t.length; jindex++) {
      const token = t[jindex]
      await token.transfer(address, value.toString())
    }
  }
}

export default deployFunction
deployFunction.tags = [`all`, `mocks`, `main`, `testnet`, `cyclic-test`]
