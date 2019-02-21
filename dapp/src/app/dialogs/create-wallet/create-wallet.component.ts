import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

declare let web3: any;

import { Web3Service } from '../../services/web3/web3.service';
import { RtxService } from '../../services/rtx/rtx.service';
import { PaymentService } from '../../services/payment/payment.service';

@Component({
  selector: 'app-create-wallet',
  templateUrl: './create-wallet.component.html',
  styleUrls: ['./create-wallet.component.css']
})
export class CreateWalletDialog implements OnInit {

	Wallets;

	newWallet = {
    	name: null,
    	preloadEther: null,
    	callGas: null,
    	gasPrice: null,
    	cost: null,
    	tx: null,
        txHash: null,
    }

	constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<CreateWalletDialog>,
        private Web3: Web3Service,
        private RTx: RtxService,
        private Payments: PaymentService,
    ){}

	ngOnInit() {
		this.Wallets = this.data.Wallets;

		this.Web3.ready()
		.then(() => {
			return web3.eth.getGasPrice()
		})
		.then(gasPrice => {
			this.newWallet.gasPrice = Math.round(Number(gasPrice)*1.25);

            var delegates = [this.Web3.account.address, this.Payments.instance._address, this.RTx.factory._address, this.RTx.deployer._address];
            var options = {
                from: this.Web3.account.address,
                value: 1,
            };

            this.Wallets.estimateGas(delegates, options)
            .then(estimatedCallGas => {
                this.newWallet.callGas = Math.round(estimatedCallGas*1.25);
                this.newWallet.cost = (this.newWallet.callGas * this.newWallet.gasPrice).toString();
            })
            .catch(err => {
                console.error(err)
            })
        })
	}

    validWallet(){
        if(!this.newWallet.name) return false;

        return true;
    }

    createWallet(){
        if(!this.newWallet.preloadEther)
            this.newWallet.preloadEther = 0;
        
        var delegates = [this.Web3.account.address, this.Payments.instance._address, this.RTx.factory._address, this.RTx.deployer._address];
        
        var options = {
            from: this.Web3.account.address,
            gasPrice: this.newWallet.gasPrice.toString(),
            gas: this.newWallet.callGas,
            value: web3.utils.toWei(this.newWallet.preloadEther.toString(), 'ether')
        };

        this.newWallet.tx = this.Wallets.createWallet(delegates, options)
        this.newWallet.tx.on("transactionHash", txHash => {
            this.newWallet.txHash = txHash;
            this.dialogRef.close(this.newWallet);
        })
    }

    openInEtherScan(txHash){
        window.open('https://kovan.etherscan.io/tx/' + txHash);
    }

    updateCost(){
        this.newWallet.cost = (this.newWallet.callGas * this.newWallet.gasPrice).toString();
    }

}
