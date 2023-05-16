//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "hardhat/console.sol";

struct Pool {
  address poolAddress;
  address token0;
  address token1;
  uint256 token0Reserve;
  uint256 token1Reserve;
  uint256 swapFee;
}

library CyclicLibrary {
  function merge2Pool(
    Pool memory pool0,
    Pool memory pool1,
    address intermediaryToken
  ) internal pure returns (Pool memory mergedPool) {
    require(
      (pool0.token0 == intermediaryToken || pool0.token1 == intermediaryToken) &&
        (pool1.token0 == intermediaryToken || pool1.token1 == intermediaryToken),
      "Not found any intermediary token"
    );
    uint256 a12;
    uint256 a21;
    uint256 a23;
    uint256 a32;
    address token0AddressMerged;
    address token1AddressMerged;
    if (pool0.token0 == intermediaryToken) {
      a12 = pool0.token1Reserve;
      a21 = pool0.token0Reserve;
      token0AddressMerged = pool0.token1;
    } else {
      a12 = pool0.token0Reserve;
      a21 = pool0.token1Reserve;
      token0AddressMerged = pool0.token0;
    }

    if (pool1.token0 == intermediaryToken) {
      a32 = pool1.token1Reserve;
      a23 = pool1.token0Reserve;
      token1AddressMerged = pool1.token1;
    } else {
      a32 = pool1.token0Reserve;
      a23 = pool1.token1Reserve;
      token1AddressMerged = pool1.token0;
    }

    uint256 _swapComission = (10000 - max(pool0.swapFee, pool1.swapFee));
    uint256 token0ReserveMerged = (a12 * a23) / (a23 + (_swapComission * a21) / 10000);
    uint256 token1ReserveMerged = ((_swapComission * a21 * a32) / 10000) /
      (a23 + (_swapComission * a21) / 10000);

    // console.log("Token 0 merged: ", token0AddressMerged);
    // console.log("Token 0 reseved: ", token0ReserveMerged);
    // console.log("Token 1 merged: ", token1AddressMerged);
    // console.log("Token 1 reseve: ", token1ReserveMerged);

    // console.log(
    //   "Pool merged token0: %s with %s and token1: %s with %s",
    //   token0AddressMerged,
    //   token0ReserveMerged,
    //   token1AddressMerged,
    //   token1ReserveMerged
    // );

    mergedPool = Pool(
      address(0),
      token0AddressMerged,
      token1AddressMerged,
      token0ReserveMerged,
      token1ReserveMerged,
      max(pool0.swapFee, pool1.swapFee)
    );
  }

  function clonePool(Pool memory origin) internal pure returns (Pool memory copy) {
    copy = Pool(
      origin.poolAddress,
      origin.token0,
      origin.token1,
      origin.token0Reserve,
      origin.token1Reserve,
      origin.swapFee
    );
  }

  function splitCyclicInHalf(Pool[] memory cyclic, address[] memory path)
    internal
    pure
    returns (
      Pool[] memory cyclic1,
      address[] memory path1,
      Pool[] memory cyclic2,
      address[] memory path2
    )
  {
    // Pool[] memory cloneCyclic = new Pool[](cyclic.length);
    // for (uint256 i = 0; i < cyclic.length; i++) {
    //   cloneCyclic[i] = clonePool(cyclic[i]);
    // }

    // console.log("Split cyclic -------------");
    uint256 length = cyclic.length / 2;

    cyclic1 = new Pool[](length);
    path1 = new address[](length + 1);
    cyclic2 = new Pool[](cyclic.length - length);
    path2 = new address[](cyclic.length - length + 1);

    // console.log("Cylic length: %s", cyclic.length);
    // console.log("length: %s", length);
    // console.log("Cylic 1 length: %s, path 1 length: %s", cyclic1.length, path1.length);
    // console.log("Cylic 2 length: %s, path 2 length: %s", cyclic2.length, path2.length);

    for (uint256 i = 0; i < cyclic1.length; i++) {
      cyclic1[i] = clonePool(cyclic[i]);
      path1[i] = path[i];
    }
    path1[cyclic1.length] = path[cyclic1.length];

    path2[0] = path[cyclic1.length];
    for (uint256 i = 0; i < cyclic2.length; i++) {
      cyclic2[i] = clonePool(cyclic[i + length]);
      path2[i + 1] = path[i + 1 + length];
    }

    path1[cyclic1.length] = path[cyclic1.length];

    // for (uint256 j = 0; j < cyclic1.length; j++) {
    //   console.log(
    //     "On cyclic 1 at i: %s token0 is %s with reserve %s",
    //     j,
    //     cyclic1[j].token0,
    //     cyclic1[j].token0Reserve
    //   );
    //   console.log(
    //     "On cyclic 1 at i: %s token1 is %s with reserve %s",
    //     j,
    //     cyclic1[j].token1,
    //     cyclic1[j].token1Reserve
    //   );
    // }
    // for (uint256 j = 0; j < path1.length; j++) {
    //   console.log("On path 1 at i: %s is %s", j, path1[j]);
    // }
    // for (uint256 j = 0; j < cyclic2.length; j++) {
    //   console.log(
    //     "On cyclic 2 at i: %s token0 is %s with reserve %s",
    //     j,
    //     cyclic2[j].token0,
    //     cyclic2[j].token0Reserve
    //   );
    //   console.log(
    //     "On cyclic 2 at i: %s token1 is %s with reserve %s",
    //     j,
    //     cyclic2[j].token1,
    //     cyclic2[j].token1Reserve
    //   );
    // }
    // for (uint256 j = 0; j < path2.length; j++) {
    //   console.log("On path 2 at i: %s is %s", j, path2[j]);
    // }
  }

  function calculateOptimalBetweenTwoPool(
    Pool memory pool0,
    Pool memory pool1,
    address intermediaryToken
  ) internal pure returns (uint256 debt) {
    // console.log("Intermediary token ", intermediaryToken);
    // console.log("pool0.token0 ", pool0.token0);
    // console.log("pool0.token1 ", pool0.token1);
    // console.log("pool1.token0 ", pool1.token0);
    // console.log("pool1.token1 ", pool1.token1);
    require(
      (pool0.token0 == intermediaryToken || pool0.token1 == intermediaryToken) &&
        (pool1.token0 == intermediaryToken || pool1.token1 == intermediaryToken),
      "Not found any intermediary token"
    );
    uint256 a13z;
    uint256 a31z;
    uint256 a13;
    uint256 a31;

    if (pool0.token0 == intermediaryToken) {
      a13z = pool0.token1Reserve;
      a31z = pool0.token0Reserve;
    } else {
      a13z = pool0.token0Reserve;
      a31z = pool0.token1Reserve;
    }

    if (pool1.token0 == intermediaryToken) {
      a13 = pool1.token1Reserve;
      a31 = pool1.token0Reserve;
    } else {
      a13 = pool1.token0Reserve;
      a31 = pool1.token1Reserve;
    }

    // console.log("---------------------------------");
    // console.log("a13z: ", a13z);
    // console.log("a31z: ", a31z);
    // console.log("a13: ", a13);
    // console.log("a31: ", a31);
    uint256 _swapComission = (10000 - pool0.swapFee);
    uint256 a = (a13z * a31) / (a31 + (_swapComission * a31z) / 10000);
    uint256 az = (_swapComission * a13 * a31z) / ((a31 + (_swapComission * a31z) / 10000) * 10000);
    // console.log("a: ", a);
    // console.log("az: ", az);
    debt = ((sqrt((_swapComission * az * a) / 10000) - a) * 10000) / _swapComission;
    // console.log(debt);
    // console.log("---------------------------------");
  }

  function sqrt(uint256 a) internal pure returns (uint256) {
    if (a == 0) {
      return 0;
    }

    // For our first guess, we get the biggest power of 2 which is smaller than the square root of the target.
    // We know that the "msb" (most significant bit) of our target number `a` is a power of 2 such that we have
    // `msb(a) <= a < 2*msb(a)`.
    // We also know that `k`, the position of the most significant bit, is such that `msb(a) = 2**k`.
    // This gives `2**k < a <= 2**(k+1)` → `2**(k/2) <= sqrt(a) < 2 ** (k/2+1)`.
    // Using an algorithm similar to the msb computation, we are able to compute `result = 2**(k/2)` which is a
    // good first approximation of `sqrt(a)` with at least 1 correct bit.
    uint256 result = 1;
    uint256 x = a;
    if (x >> 128 > 0) {
      x >>= 128;
      result <<= 64;
    }
    if (x >> 64 > 0) {
      x >>= 64;
      result <<= 32;
    }
    if (x >> 32 > 0) {
      x >>= 32;
      result <<= 16;
    }
    if (x >> 16 > 0) {
      x >>= 16;
      result <<= 8;
    }
    if (x >> 8 > 0) {
      x >>= 8;
      result <<= 4;
    }
    if (x >> 4 > 0) {
      x >>= 4;
      result <<= 2;
    }
    if (x >> 2 > 0) {
      result <<= 1;
    }

    // At this point `result` is an estimation with one bit of precision. We know the true value is a uint128,
    // since it is the square root of a uint256. Newton's method converges quadratically (precision doubles at
    // every iteration). We thus need at most 7 iteration to turn our partial result with one bit of precision
    // into the expected uint128 result.
    unchecked {
      result = (result + a / result) >> 1;
      result = (result + a / result) >> 1;
      result = (result + a / result) >> 1;
      result = (result + a / result) >> 1;
      result = (result + a / result) >> 1;
      result = (result + a / result) >> 1;
      result = (result + a / result) >> 1;
      return min(result, a / result);
    }
  }

  function min(uint256 a, uint256 b) internal pure returns (uint256) {
    return a < b ? a : b;
  }

  function max(uint256 a, uint256 b) internal pure returns (uint256) {
    return a > b ? a : b;
  }

  function mergeMultiPoolByRecursion(Pool[] memory cyclic, address[] memory path)
    internal
    view
    returns (Pool memory)
  {
    // console.log("Current cyclic length", cyclic.length);
    if (cyclic.length == 1) {
      return cyclic[0];
    }
    if (cyclic.length == 2) {
      require(path.length == 3, "Path is not at correct format");
      return merge2Pool(cyclic[0], cyclic[1], path[1]);
    } else {
      (
        Pool[] memory cyclic1,
        address[] memory path1,
        Pool[] memory cyclic2,
        address[] memory path2
      ) = splitCyclicInHalf(cyclic, path);
      Pool memory firstPoolMerged = mergeMultiPoolByRecursion(cyclic1, path1);
      Pool memory secondPoolMerged = mergeMultiPoolByRecursion(cyclic2, path2);
      return merge2Pool(firstPoolMerged, secondPoolMerged, path1[path1.length - 1]);
    }
  }

  function calcDebtForMaximumProfitFromMultiPoolByMergingRecursion(
    Pool[] memory cyclic,
    address baseToken
  ) internal view returns (uint256 debt) {
    Pool[] memory cloneCyclic = new Pool[](cyclic.length);
    address[] memory path = new address[](cyclic.length + 1);
    address currentToken = baseToken;
    path[0] = baseToken;
    for (uint256 i = 0; i < cyclic.length; i++) {
      cloneCyclic[i] = clonePool(cyclic[i]);
      if (currentToken == cyclic[i].token0) {
        currentToken = cyclic[i].token1;
      } else {
        currentToken = cyclic[i].token0;
      }
      path[i + 1] = currentToken;
    }
    (
      Pool[] memory cyclic1,
      address[] memory path1,
      Pool[] memory cyclic2,
      address[] memory path2
    ) = splitCyclicInHalf(cyclic, path);
    Pool memory firstPool = mergeMultiPoolByRecursion(cyclic1, path1);
    Pool memory secondPool = mergeMultiPoolByRecursion(cyclic2, path2);
    debt = calculateOptimalBetweenTwoPool(
      firstPool,
      secondPool,
      firstPool.token0 == path[0] ? firstPool.token1 : firstPool.token0
    );
  }
}
