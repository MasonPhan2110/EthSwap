import React, { useEffect, useState } from 'react'
import { View, useColorScheme, TextInput, StyleSheet, SafeAreaView, Text, TouchableOpacity, Image, Alert } from 'react-native'
import EthSwap from '../abis/EthSwap.json'
import Token from '../abis/Token.json'
const Home = () =>{
    const eth = {
        type:'eth',
        value:0,
        image : require('../res/eth.png'),
        balance:0
    }
    const token = {
        type:'token',
        value:0,
        image : require('../res/logo.png'),
        balance:0
    }
    const [amountInput,setamountInput] = useState(eth)
    const [amountOutput,setamountOutput] = useState(token)
    const [tokenContract,setTokenContract] = useState({})
    const [ethSwapContract,setEthSwapContract] = useState({})
    const [privateKey, setPrivateKey] = useState('912b766792fc9460a34bc11045f65b7e4f836738656938f3da736289907c44d6')
    const [status, setStatus] = useState(false)
    let walletAddress = "0x7D17f0aED991AD5d562F0bA3898e6166Ce493EB1";
    const rpcURL = 'https://rinkeby.infura.io/v3/7941dd5459a048d69be5d048f4b9c932';
    useEffect( ()=>{
        const Web3 = require('web3')
        const web3 = new Web3(new Web3.providers.HttpProvider(rpcURL))
        loadBlockchainData(web3)
        //get ETH balance
        web3.eth.getBalance(walletAddress, function(err, result) {
            if (err) {
              console.log(err)
            } else {
              if(amountInput.type == 'eth'){
                let oldValue = amountInput;
                let balance = web3.utils.fromWei(result, "ether");
                oldValue.balance = parseFloat(balance).toFixed(4)
                setamountInput({...oldValue})
              }else{
                let oldValue = amountOutput;
                let balance = web3.utils.fromWei(result, "ether");
                oldValue.balance = parseFloat(balance).toFixed(4)
                setamountOutput({...oldValue})
              }
            }
        })
        setStatus(false)
    },[status])
    const loadBlockchainData = async(web3) =>{
        const netWorkID = await web3.eth.net.getId();
        //load Token
        const tokenData = Token.networks[netWorkID]
        if(tokenData){
            tokenAddress = tokenData.address;
            let contract = new web3.eth.Contract(Token.abi,tokenAddress);
            setTokenContract(contract)
            let balance = await contract.methods.balanceOf(walletAddress).call();
            if(amountOutput.type == 'token'){
                let oldValue = amountOutput;
                oldValue.balance = web3.utils.fromWei(balance.toString(), 'ether')
                setamountOutput({...oldValue})
            }else{
                let oldValue = amountInput;
                oldValue.balance = web3.utils.fromWei(balance.toString(), 'ether')
                setamountInput({...oldValue})
            }
            
        }else{
            Alert.alert('Token contract not deployed to detected network')
        }
        //load EthSwap
        const ethSwapData = EthSwap.networks[netWorkID]
        if(ethSwapData){
            ethSwapaddress = EthSwap.networks[netWorkID].address;
            let contract = new web3.eth.Contract(EthSwap.abi,ethSwapaddress);
            setEthSwapContract(contract)
        }else{
            Alert.alert('EthSwap contract not deployed to detected network')
        }
        
    }
    const sellToken = () => {
        console.log("sell Token")
        const Web3 = require('web3')
        const web3 = new Web3(new Web3.providers.HttpProvider(rpcURL))
        sendSignTransaction('sellTokens', web3)
    }
    const sellETH = () => {
        const Web3 = require('web3')
        const web3 = new Web3(new Web3.providers.HttpProvider(rpcURL))
        sendSignTransaction('buyTokens', web3)
    }
    const sendSignTransaction = async (functionName, web3) => {
        async function send(transaction, privateKey) {
            const options = {
                to      : transaction._parent._address,
                data    : transaction.encodeABI(),
                gasPrice: "4500000000",
                gas     : "519990",
                value   : functionName == 'buyTokens'? 
                        web3.utils.numberToHex(web3.utils.toWei(amountInput.value.toString(), 'ether'))
                        :'0'
            };
            const signed  = await web3.eth.accounts.signTransaction(options, privateKey);
            const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
            return receipt;
        }
        let receipt;
        if(functionName == 'buyTokens'){
            receipt = await send(ethSwapContract.methods.buyTokens(), privateKey);
        }else{
            await send(tokenContract.methods.approve(ethSwapContract._address,web3.utils.toWei(amountInput.value.toString(), 'ether')),privateKey)
            receipt = await send(ethSwapContract.methods.sellTokens(web3.utils.toWei(amountInput.value.toString(), 'ether')), privateKey);
        }
        
        //console.log(receipt)
        if(receipt.status == true){
            Alert.alert('Thông báo',functionName == 'buyTokens'?`Bạn đã bán thành công ${amountInput.value.toString()} ETH`:
            `Bạn đã bán thành công ${amountInput.value.toString()} Token`,
            [{
                text: 'OK',
                onPress: ()=>{
                    setStatus(true)
                }
            }])
        }
    }
    const isDarkMode = useColorScheme() === 'dark';
    const swap = () => {
        var Input = amountInput
        setamountInput(amountOutput)
        setamountOutput(Input)
    }
    openQRcode_modal =  () => {
        
    }
    return(
            <SafeAreaView>
                
                <View style={styles.Title}>
                    <Text style={isDarkMode?styles.textDark:styles.textLight}>Input</Text>
                    <Text style={isDarkMode?styles.textDark:styles.textLight}>{'Balance: ' +amountInput.balance} </Text>
                </View>
                <View style={styles.textInputWrapper}>
                <TextInput
                    value={amountInput.value}
                    placeholder={"0"}
                    placeholderTextColor="#3d3d3d"
                    style={isDarkMode?styles.textInputDark:styles.textInputLight}
                    keyboardType='numeric'
                    onChangeText={(text)=>{
                        let oldValue = amountInput
                        oldValue.value = parseFloat(text)
                        setamountInput({...oldValue})
                        oldValue = amountOutput
                        if(amountOutput.type === 'token'){
                            oldValue.value = amountInput.value*100
                        }else{
                            oldValue.value = amountInput.value/100
                        }
                        setamountOutput({...oldValue})
                    }}/>
                <Image
                    style = {styles.imageLogo}
                    source={amountInput.image}
                    />
                </View>
                
                <View style={styles.Title}>
                    <Text style={isDarkMode?styles.textDark:styles.textLight}>Output</Text>
                    <Text style={isDarkMode?styles.textDark:styles.textLight}>{'Balance: ' +amountOutput.balance}</Text>
                </View>
                
                <View style={styles.textInputWrapper}>
                <Text
                    style={[{textAlignVertical:'center', color:'#FFFFFF',flexGrow:1, fontSize:18}]}>{amountOutput.value.toString()}</Text>
                <Image
                    style = {styles.imageLogo}
                    source={amountOutput.image}/>
                </View>
                <View style={styles.Title}>
                    <Text style={isDarkMode?styles.textDark:styles.textLight}>Exchange Rate</Text>
                    <Text style={isDarkMode?styles.textDark:styles.textLight}>1 ETH = 100 DApp </Text>
                </View>
                {/* <TouchableOpacity style={isDarkMode?styles.btnDark:styles.btnLight}>
                    <Text style={isDarkMode?styles.textDark:textLight}>Buy</Text>
                </TouchableOpacity> */}
                <TouchableOpacity style={isDarkMode?styles.btnDark:styles.btnLight} onPress={()=>{
                    if(amountInput.type == 'eth'){
                        sellETH()
                    }else{
                        sellToken()
                    }
                }}>
                    <Text style={isDarkMode?styles.textDark:styles.textLight}>Sell</Text>
                </TouchableOpacity>
                <TouchableOpacity style={isDarkMode?styles.btnDark:styles.btnLight} onPress={()=>{swap()}}>
                    <Text style={isDarkMode?styles.textDark:styles.textLight}>Swap</Text>
                </TouchableOpacity>
            </SafeAreaView>
    )
}
const styles = StyleSheet.create({
    textInputLight:{
        padding:10
    },
    textInputDark:{
        color:'#FFFFFF',
        flexGrow:1,
        fontSize:18
    },
    textDark:{
        color:"#FFFFFF",
    },
    textLight:{

    },
    Title:{
        marginTop:20,
        justifyContent:'space-between',
        flexDirection:'row'
    },
    btnDark:{
        marginTop:20,
        height:40,
        borderColor:"#FFFFFF",
        borderWidth:1,
        borderRadius:5,
        alignItems:'center',
        justifyContent:'center'
    },
    btnLight:{
        marginTop:20,
        height:40,
        borderColor:"#d3d3d3",
        borderWidth:1,
        borderRadius:5,
        alignItems:'center',
        justifyContent:'center'
    },
    textInputWrapper:{
        height:50,
        flexDirection:'row',
        alignItems:'center',
        borderRadius:5,
        borderColor:"#FFFFFF",
        borderWidth:1,
        padding:5
    },
    imageLogo:{
        width:35,
        height:35
    },
})
export default Home