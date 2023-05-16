export function checkK(
  amount0In: bigint,
  amount1In: bigint,
  amount0Out: bigint,
  amount1Out: bigint,
  token0Reserve: bigint,
  token1Reserve: bigint,
  swapFee: number
  // balance0: bigint,
  // balance1: bigint
): boolean {
    console.log("_reserve0: ", token0Reserve)
    console.log("_reserve1: ", token1Reserve)
  let balance0 = token0Reserve - amount0Out
  let balance1 = token1Reserve - amount1Out
  balance0 = balance0 + amount0In
  balance1 = balance1 + amount1In
  let balance0Adjusted = balance0 * BigInt(10000) - amount0In! * BigInt(swapFee)
  let balance1Adjusted = balance1 * BigInt(10000) - amount1In! * BigInt(swapFee)
  console.log("amount0In: ", amount0In)
  console.log("amount1In: ", amount1In)
  console.log("amount0Out: ", amount0Out)
  console.log("amount1Out: ", amount1Out)
  console.log("balance0: ", balance0)
  console.log("balance1: ", balance1)
  console.log("balance0Adjusted: ", balance0Adjusted)
  console.log("balance1Adjusted: ", balance1Adjusted)
  console.log(
    "is K: ",
    balance0Adjusted * balance1Adjusted >= token0Reserve * token1Reserve * BigInt(10000 ** 2)
  )
  return balance0Adjusted * balance1Adjusted >= token0Reserve * token1Reserve * BigInt(10000 ** 2)
}
// 2066136369805038329069902160839n
// 2066134517928515832716224143340

// 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0:  369620660242875180
// 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512:  55422466939193318
// 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9:  0
// 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9:  2759104599245240220
// 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853:  
// 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707:  0
// 0x0165878A594ca255338adfa4d48449f69242Eb8F:  581669834961501