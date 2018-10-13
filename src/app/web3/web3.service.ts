import { Injectable } from '@angular/core';
import { default as Web3 } from 'web3';

declare let window: any;

@Injectable({
  providedIn: 'root'
})
export class Web3Service {

    private web3;
    private currentAccount;

    constructor () {
        // Checking if Web3 has been injected by the browser (Mist/MetaMask)
        if (typeof window.web3 !== 'undefined') {
            console.warn('Using web3 detected from external source.')
            // Use Mist/MetaMask's provider
            this.web3 = new Web3(window.web3.currentProvider)
        } else {
            console.warn('No web3 detected. Falling back to http://127.0.0.1:8545.')
            // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
            this.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'))
        }
        
        this.web3['emptyAddress'] = '0x0000000000000000000000000000000000000000';

        this.currentAccount = new Promise((resolve, reject) => {
            this.web3.eth.getAccounts().then(accounts => {
                if(accounts.length > 0)
                    resolve(accounts[0]);
                else
                    resolve(this.web3.emptyAddress);
            }).catch(reject)
        });

        this.web3['getCurrentAccount'] = {};
        this.web3.getCurrentAccount = this.currentAccount;
        this.web3.getCurrentAccount
        .then(account => {
            console.log(account);
        })
        
        console.log(this.web3);
        
        this.watchForAccountChanges();
    }
    
    instance(){
        return this.web3;
    }

    private watchForAccountChanges(){
        this.web3.eth.getAccounts()
        .then(accounts => {
            if(accounts.length > 0)
                this.currentAccount = accounts[0];
            
            setInterval(() => {
                this.web3.eth.getAccounts()
                .then(accounts => {
                    if(accounts.length == 0 && this.currentAccount)
                        location.reload();
                    else if(accounts[0] != this.currentAccount)
                        location.reload();
                })
            }, 250)
        })
        .catch(console.error)
    }

}