pragma solidity =0.5.16;
import "./interfaces/IWineryPair.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IWineryCallee.sol";
import "./interfaces/IWineryFactory.sol";
import "./WineryERC20.sol";
import "./libraries/UQ112x112.sol";
import "./libraries/Math.sol";
import "hardhat/console.sol";

contract WineryPair is IWineryPair, WineryERC20 {
  using SafeMath for uint256;
  using UQ112x112 for uint224;

  uint256 public constant MINIMUM_LIQUIDITY = 10**3;
  bytes4 private constant SELECTOR = bytes4(keccak256(bytes("transfer(address,uint256)")));

  address public factory;
  address public token0;
  address public token1;

  uint112 private reserve0; // uses single storage slot, accessible via getReserves
  uint112 private reserve1; // uses single storage slot, accessible via getReserves
  uint32 private blockTimestampLast; // uses single storage slot, accessible via getReserves

  uint256 public price0CumulativeLast;
  uint256 public price1CumulativeLast;
  uint256 public kLast; // reserve0 * reserve1, as of immediately after the most recent liquidity event
  uint32 public swapFee = 25; // uses 0.1% default
  uint32 public devFee = 1; // uses 0.5% default from swap fee

  uint256 private unlocked = 1;
  modifier lock() {
    require(unlocked == 1, "Winery: LOCKED");
    unlocked = 0;
    _;
    unlocked = 1;
  }

  function getReserves()
    public
    view
    returns (
      uint112 _reserve0,
      uint112 _reserve1,
      uint32 _blockTimestampLast
    )
  {
    _reserve0 = reserve0;
    _reserve1 = reserve1;
    _blockTimestampLast = blockTimestampLast;
  }

  function _safeTransfer(
    address token,
    address to,
    uint256 value
  ) private {
    (bool success, bytes memory data) = token.call(abi.encodeWithSelector(SELECTOR, to, value));
    require(success && (data.length == 0 || abi.decode(data, (bool))), "Winery: TRANSFER_FAILED");
  }

  event Mint(address indexed sender, uint256 amount0, uint256 amount1);
  event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to);
  event Swap(
    address indexed sender,
    uint256 amount0In,
    uint256 amount1In,
    uint256 amount0Out,
    uint256 amount1Out,
    address indexed to
  );
  event Sync(uint112 reserve0, uint112 reserve1);

  constructor() public {
    factory = msg.sender;
  }

  // called once by the factory at time of deployment
  function initialize(address _token0, address _token1) external {
    require(msg.sender == factory, "Winery: FORBIDDEN"); // sufficient check
    token0 = _token0;
    token1 = _token1;
  }

  function setSwapFee(uint32 _swapFee) external {
    require(_swapFee >= 0, "WineryPair: lower than 0");
    require(msg.sender == factory, "WineryPair: FORBIDDEN");
    require(_swapFee <= 10000, "WineryPair: FORBIDDEN_FEE");
    swapFee = _swapFee;
  }

  function setDevFee(uint32 _devFee) external {
    require(_devFee > 0, "WineryPair: lower then 0");
    require(msg.sender == factory, "WineryPair: FORBIDDEN");
    require(_devFee <= 500, "WineryPair: FORBIDDEN_FEE");
    devFee = _devFee;
  }

  // update reserves and, on the first call per block, price accumulators
  function _update(
    uint256 balance0,
    uint256 balance1,
    uint112 _reserve0,
    uint112 _reserve1
  ) private {
    require(balance0 <= uint112(-1) && balance1 <= uint112(-1), "Winery: OVERFLOW");
    uint32 blockTimestamp = uint32(block.timestamp % 2**32);
    uint32 timeElapsed = blockTimestamp - blockTimestampLast; // overflow is desired
    if (timeElapsed > 0 && _reserve0 != 0 && _reserve1 != 0) {
      // * never overflows, and + overflow is desired
      price0CumulativeLast += uint256(UQ112x112.encode(_reserve1).uqdiv(_reserve0)) * timeElapsed;
      price1CumulativeLast += uint256(UQ112x112.encode(_reserve0).uqdiv(_reserve1)) * timeElapsed;
    }
    reserve0 = uint112(balance0);
    reserve1 = uint112(balance1);
    blockTimestampLast = blockTimestamp;
    emit Sync(reserve0, reserve1);
  }

  // if fee is on, mint liquidity equivalent to 1/6th of the growth in sqrt(k)
  function _mintFee(uint112 _reserve0, uint112 _reserve1) private returns (bool feeOn) {
    address feeTo = IWineryFactory(factory).feeTo();
    feeOn = feeTo != address(0);
    uint256 _kLast = kLast; // gas savings
    if (feeOn) {
      if (_kLast != 0) {
        uint256 rootK = Math.sqrt(uint256(_reserve0).mul(_reserve1));
        uint256 rootKLast = Math.sqrt(_kLast);
        if (rootK > rootKLast) {
          uint256 numerator = totalSupply.mul(rootK.sub(rootKLast));
          uint256 denominator = rootK.mul(devFee).add(rootKLast);
          uint256 liquidity = numerator / denominator;
          if (liquidity > 0) _mint(feeTo, liquidity);
        }
      }
    } else if (_kLast != 0) {
      kLast = 0;
    }
  }

  // this low-level function should be called from a contract which performs important safety checks
  function mint(address to) external lock returns (uint256 liquidity) {
    (uint112 _reserve0, uint112 _reserve1, ) = getReserves(); // gas savings
    uint256 balance0 = IERC20(token0).balanceOf(address(this));
    uint256 balance1 = IERC20(token1).balanceOf(address(this));
    uint256 amount0 = balance0.sub(_reserve0);
    uint256 amount1 = balance1.sub(_reserve1);

    bool feeOn = _mintFee(_reserve0, _reserve1);
    uint256 _totalSupply = totalSupply; // gas savings, must be defined here since totalSupply can update in _mintFee
    if (_totalSupply == 0) {
      liquidity = Math.sqrt(amount0.mul(amount1)).sub(MINIMUM_LIQUIDITY);
      _mint(address(0), MINIMUM_LIQUIDITY); // permanently lock the first MINIMUM_LIQUIDITY tokens
    } else {
      liquidity = Math.min(
        amount0.mul(_totalSupply) / _reserve0,
        amount1.mul(_totalSupply) / _reserve1
      );
    }
    require(liquidity > 0, "Winery: INSUFFICIENT_LIQUIDITY_MINTED");
    _mint(to, liquidity);

    _update(balance0, balance1, _reserve0, _reserve1);
    if (feeOn) kLast = uint256(reserve0).mul(reserve1); // reserve0 and reserve1 are up-to-date
    emit Mint(msg.sender, amount0, amount1);
  }

  // this low-level function should be called from a contract which performs important safety checks
  function burn(address to) external lock returns (uint256 amount0, uint256 amount1) {
    (uint112 _reserve0, uint112 _reserve1, ) = getReserves(); // gas savings
    address _token0 = token0; // gas savings
    address _token1 = token1; // gas savings
    uint256 balance0 = IERC20(_token0).balanceOf(address(this));
    uint256 balance1 = IERC20(_token1).balanceOf(address(this));
    uint256 liquidity = balanceOf[address(this)];

    bool feeOn = _mintFee(_reserve0, _reserve1);
    uint256 _totalSupply = totalSupply; // gas savings, must be defined here since totalSupply can update in _mintFee
    amount0 = liquidity.mul(balance0) / _totalSupply; // using balances ensures pro-rata distribution
    amount1 = liquidity.mul(balance1) / _totalSupply; // using balances ensures pro-rata distribution
    require(amount0 > 0 && amount1 > 0, "Winery: INSUFFICIENT_LIQUIDITY_BURNED");
    _burn(address(this), liquidity);
    _safeTransfer(_token0, to, amount0);
    _safeTransfer(_token1, to, amount1);
    balance0 = IERC20(_token0).balanceOf(address(this));
    balance1 = IERC20(_token1).balanceOf(address(this));

    _update(balance0, balance1, _reserve0, _reserve1);
    if (feeOn) kLast = uint256(reserve0).mul(reserve1); // reserve0 and reserve1 are up-to-date
    emit Burn(msg.sender, amount0, amount1, to);
  }

  // this low-level function should be called from a contract which performs important safety checks
  function swap(
    uint256 amount0Out,
    uint256 amount1Out,
    address to,
    bytes calldata data
  ) external lock {
    // console.log("Swap function in pair start -----------------------------");
    // require(amount0Out > 0 || amount1Out > 0, "Winery: INSUFFICIENT_OUTPUT_AMOUNT");
    // (uint112 _reserve0, uint112 _reserve1, ) = getReserves(); // gas savings
    // require(amount0Out < _reserve0 && amount1Out < _reserve1, "Winery: INSUFFICIENT_LIQUIDITY");

    // console.log("amount0Out: %s, amount1Out: %s", amount0Out, amount1Out);
    // console.log("token0: %s, token1: %s", token0, token1);
    // console.log("reserve0: %s, reserve1: %s", _reserve0, _reserve1);
    // // 182,354,391,693,594,814,677
    // uint balance0;
    // uint balance1;
    // {
    //   // scope for _token{0,1}, avoids stack too deep errors
    //   address _token0 = token0;
    //   address _token1 = token1;
    //   require(to != _token0 && to != _token1, "Winery: INVALID_TO");
    //   console.log("Msg sender: ", msg.sender);
    //   console.log("Balance of sender in token0: ", IERC20(_token0).balanceOf(msg.sender));
    //   console.log("Balance of sender in token1: ", IERC20(_token1).balanceOf(msg.sender));
    //   console.log("To: ", to);
    //   if (amount0Out > 0) _safeTransfer(_token0, to, amount0Out); // optimistically transfer tokens
    //   if (amount1Out > 0) _safeTransfer(_token1, to, amount1Out); // optimistically transfer tokens
    //   if (data.length > 0) IWineryCallee(to).WineryCall(msg.sender, amount0Out, amount1Out, data);
    //   balance0 = IERC20(_token0).balanceOf(address(this));
    //   balance1 = IERC20(_token1).balanceOf(address(this));
    //   console.log("Balance of pair in token0: ", balance0);
    //   console.log("Balance of pair in token1: ", balance1);
    // }

    // uint amount0In = balance0 > _reserve0 - amount0Out ? balance0 - (_reserve0 - amount0Out) : 0;
    // uint amount1In = balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;

    // require(amount0In > 0 || amount1In > 0, "Winery: INSUFFICIENT_INPUT_AMOUNT");

    // {
    //   // scope for reserve{0,1}Adjusted, avoids stack too deep errors
    //   uint _swapFee = swapFee;
    //   uint balance0Adjusted = balance0.mul(10000).sub(amount0In.mul(_swapFee));
    //   uint balance1Adjusted = balance1.mul(10000).sub(amount1In.mul(_swapFee));
    //   console.log("balance 0 ", balance0);
    //   console.log("reserve 0 ", _reserve0);
    //   console.log("amount 0 out ", amount0Out);
    //   console.log("amount 0 in ", amount0In);
    //   console.log("balance 0 ajdusted", balance0Adjusted);
    //   console.log("balance 1 ", balance1);
    //   console.log("reserve 1 ", _reserve1);
    //   console.log("amount 1 out ", amount1Out);
    //   console.log("amount 1 in ", amount1In);
    //   console.log("balance 1 ajdusted", balance1Adjusted);
    //   console.log("swap fee ", swapFee);
    //   console.log("Left: ", balance0Adjusted.mul(balance1Adjusted));
    //   console.log("Right: ", uint(_reserve0).mul(_reserve1).mul(10000**2));
    //   console.log(
    //     "Is K: ",
    //     balance0Adjusted.mul(balance1Adjusted) >= uint(_reserve0).mul(_reserve1).mul(10000**2)
    //   );
    //   console.log("------------------------------");

    //   require(
    //     balance0Adjusted.mul(balance1Adjusted) >= uint(_reserve0).mul(_reserve1).mul(10000**2),
    //     "Winery: K"
    //   );
    // }

    // _update(balance0, balance1, _reserve0, _reserve1);
    // emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
    // console.log("Swap function in pair ended -----------------------------");
    require(amount0Out > 0 || amount1Out > 0, "Pancake: INSUFFICIENT_OUTPUT_AMOUNT");
    (uint112 _reserve0, uint112 _reserve1, ) = getReserves(); // gas savings
    require(amount0Out < _reserve0 && amount1Out < _reserve1, "Pancake: INSUFFICIENT_LIQUIDITY");

    uint256 balance0;
    uint256 balance1;
    {
      // scope for _token{0,1}, avoids stack too deep errors
      address _token0 = token0;
      address _token1 = token1;
      require(to != _token0 && to != _token1, "Pancake: INVALID_TO");
      if (amount0Out > 0) _safeTransfer(_token0, to, amount0Out); // optimistically transfer tokens
      if (amount1Out > 0) _safeTransfer(_token1, to, amount1Out); // optimistically transfer tokens
      if (data.length > 0) IWineryCallee(to).WineryCall(msg.sender, amount0Out, amount1Out, data);
      balance0 = IERC20(_token0).balanceOf(address(this));
      balance1 = IERC20(_token1).balanceOf(address(this));
    }
    uint256 amount0In = balance0 > _reserve0 - amount0Out ? balance0 - (_reserve0 - amount0Out) : 0;
    uint256 amount1In = balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;
    require(amount0In > 0 || amount1In > 0, "Pancake: INSUFFICIENT_INPUT_AMOUNT");
    {
      // scope for reserve{0,1}Adjusted, avoids stack too deep errors
      uint256 balance0Adjusted = (balance0.mul(10000).sub(amount0In.mul(swapFee)));
      uint256 balance1Adjusted = (balance1.mul(10000).sub(amount1In.mul(swapFee)));
      console.log("Pool ----------------");
      console.log("balance 0 ", balance0);
      console.log("reserve 0 ", _reserve0);
      console.log("amount 0 Out ", amount0Out);
      console.log("amount 0 In ", amount0In);
      console.log("balance 0 ajdusted", balance0Adjusted);
      console.log("balance 1 ", balance1);
      console.log("reserve 1 ", _reserve1);
      console.log("amount 1 Out ", amount1Out);
      console.log("amount 1 In ", amount1In);
      console.log("balance 1 ajdusted", balance1Adjusted);
      console.log("swap fee: ", swapFee);
      console.log("Left: ", balance0Adjusted.mul(balance1Adjusted));
      console.log("Right: ", uint256(_reserve0).mul(_reserve1).mul(10000**2));
      console.log(
        "Is K: ",
        balance0Adjusted.mul(balance1Adjusted) >= uint256(_reserve0).mul(_reserve1).mul(10000**2)
      );
      require(
        balance0Adjusted.mul(balance1Adjusted) >= uint256(_reserve0).mul(_reserve1).mul(10000**2),
        "Pancake: K"
      );
    }

    _update(balance0, balance1, _reserve0, _reserve1);
    emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
  }

  // force balances to match reserves
  function skim(address to) external lock {
    address _token0 = token0; // gas savings
    address _token1 = token1; // gas savings
    _safeTransfer(_token0, to, IERC20(_token0).balanceOf(address(this)).sub(reserve0));
    _safeTransfer(_token1, to, IERC20(_token1).balanceOf(address(this)).sub(reserve1));
  }

  // force reserves to match balances
  function sync() external lock {
    _update(
      IERC20(token0).balanceOf(address(this)),
      IERC20(token1).balanceOf(address(this)),
      reserve0,
      reserve1
    );
  }
}
