import { Component, OnInit, Inject } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, MAT_SNACK_BAR_DATA } from '@angular/material';
import { ngCopy } from 'angular-6-clipboard';
import { Web3Service } from '../web3/web3.service';
import * as TruffleContract from 'truffle-contract';

declare let require: any;
declare let window: any;

let AddressListArtifact = require('../../../build/contracts/AddressList.json');
let WalletManagerArtifact = require('../../../build/contracts/EverchainWalletManager.json');
const AddressListContract = TruffleContract(AddressListArtifact);
const WalletManagerContract = TruffleContract(WalletManagerArtifact);

export interface DialogData {
    walletAddress: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

    private initialized;
    private WalletManager;
    private web3;

    private account = {
        loggedIn: false,
        address: null,
        addressPrefix: '',
        addressSuffix: '',
        wallets: [],
    }

    constructor(
        private Web3: Web3Service,
        public snackBar: MatSnackBar,
    ) { 
        this.web3 = Web3.instance();
        WalletManagerContract.setProvider(this.web3.currentProvider);
    }

    ngOnInit(){

        Promise.all([
            WalletManagerContract.deployed(),
            this.web3.eth.getAccounts(),
        ])
        .then(promises => {
            this.WalletManager = promises[0];
            var accounts = promises[1];
            var currentAccount = accounts[0];
            this.account.address = currentAccount;
            if(!currentAccount){
                this.initialized = true;
            } else {
                this.account.loggedIn = true;
                var length = currentAccount.length;
                this.account.addressPrefix = currentAccount.slice(0,5);
                this.account.addressSuffix = currentAccount.slice(length-3,length);
                
                this.WalletManager.wallets(this.account.address)
                .then(walletListAddress => {
                    if(walletListAddress == '0x0000000000000000000000000000000000000000'){
                        this.initialized = true;
                    } else {
                        AddressListContract.setProvider(this.web3.currentProvider);
                        AddressListContract.at(walletListAddress)
                        .then(instance => {
                            return instance.get();
                        })
                        .then(wallets => {
                            //console.log(wallets);
                            this.account.wallets = wallets;
                            this.initialized = true;
                        })
                    }
                })
            }
        })
    }

    createWallet(){
        console.log(this.WalletManager);
        
        /*
        this.WalletManager.createWallet.sendTransaction({from: this.account.address})
        .then(txHash => {
            console.log(txHash);
            
        })
        .then(txReceipt => {
            console.log(txReceipt);
        })
        */

        var manager = new this.web3.eth.Contract(WalletManagerArtifact.abi, this.WalletManager.address);
        manager.methods.createWallet().send({from: this.account.address})
        .on('transactionHash', txHash => {
            console.log(txHash);
            this.showWalletTransactionSnackBar(txHash)
            return this.web3.eth.getTransactionReceipt(txHash);
        })
        .then(txReceipt => {
            console.log(txReceipt);
            var walletAddress = txReceipt.events.AddWallet_event.returnValues.walletAddress;
            this.account.wallets.push(walletAddress);
            this.showWalletDeployedSnackBar(walletAddress);
        })
    }

    getWalletName(address){
        var length = address.length;
        var addressPrefix = address.slice(0,5);
        var addressSuffix = address.slice(length-3,length);

        var name = localStorage.getItem(address+'.name');
        if(!name)
            return "Unnamed Wallet " + addressPrefix + '...' + addressSuffix;
        return name;
    }

    showWalletTransactionSnackBar(txHash){
        let snackBarRef = this.snackBar.openFromComponent(WalletDeployedComponent, {
            duration: 10000,
            data: {
                title: 'Waiting for Wallet Deployment',
                btn1Text: 'view transaction on etherscan',
                btn2Text: 'dismiss'
            }
        });

        snackBarRef.afterDismissed().subscribe(() => {
            console.log('The snack-bar was dismissed');
        });
          
        snackBarRef.onAction().subscribe(() => {
            console.log('The snack-bar action was triggered!');
        });
    }

    showWalletDeployedSnackBar(walletAddress): void {
        let snackBarRef = this.snackBar.openFromComponent(WalletDeployedComponent, {
            duration: 10000,
            data: {
                title: 'Wallet Successfully Deployed',
                btn1Text: 'view',
                btn2Text: 'dismiss'
            }
        });

        snackBarRef.afterDismissed().subscribe(() => {
            console.log('The snack-bar was dismissed');
        });
          
        snackBarRef.onAction().subscribe(() => {
            console.log('The snack-bar action was triggered!');
        });
    }

    copyToClipboard(text){
        ngCopy(text);

        let snackBarRef = this.snackBar.openFromComponent(SnackBarPopupComponent, {
            duration: 5000,
            data: {
                title: "Copied to Clipboard",
                msg: text
            }
        });
        
        snackBarRef.afterDismissed().subscribe(() => {
            console.log('The snack-bar was dismissed');
        });
          
        snackBarRef.onAction().subscribe(() => {
            console.log('The snack-bar action was triggered!');
        });
    }

}

@Component({
    selector: 'wallet-deployed-popup',
    template: '<h4>{{data.title}}</h4>'
            + '<div class="padding" fxLayout="row" fxLayoutAlign="start center">'
            +   '<small>{{data.msg}}</small> &nbsp;' 
            +   '<button mat-button (click)="onAction()">btn1Text</button> &nbsp;'
            +   '<button mat-button (click)="onDismiss()">btn2Text</button>'
            + '</div>',
})
export class WalletDeployedComponent {
    constructor(
        @Inject(MAT_SNACK_BAR_DATA) public data: any,
        private snackBarRef: MatSnackBarRef<WalletDeployedComponent>
    ){

    }

    onAction(){
        this.snackBarRef.closeWithAction();
    }

    onDismiss(){
        this.snackBarRef.dismiss();
    }
}

@Component({
    selector: 'copied-to-clipboard-popup',
    template: '<h4 style="margin: 4px 0px;">{{ data.title }}</h4>'
            + '<small>{{ data.msg }}</small>',
})
export class SnackBarPopupComponent {
    constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any) { }
}