import { DeployFunction } from "hardhat-deploy/types"
import { getNamedAccounts, deployments, network, ethers } from "hardhat"

const deployFunction: DeployFunction = async () => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  const wineryF = await ethers.getContract("WineryF")
  const pancakeF = await ethers.getContract("PancakeF")
  const uniswapF = await ethers.getContract("UniswapF")
  const wEth = await ethers.getContract("WETH")

  await deploy("WineryR", {
    contract: "WineryRouter",
    from: deployer,
    log: true,
    args: [wineryF.address, wEth.address],
  })

  await deploy("PancakeR", {
    contract: "WineryRouter",
    from: deployer,
    log: true,
    args: [pancakeF.address, wEth.address],
  })

  await deploy("UniswapR", {
    contract: "WineryRouter",
    from: deployer,
    log: true,
    args: [uniswapF.address, wEth.address],
  })
}

export default deployFunction
deployFunction.tags = [`all`, `router`, `main`, `testnet`, `cyclic-test`]
