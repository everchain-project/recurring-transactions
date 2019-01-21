import { Injectable } from '@angular/core';
import { default as Web3 } from 'web3';
declare let window: any;

@Injectable({
  providedIn: 'root'
})
export class Web3Service {

    readyPromise;
	watchedAccount: string;
    networkId: number;
    now: null;

	constructor() {
        this.readyPromise = new Promise((resolve, reject) => {
            if (window.ethereum) { // Modern dapp browsers...
                window.web3 = new Web3(window.ethereum);
                this.customizeWeb3();
                this.watchForAccountChanges();
                this.watchForNewBlocks();

                Promise.all([
                    this.getNetworkId(),
                    this.getBlockAtNow(),
                ])
                .then(resolve)
                .catch(reject)
            }
            else if (window.web3) { // Legacy dapp browsers...
                console.warn("Your financial privacy is at risk! Disable automatic account exposure with whatever ethereum wallet provider you use")
                window.web3 = new Web3(window.web3.currentProvider);
                this.customizeWeb3();
                this.watchForAccountChanges();
                this.watchForNewBlocks();

                Promise.all([
                    this.getNetworkId(),
                    this.getBlockAtNow(),
                ])
                .then(resolve)
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
            return this.watchForAccountChanges();
        } catch (error) {
            return Promise.reject(new Error("User denied account access..."));
        }
    }

	getCurrentAccount(){
		return window.web3.eth.getAccounts()
        .then(accounts => {
            if(accounts)
                return accounts[0];
            
            return null;
        })
	}

	getBalance(account){
		return window.web3.eth.getBalance(account)
        .then(weiBalance => {
            var etherBalance = window.web3.utils.fromWei(weiBalance, 'ether');
            return {
                wei: weiBalance,
                ether: etherBalance
            };
        })
	}

    getNetworkId(){
        return window.web3.eth.net.getId()
        .then(networkId => {
            this.networkId = networkId;
            return this.networkId;
        })
    }

    private watchForAccountChanges(){
        return this.getCurrentAccount()
        .then(currentAccount => {
            //console.log("setting watched account to ", currentAccount);
            this.watchedAccount = currentAccount;
            setInterval(() => {
                this.getCurrentAccount()
                .then(currentAccount => {
                    //console.log(currentAccount, this.watchedAccount)
                    if(this.watchedAccount && this.watchedAccount != currentAccount)
                        location.reload();
                })
            }, 250);
            return currentAccount;
        })
        .catch(console.error)
    }

    getBlockAtNow(){
        return window.web3.eth.getBlock("latest")
        .then(blockData => {
            this.now = blockData;
            return this.now;
        })
    }

    private watchForNewBlocks(){
        window.web3.eth.subscribe('newBlockHeaders', (error, blockData) => {
            if (!error){
                this.now = blockData;
            }
        });
    }

	private customizeWeb3(){
        window.web3.utils['nullAddress'] = '0x0000000000000000000000000000000000000000';
		window.web3.eth['priceInUSD'] = 100;
	}
}
