import { Injectable } from '@angular/core';
import { default as Web3 } from 'web3';

declare let window: any;
declare let require: any;

let DaiPriceFeedArtifact = require('../../../../../build/contracts/DSValueInterface.json');

@Injectable({
  providedIn: 'root'
})
export class Web3Service {

    private KOVAN_DAI_PRICE_FEED = "0xa5aA4e07F5255E14F02B385b1f04b35cC50bdb66";
    private readyPromise: Promise<any>;

    block: any = null;
    netId: number = null;

    DaiPriceFeed: any;
    ethPriceInDai: number;

    signedIn: boolean = false;
    account = {
        address: null,
        balance: null,
    }

	constructor() {
        this.readyPromise = new Promise((resolve, reject) => {
            if(window.ethereum || window.web3){
                if (window.ethereum) { // Modern dapp browsers...
                    window.web3 = new Web3(window.ethereum);
                }
                else if (window.web3) { // Legacy dapp browsers...
                    console.warn("Your financial privacy is at risk! Disable automatic account exposure with whatever ethereum wallet provider you use")
                    window.web3 = new Web3(window.web3.currentProvider);
                }

                this.DaiPriceFeed = new window.web3.eth.Contract(DaiPriceFeedArtifact.abi, this.KOVAN_DAI_PRICE_FEED);

                Promise.all([
                    window.web3.eth.net.getId(),
                    this.getBlock('latest'),
                    this.getCurrentAccount(),
                    this.DaiPriceFeed.methods.read().call(),
                ])
                .then(promises => {
                    this.netId = promises[0];
                    this.block = promises[1];
                    this.account.address = promises[2];
                    this.ethPriceInDai = Number(window.web3.utils.fromWei(promises[3],"ether"));

                    this.customizeWeb3();
                    this.watchForAccountChanges();
                    this.watchForNewBlocks();

                    if(this.signedIn){
                        this.getBalance(promises[2]);
                        this.watchAccountBalance();
                    }

                    console.log("Web3: ", this);
                    resolve()
                })
                .catch(reject)
            }
            else {
                reject('Non-Ethereum browser detected. You should consider trying MetaMask!')
            }
        })
	}

    ready(){
        return this.readyPromise;
    }

	async signIn(){
        try {
            // Request account access if needed
            await window.ethereum.enable();
            return this.getCurrentAccount()
            .then(currentAccount => {
                this.watchAccountBalance();
                this.getBalance(currentAccount);
                this.signedIn = true;
                return currentAccount;
            })
        } catch (error) {
            return Promise.reject(new Error("User denied account access..."));
        }
    }

	getCurrentAccount(){
		return window.web3.eth.getAccounts()
        .then(accounts => {
            if(accounts.length > 0){
                this.account.address = accounts[0];
                this.signedIn = true;
                return accounts[0];
            } else {
                this.signedIn = false;
                this.account.address = null;
                this.account.balance = null;
            }
            
            return null;
        })
	}

	getBalance(account){
        return window.web3.eth.getBalance(account)
        .then(balance => {
            if(account == this.account.address)
                this.account.balance = balance;

            return balance;
        })
	}

    getBlock(numberOrString){
        return window.web3.eth.getBlock(numberOrString)
        .then(blockData => {
            if(numberOrString == 'latest')
                this.block = blockData;
            return blockData;
        })
    }

    weiToDai (weiValue) {
        return Number(window.web3.utils.fromWei(weiValue,'ether')) * this.ethPriceInDai;
    }

    private watchForAccountChanges(){
        return this.getCurrentAccount()
        .then(currentAccount => {
            //console.log("setting watched account to ", currentAccount);
            this.account.address = currentAccount;
            setInterval(() => {
                this.getCurrentAccount()
                .then(currentAccount => {
                    //console.log(currentAccount, this.account.address)
                    if(this.account.address && this.account.address != currentAccount)
                        location.reload();
                })
            }, 250);
            return currentAccount;
        })
        .catch(console.error)
    }

    private watchForNewBlocks(){
        window.web3.eth.subscribe('newBlockHeaders', (error, blockData) => {
            if (!error){
                this.block = blockData;
            }
        });
    }

    private watchAccountBalance(){
        window.web3.eth.subscribe('newBlockHeaders', (error, blockData) => {
            //console.log(error, blockData);
            if (!error && this.account.address){
                this.getBalance(this.account.address);
            }
        });
    }

	private customizeWeb3(){
        window.web3.utils['nullAddress'] = '0x0000000000000000000000000000000000000000';
	}
}
