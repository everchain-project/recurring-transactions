import { Injectable } from '@angular/core';
import { default as Web3 } from 'web3';

declare let window: any;

@Injectable({
  providedIn: 'root'
})
export class Web3Service {

    private web3;
    private instance;
    private watchedAccount;
    
    constructor () {
        this.web3 = new Promise((resolve, reject) => {
            // Checking if Web3 has been injected by the browser (Mist/MetaMask)
            if (typeof window.web3 !== 'undefined') {
                console.warn('Using web3 detected from external source.')
                // Use Mist/MetaMask's provider
                this.instance = new Web3(window.web3.currentProvider)
            } else {
                console.warn('No web3 detected. Falling back to http://127.0.0.1:8545.')
                // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
                this.instance = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'))
            }

            this.instance.utils['nullAddress'] = '0x0000000000000000000000000000000000000000';

            this.instance.eth.getAccounts()
            .then(accounts => {
                this.instance.eth['isLoggedIn'] = accounts.length > 0;
                if(this.instance.eth.isLoggedIn)
                    this.instance.eth['currentAccount'] = this.instance.utils.toChecksumAddress(accounts[0]);
                else 
                    this.instance.eth['currentAccount'] = null;
                
                this.watchedAccount = this.instance.eth['currentAccount'];
                this.watchForAccountChanges();

                resolve(this.instance);
            })
            .catch(reject)
        });        
    }

    ready(){
        return this.web3;
    }

    getCurrentAccount(){
        return this.web3
        .then(web3 => {
            return web3.eth.getAccounts()
            .then(accounts => {
                if(accounts.length > 0){
                    var currentAccount = web3.utils.toChecksumAddress(accounts[0]);
                    return Promise.resolve(currentAccount);
                } 
                else {
                    return Promise.resolve(null);
                }
            })
        })
        .catch(Promise.reject);
    }

    private watchForAccountChanges(){
        setInterval(() => {
            this.getCurrentAccount()
            .then(currentAccount => {
                // console.log(currentAccount, this.watchedAccount);
                if(currentAccount != this.watchedAccount)
                    location.reload();
            })
            .catch(console.error)
        }, 250);
    }
}