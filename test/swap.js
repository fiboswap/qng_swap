const { expect } = require("chai");
const { ethers } = require("hardhat");

const { BigNumber, constants, Contract, Wallet } = ethers;



function getNumForBig(big) {
  if ( big instanceof BigNumber ) {
      return big.toString()
  }
  if (  big instanceof Object ) {
      let obj = big instanceof Array ?[]:{}
      for(let k in big ) {
          obj[k] = getNumForBig(big[k])
      }
      return obj
  }
  return big
}


const maxInit = '0x' + 'f'.repeat(64)
const decimals = '0x' + (1e18).toString(16)
const hex = num => {
    const h = num.toString(16)
    return '0x' + (h.length % 2 === 1?'0':'') + num.toString(16)
}

function BN(num) {
    return BigNumber.from(num)
}


console.log(
    getNumForBig(
        BN(10000).div(3)
    ) 
)
let tx
let xps
let busd
let weth
let router
let factory
let pair
describe("swap", function () {

    before(async () => {
        const [owner, bob, alice, eln] = await ethers.getSigners();
        let token = await ethers.getContractFactory("TestCoin");
        xps = await token.deploy('t1');
        console.log('t1 to address ', xps.address)
        earnToken = xps;
        busd = await token.deploy('t2');
        console.log('t2 to address ', busd.address)

        // let token = await ethers.getContractFactory("contracts/tesCoin.sol:XIs");
        // stakeToken = await token.deploy('stakeToken token', 'stakeToken');

        /////////// swap ///////////
        // WETH
        weth = await ethers.getContractFactory("contracts/mock/WETH.sol:MockWETH");
        weth = await weth.deploy();
        
        console.log('weth to address ', weth.address)
        factory =  await ethers.getContractFactory("contracts/mock/MockUniswapV2Factory.sol:MockUniswapV2Factory");
        factory = await factory.deploy(owner.address);
        console.log('factory to address ', factory.address)

        router =  await ethers.getContractFactory("contracts/mock/MockUniswapV2Router02.sol:MockUniswapV2Router02");
        router = await router.deploy(
            factory.address,
            weth.address
        )
        console.log('router to address ', router.address)

        let tx = await xps.approve(router.address, maxInit)
        await tx.wait()
        console.log('t1 approve ', tx.hash)

        tx = await busd.approve(router.address, maxInit)
        await tx.wait()

        console.log('t2 approve ', tx.hash)


        tx = await router.addLiquidity(
            xps.address,
            busd.address,
            BN(100000).mul(decimals),
            BN(10000).mul(decimals),
            0,
            0,
            owner.address,
            ~~(new Date() / 1000) + 3600
        )
        console.time('addLiquidity')
        console.log('addLiquidity approve ', tx.hash)
        await tx.wait()
        console.timeEnd('addLiquidity')

        pair = await factory.getPair(xps.address,busd.address)
        // console.log('pair to:' , pair )
        let lp = await ethers.getContractFactory("contracts/mock/MockUniswapV2Factory.sol:MockUniswapV2FactoryUniswapV2Pair");
        pair = lp.attach(pair);

        ////////// 这里把 token 整理得和 main 一样 //////////
        // const token0 = await pair.token0()
        // console.log("token0 :", token0)
        // if ( token0 !== busd.address ) {
        //     [busd,xps] = [xps,busd];
        // }
        // expect(busd.address).to.equal(token0);
        /////////// end swap ///////////


    })
    it("swap", async function () {
        const [owner, bob, alice, eln] = await ethers.getSigners();
        
        console.log(
            getNumForBig(
                await pair.getReserves()
            ) 
        )
        // 买入 usd，取出 xps
        // function swapExactTokensForTokens(
        //     uint amountIn,
        //     uint amountOutMin,
        //     address[] calldata path,
        //     address to,
        //     uint deadline
        //   ) external returns (uint[] memory amounts);
        tx = await router.swapExactTokensForTokens(
            BN(21650).mul(decimals),
            0,
            [
                busd.address,
                xps.address,
            ],
            owner.address,
            ~~(new Date() / 1000) + 3600
        )
        console.time('swapExactTokensForTokens')
        console.log('swapExactTokensForTokens ', tx.hash)
        await tx.wait()
        console.timeEnd('swapExactTokensForTokens')
        await tx.wait()
        
        let res = await pair.getReserves()
        console.log(
            getNumForBig(
                res
            ),
            getNumForBig(
                res[0].div(res[1])
            )
        )
    });
});
