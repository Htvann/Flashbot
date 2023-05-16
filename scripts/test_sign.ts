import { Signer } from "ethers"
import { ethers } from "hardhat"

async function testSign() {
  const message = "ayo wtf mans"
  const accounts = await ethers.getSigners()
  const result = await offChainSignGetRSV(message, accounts[0])
  console.log(result)
  await accounts[0].sendTransaction({
    value: ethers.utils.parseEther("1"),
    to: accounts[1].address,
  })
  const result2 = await offChainSignGetRSV(message, accounts[0])
  console.log(result2)
}

testSign()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

export async function offChainSignGetRSV(
  message: string,
  signer: Signer
): Promise<[string, string, string, number]> {
  //   const signedMessage = await signer.signMessage(ethers.utils.arrayify(message))
  const signedMessage = await signer.signMessage(message)
  const r = signedMessage.slice(0, 66)
  const s = "0x" + signedMessage.slice(66, 130)
  const v = Number("0x" + signedMessage.slice(130, 132))
  return [signedMessage, r, s, v]
}
