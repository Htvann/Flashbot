export {}

declare global {
  interface Number {
    toBigInt(): bigint
  }
}

Number.prototype.toBigInt = function (): bigint {
  return BigInt(
    Number(this).toLocaleString("fullwide", {
      useGrouping: false,
    })
  )
}