import { Injectable } from '@angular/core';
import { Router } from "@angular/router";
import { MatDialog, MatSnackBar } from '@angular/material';

declare let web3: any;
declare let require: any;

import { Web3Service } from '../../services/web3/web3.service';

import { CreateWalletDialog } from '../../dialogs/create-wallet/create-wallet.component';

let DelegatedWalletArtifact = require('../../../../../build/contracts/DelegatedWallet.json');
let DelegatedWalletFactoryArtifact = require('../../../../../build/contracts/DelegatedWalletFactory.json');
let DelegatedWalletManagerArtifact = require('../../../../../build/contracts/DelegatedWalletManager.json');

@Injectable({
  providedIn: 'root'
})
export class WalletService {

    private readyPromise: Promise<any>;
    private factory: any;
    private manager: any;

    public current: string = null;

    public list = [];
    public wallets = {};
    public vettedDelegates = [];

    constructor(
        private router: Router,
        private dialog: MatDialog,
        private snackbar: MatSnackBar,
        private Web3: Web3Service,
    ) {
        this.readyPromise = this.Web3.ready()
        .then(() => {
            this.setFactory();
            this.setManager();
        })
        .catch(err => {
            // console.error(err);
        })
    }

    ready () {
        return this.readyPromise;
    }

    create(){
        return new Promise((resolve, reject) => {
            const dialogRef = this.dialog.open(CreateWalletDialog, {
                // width: '90vw',
                // height: '90vh',
                data: {
                    Wallets: this
                }
            });
        
            dialogRef.afterClosed().subscribe(newWallet => {
                console.log(newWallet);
                if(!newWallet){
                    resolve()
                }
                else if(newWallet && newWallet.tx){
                    var title = 'Waiting for ' + newWallet.name + ' to be deployed. Be patient!';
                    var buttonText = 'view on etherscan';
                    let snackBarRef = this.snackbar.open(title, buttonText);

                    snackBarRef.onAction().subscribe(() => {
                        window.open('https://kovan.etherscan.io/tx/' + newWallet.txHash);
                        snackBarRef.dismiss()
                    });
                    
                    newWallet.tx.on("confirmation", (confirmations, txReceipt)  => {
                        if(confirmations == 0){
                            console.log("Transaction successfully buried '0' confirmations deep. This should be a custom setting eventually");                        
                            var walletAddress = txReceipt.events.AddWallet_event.returnValues.wallet;
                            localStorage.setItem(walletAddress + '.name', newWallet.name);
                            this.list.push(walletAddress);
                            this.update(walletAddress);
                            
                            var title = newWallet.name + ' Deployed';
                            var buttonText = 'view wallet';
                            let snackBarRef = this.snackbar.open(
                                title, 
                                buttonText,
                                {
                                    duration: 15000
                                }
                            );

                            snackBarRef.onAction().subscribe(() => {
                                this.router.navigate(['/wallet/' + walletAddress]);
                                snackBarRef.dismiss()
                            });
                        }
                    })
                    .catch(err => {
                        console.error(err);
                    })

                    resolve()
                }
            });
        })
    }

    createWallet(delegates, options){
        return this.manager.methods.createWallet(this.factory._address, delegates).send(options)
    }

    getWallets(account){
        return this.manager.methods.getWallets(account).call()          
    }

    watch(account){
        console.log('watching wallet ' + account);
        this.manager.events.AddWallet_event({topics:{owner: this.Web3.account.address}}, (err, event) => {
            console.log(err, event)
            if(!err){
                // this.list.push(todo)
            }
        })

        return this.manager.methods.getWallets(account).call()
        .then(walletAddresses => {
            this.list = walletAddresses;

            var updatePromises = [];
            for (var i = walletAddresses.length - 1; i >= 0; i--) {
                updatePromises.push(this.update(walletAddresses[i]));
            }

            return Promise.all(updatePromises);
        })
    }

    update(address){
        if(!this.wallets[address]){
            this.wallets[address] = {
                address: address,
                instance: new web3.eth.Contract(DelegatedWalletArtifact.abi, address),
            };
        }

        var name = localStorage.getItem(address + '.name');
        if(!name) name = "Unnamed Wallet";
        this.wallets[address]['name'] = name;
        
        this.wallets[address]['subscription'] = this.wallets[address].instance.events.allEvents(null, (err, event) => {
            //console.log(err, event);
            this.updateWalletBalance(address)
        });

        return this.wallets[address]['ready'] = Promise.all([
            this.Web3.getBalance(address),
            this.wallets[address].instance.methods.getDelegates().call(),
        ])
        .then(promises => {
            this.wallets[address]['balance'] = promises[0];
            this.wallets[address]['delegates'] = promises[1];
            return this.wallets[address];
        })
    }

    updateWalletBalance(walletAddress){
        web3.eth.getBalance(walletAddress)
        .then(weiBalance => {
            this.wallets[walletAddress].balance = weiBalance;
        })
        .catch(err => {
            console.error(err)
        })
    }

    estimateGas(delegates, options){
        return this.ready()
        .then(() => {
            return this.manager.methods.createWallet(this.factory._address, delegates).estimateGas(options)
        })
    }

    addVettedDelegate (address) {
        if(!this.vettedDelegates.includes(address))
            this.vettedDelegates.push(address);
    }

    private setFactory () {
        var address = DelegatedWalletFactoryArtifact.networks[this.Web3.netId].address;
        this.factory = new web3.eth.Contract(DelegatedWalletFactoryArtifact.abi, address);
    }

    private setManager () {
        var address = DelegatedWalletManagerArtifact.networks[this.Web3.netId].address;
        this.manager = new web3.eth.Contract(DelegatedWalletManagerArtifact.abi, address);
    }

}
