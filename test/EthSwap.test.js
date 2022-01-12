const { assert } = require('chai');

const EthSwap = artifacts.require("EthSwap")
const Token = artifacts.require("Token")
require('chai')
    .use(require('chai-as-promised'))
    .should()
function tokens(n){
    return web3.utils.toWei(n,'ether');
}
contract('EthSwap',([deployer, investor])=>{
    let token, ethSwap
    before(async()=>{
        token = await Token.new()
        ethSwap = await EthSwap.new(token.address)
        await token.transfer(ethSwap.address,tokens('1000000'))
    })
    describe('Token deployment', async ()=>{
        it('token has a name', async ()=>{
            const name = await token.name()
            assert.equal(name,'DApp Token')
        })
    })

    describe('EthSwap deployment', async ()=>{
        it('contract has a name', async ()=>{
            const name = await ethSwap.name()
            assert.equal(name,'EthSwap Instant Exchange')
        })
        it('contract has tokens', async ()=>{
            let balance = await token.balanceOf(ethSwap.address)
            assert.equal(balance.toString(),tokens('1000000'))
        })
    })


    describe('Buy Token()', async () =>{
        let result
        before(async()=>{
            //Purchase token before each example
            result = await ethSwap.buyTokens({from: investor, value: web3.utils.toWei('1','ether')})
        })
        it('Allow user to instanly purchase tokens from ethSwap for a fixed price', async () =>{
            //Check investor token balance after purchase
            let investorBalance = await token.balanceOf(investor)
            assert.equal(investorBalance.toString(), tokens('100'))
            //Check ethSwap balance after purchase
            let ethSwapBalance = await token.balanceOf(ethSwap.address)
            assert.equal(ethSwapBalance.toString(),tokens('999900'))
            ethSwapBalance = await web3.eth.getBalance(ethSwap.address)
            assert.equal(ethSwapBalance.toString(),web3.utils.toWei('1', 'Ether'))

            //Check log to ensure event was emitted with correct data
            const event = result.logs[0].args
            assert.equal(event.account, investor)
            assert.equal(event.token, token.address)
            assert.equal(event.amount.toString(), tokens('100').toString())
            assert.equal(event.rate.toString(), '100')
        })
    })


    describe('Sell Token()', async () =>{
        let result
        before(async()=>{
            // investor must approve tokens before the purchase
            await token.approve(ethSwap.address, tokens('100'),{from:investor})
            //Purchase token before each example
            result = await ethSwap.sellTokens(tokens('100'),{from:investor})
        })
        it('Allow user to instanly sell tokens to ethSwap for a fixed price', async () =>{
            //Check investor token balance after sell
            let investorBalance = await token.balanceOf(investor)
            assert.equal(investorBalance.toString(), tokens('0'))
            //Check ethSwap balance after sell
            let ethSwapBalance = await token.balanceOf(ethSwap.address)
            assert.equal(ethSwapBalance.toString(),tokens('1000000'))
            ethSwapBalance = await web3.eth.getBalance(ethSwap.address)
            assert.equal(ethSwapBalance.toString(),web3.utils.toWei('0', 'Ether'))

            //Check log to ensure event was emitted with correct data
            const event = result.logs[0].args
            assert.equal(event.account, investor)
            assert.equal(event.token, token.address)
            assert.equal(event.amount.toString(), tokens('100').toString())
            assert.equal(event.rate.toString(), '100')

            //Failure: investor cant sell more token than they have
            await ethSwap.sellTokens(tokens('500'),{from:investor}).should.be.rejected
        })
    })
})