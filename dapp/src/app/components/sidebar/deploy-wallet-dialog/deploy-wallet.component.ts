import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Web3Service } from 'src/app/services/web3/web3.service';
import { WalletService } from 'src/app/services/wallet/wallet.service';
import { SchedulerService } from 'src/app/services/scheduler/scheduler.service';

export interface DialogData {
    // no data needed currently
}

@Component({
  selector: 'app-deploy-wallet',
  templateUrl: './deploy-wallet.component.html',
  styleUrls: ['./deploy-wallet.component.css']
})
export class DeployWalletComponent implements OnInit {
  
    private initialized;

    private web3;
    private currentAccount;

    private showAdvancedOptions: boolean;
    private waitingForTxSignature: boolean;
    private interval = 0;
    private timer;

    private wallet = {
        address: null,
        name: null,
        forward: null,
        txHash: null,
    }

    private tx = {
        callGas: null,
        gasPrice: 10,
        receipt: null,
        hash: null,
        estimatedCost: null,
        actualCost: null
    }

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        public dialogRef: MatDialogRef<DeployWalletComponent>,
        private Web3: Web3Service,
        private WalletService: WalletService,
        private PaymentScheduler: SchedulerService,
    ){ }

    ngOnInit(){
        Promise.all([
            this.Web3.ready(),
            this.PaymentScheduler.ready(),
        ])
        .then(promises => {
            this.web3 = promises[0];
            this.currentAccount = this.web3.currentAccount;
            
            this.web3.eth.getGasPrice()
            .then(currentNetworkGasPrice => {
                var currentGasPriceInGwei = this.web3.utils.fromWei(currentNetworkGasPrice, "gwei");
                this.tx.gasPrice = Number(currentGasPriceInGwei);
                console.log(this.PaymentScheduler.DelegatedWalletFactory)
                var factory = this.PaymentScheduler.DelegatedWalletFactory.address;
                //var delegates = [this.PaymentScheduler.PaymentDelegate, this.currentAccount];
                var delegates = [this.currentAccount];
                var options = {
                    from: this.currentAccount
                };

                return this.WalletService.estimateGas(factory, delegates, options);
            })
            .then(estimatedCallGas => {
                this.tx.callGas = estimatedCallGas;
                this.tx.estimatedCost = this.calculateTxCost(this.tx.callGas, this.tx.gasPrice);
                this.initialized = true;
            })
            .catch(err => {
                this.initialized = true;
                console.error(err)
            })
        })
    }

    createWallet(){
        this.waitingForTxSignature = true;

        return this.WalletService.createWallet(
            this.web3.utils.emptyAddress, // default to provided wallet factory
            [
                this.currentAccount, 
                //this.PaymentScheduler.PaymentDelegate.address
            ],
            {
                from: this.currentAccount,
                gasPrice: this.web3.utils.toWei(this.tx.gasPrice.toString(), "gwei"),
                gas: this.tx.callGas
            }
        )
        .on('transactionHash', txHash => {
            this.tx.hash = txHash;
            this.wallet.txHash = txHash;
            return this.web3.eth.getTransactionReceipt(txHash);
        })
        .then(txReceipt => {
            this.tx.receipt = txReceipt;
            this.tx.actualCost = this.calculateTxCost(this.tx.receipt.gasUsed, this.tx.gasPrice);
            this.wallet.address = this.tx.receipt.events.AddWallet_event.returnValues.wallet;
        })
        .catch(err => {
            console.error(err)
            this.waitingForTxSignature = false;
        })
    }

    openInEtherScan(txHash){
        console.log('open in etherscan');
        window.open('https://kovan.etherscan.io/tx/' + txHash);
    }

    calculateTxCost(callGas, gasPriceInGwei){
        var total = callGas * gasPriceInGwei;
        var wei = this.web3.utils.toWei(total.toFixed(8).toString(), 'gwei')
        var cost = this.web3.utils.fromWei(wei, 'ether');
        return cost;
    }
  
    closeDialog(autoForward): void {
        this.wallet.forward = autoForward;
        this.dialogRef.close(this.wallet);
    }
  
}