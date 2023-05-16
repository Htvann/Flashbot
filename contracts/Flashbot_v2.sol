// SPDX-ense-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "./interfaces/IWineryPair.sol";
import "./interfaces/IWETH.sol";
import "./libraries/Decimal.sol";
import "hardhat/console.sol";

struct Pool {
  address poolAddress;
  address token0;
  address token1;
  uint256 token0Reserve;
  uint256 token1Reserve;
  uint256 swapFee;
}

struct CallbackData {
  uint256 debtAmount;
  address debtToken;
  Pool[] poolPath;
}

contract FlashswapMultipoolV2 is Ownable {
  using SafeERC20 for IERC20;

  receive() external payable {}

  fallback() external {
    (address sender, uint256 amount0, uint256 amount1, bytes memory data) = abi.decode(
      msg.data[4:],
      (address, uint256, uint256, bytes)
    );
    paybackLoans(sender, amount0, amount1, data);
  }

  function startSwapInMultiPool(
    Pool[] memory poolPath,
    address baseToken,
    uint256 debtAmount
  ) public {
    uint256 balanceBefore = IERC20(baseToken).balanceOf(address(this));

    {
      uint256 borrowIntermediaryTokenAmountInFirstPool = getAmountOut(
        debtAmount,
        (baseToken == poolPath[0].token0) ? poolPath[0].token0Reserve : poolPath[0].token1Reserve,
        (baseToken == poolPath[0].token0) ? poolPath[0].token1Reserve : poolPath[0].token0Reserve,
        poolPath[0].swapFee
      );

      (uint256 swapAmountToken0Out, uint256 swapAmountToken1Out) = (baseToken == poolPath[0].token0)
        ? (uint256(0), borrowIntermediaryTokenAmountInFirstPool)
        : (borrowIntermediaryTokenAmountInFirstPool, uint256(0));

      CallbackData memory callbackData;
      callbackData.debtAmount = debtAmount;
      callbackData.debtToken = baseToken;
      callbackData.poolPath = poolPath;

      bytes memory data = abi.encode(callbackData);
      IWineryPair(poolPath[0].poolAddress).swap(
        swapAmountToken0Out,
        swapAmountToken1Out,
        address(this),
        data
      );
    }

    uint256 balanceAfter = IERC20(baseToken).balanceOf(address(this));

    console.log("Balance After", balanceAfter);

    require(balanceAfter > balanceBefore, "Losing money");
  }

  function paybackLoans(
    address sender,
    uint256 amount0,
    uint256 amount1,
    bytes memory data
  ) internal {
    require(sender == address(this), "Not from this contract");
    uint256 currentTokenAmountInCyclicPool = amount0 > 0 ? amount0 : amount1;
    CallbackData memory info = abi.decode(data, (CallbackData));

    address currentTokenInCyclicPool = (info.poolPath[0].token0 == info.debtToken)
      ? info.poolPath[0].token1
      : info.poolPath[0].token0;

    IERC20(currentTokenInCyclicPool).transfer(
      info.poolPath[1].poolAddress,
      currentTokenAmountInCyclicPool
    );

    for (uint256 i = 1; i < info.poolPath.length; i++) {
      bool isToken0IsIntermediaryToken = info.poolPath[i].token0 == currentTokenInCyclicPool;

      currentTokenInCyclicPool = isToken0IsIntermediaryToken
        ? info.poolPath[i].token1
        : info.poolPath[i].token0;

      (uint256 reserveIn, uint256 reserveOut) = (isToken0IsIntermediaryToken)
        ? (info.poolPath[i].token0Reserve, info.poolPath[i].token1Reserve)
        : (info.poolPath[i].token1Reserve, info.poolPath[i].token0Reserve);

      currentTokenAmountInCyclicPool = getAmountOut(
        currentTokenAmountInCyclicPool,
        reserveIn,
        reserveOut,
        info.poolPath[i].swapFee
      );

      (uint256 amount0Out, uint256 amount1Out) = isToken0IsIntermediaryToken
        ? (uint256(0), currentTokenAmountInCyclicPool)
        : (currentTokenAmountInCyclicPool, uint256(0));

      IWineryPair(info.poolPath[i].poolAddress).swap(
        amount0Out,
        amount1Out,
        (i < info.poolPath.length - 1) ? info.poolPath[i + 1].poolAddress : address(this),
        new bytes(0)
      );
    }

    IERC20(info.debtToken).safeTransfer(info.poolPath[0].poolAddress, info.debtAmount);
  }

  function getAmountOut(
    uint256 amountIn,
    uint256 reserveIn,
    uint256 reserveOut,
    uint256 swapFee
  ) internal pure returns (uint256 amountOut) {
    require(amountIn > 0, "INSUFFICIENT_INPUT_AMOUNT");
    require(reserveIn > 0 && reserveOut > 0, "INSUFFICIENT_LIQUIDITY");

    uint256 _swapFee = (swapFee == 0) ? 25 : swapFee;
    uint256 amountInWithFee = amountIn * (10000 - _swapFee);
    uint256 numerator = amountInWithFee * (reserveOut);
    uint256 denominator = reserveIn * (10000) + amountInWithFee;
    amountOut = numerator / denominator;
  }

  function getAmountIn(
    uint256 amountOut,
    uint256 reserveIn,
    uint256 reserveOut,
    uint256 swapFee
  ) internal pure returns (uint256 amountIn) {
    require(amountOut > 0, "UniswapV2Library: INSUFFICIENT_OUTPUT_AMOUNT");
    require(reserveIn > 0 && reserveOut > 0, "UniswapV2Library: INSUFFICIENT_LIQUIDITY");
    uint256 numerator = reserveIn * amountOut * 10000;
    uint256 denominator = (reserveOut - amountOut) * (10000 - swapFee);
    amountIn = numerator / denominator + 1;
  }

  function withdrawFund(address erc20Address) public onlyOwner {
    uint256 balance = IERC20(erc20Address).balanceOf(address(this));
    if (balance > 0) {
      IERC20(erc20Address).transfer(owner(), balance);
    }
  }
}
