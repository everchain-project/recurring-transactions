import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

declare let web3: any;
import { Web3Service } from 'src/app/services/web3/web3.service';
import { DelegatedWalletService } from 'src/app/services/delegated-wallet/delegated-wallet.service';
import { AlarmClockService } from 'src/app/services/alarm-clock/alarm-clock.service';
import { PaymentDelegateService } from 'src/app/services/payment-delegate/payment-delegate.service';

export interface DialogData {
    // no data needed currently
}

@Component({
  selector: 'app-create-wallet',
  templateUrl: './create-wallet.component.html',
  styleUrls: ['./create-wallet.component.css']
})
export class CreateWalletComponent implements OnInit {
  	
    currentAccount: string;
    
  	newWallet = {
    	name: null,
    	preloadEther: null,
    	callGas: null,
    	gasPrice: null,
    	cost: {
    		ether: null,
    		usd: null,
    	},
    	tx: null,
        txHash: null,
    }

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private dialogRef: MatDialogRef<CreateWalletComponent>,
        private Web3: Web3Service,
        private WalletManager: DelegatedWalletService,
        private AlarmClock: AlarmClockService,
        private PaymentDelegate: PaymentDelegateService,
    ){}
    
    ngOnInit(){
        Promise.all([
            this.Web3.getCurrentAccount(),
            web3.eth.getGasPrice(),
        ])
        .then(promises => {
            this.currentAccount = promises[0];
            var currentGasPriceInGwei = promises[1];
            this.newWallet.gasPrice = Math.round(Number(currentGasPriceInGwei)*1.25);
            return this.PaymentDelegate.getInstance()
        })
        .then(instance => {
            var delegates = [this.currentAccount, instance._address, instance._address];
            var options = {
                from: this.currentAccount,
                value: 1,
            };

            this.WalletManager.estimateGas(delegates, options)
            .then(estimatedCallGas => {
                this.newWallet.callGas = Math.round(estimatedCallGas*1.25);
                this.newWallet.cost.ether = this.calculateTxCost(this.newWallet.callGas, this.newWallet.gasPrice);
                this.newWallet.cost.usd = Number(this.newWallet.cost.ether) * web3.eth.priceInUSD;
            })
            .catch(err => {
                console.error(err)
            })
        })
    }

    createWallet(){
        if(!this.newWallet.preloadEther)
            this.newWallet.preloadEther = 0;
        
        this.PaymentDelegate.getInstance()
        .then(instance => {
            var delegates = [this.currentAccount, instance._address, this.AlarmClock.wizard._address];
            console.log(delegates);
            var options = {
                from: this.currentAccount,
                gasPrice: this.newWallet.gasPrice.toString(),
                gas: this.newWallet.callGas,
                value: web3.utils.toWei(this.newWallet.preloadEther.toString(), 'ether')
            };

            this.newWallet.tx = this.WalletManager.createWallet(delegates, options)
            this.newWallet.tx.on("transactionHash", txHash => {
                this.newWallet.txHash = txHash;
                this.dialogRef.close(this.newWallet);
            })
        })
        .catch(err => {
            console.error(err)
        })
    }

    validWallet(){
    	if(!this.newWallet.name) return false;

    	return true;
    }

    openInEtherScan(txHash){
        window.open('https://kovan.etherscan.io/tx/' + txHash);
    }

    updateCost(){
        this.newWallet.cost.ether = this.calculateTxCost(this.newWallet.callGas, this.newWallet.gasPrice);
        this.newWallet.cost.usd = Number(this.newWallet.cost.ether) * web3.eth.ethPriceInUSD;
    }

    calculateTxCost(callGas, gasPriceInWei){
        var gasPriceInGwei = Number(web3.utils.fromWei(gasPriceInWei.toString(), 'gwei'));
        var total = callGas * gasPriceInGwei;
        var wei = web3.utils.toWei(total.toFixed(8).toString(), 'gwei')
        var cost = web3.utils.fromWei(wei, 'ether');
        
        return cost;
    }

    closeDialog(){
    	this.dialogRef.close();
    }
}