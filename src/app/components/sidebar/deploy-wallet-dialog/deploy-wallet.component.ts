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
  
    private web3;

    private showAdvancedOptions: boolean;
    private waitingForTxSignature: boolean;
    private interval = 0;
    private timer;

    private wallet = {
        address: null,
        name: null,
        forward: null,
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
        private Web3Service: Web3Service,
        private WalletService: WalletService,
        private SchedulerService: SchedulerService,
    ){
        Promise.all([
            Web3Service.getWeb3Instance(),
            SchedulerService.ready(),
            WalletService.ready(),
        ])
        .then(promises => {
            this.web3 = promises[0];
            
            this.web3.eth.getGasPrice()
            .then(currentNetworkGasPrice => {
                var currentGasPriceInGwei = this.web3.utils.fromWei(currentNetworkGasPrice, "gwei");
                this.tx.gasPrice = Number(currentGasPriceInGwei);
                console.log([
                    this.web3.currentAccount, 
                    this.SchedulerService.PaymentDelegate.address,
                ])
                this.WalletService.estimateGas(
                    this.web3.emptyAddress, 
                    [
                        this.web3.currentAccount, 
                        this.SchedulerService.PaymentDelegate.address,
                    ]
                )
                .then(estimatedCallGas => {
                    this.tx.callGas = estimatedCallGas;
                    this.tx.estimatedCost = this.calculateTxCost(this.tx.callGas, this.tx.gasPrice);
                })
                .catch(err => {
                    console.error(err)
                })
            })
        })
    }

    ngOnInit(){

    }

    createWallet(){
        this.waitingForTxSignature = true;

        return this.WalletService.addWallet(
            this.web3.emptyAddress, // default to provided wallet factory
            [
                this.web3.currentAccount, 
                this.SchedulerService.PaymentDelegate.address
            ],
        )
        .send({
            from: this.web3.currentAccount,
            gasPrice: this.web3.utils.toWei(this.tx.gasPrice.toString(), "gwei"),
            gas: this.tx.callGas
        })
        .on('transactionHash', txHash => {
            console.log(txHash);
            this.tx.hash = txHash;
            return this.web3.eth.getTransactionReceipt(txHash);
        })
        .then(txReceipt => {
            console.log(txReceipt);
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
        console.log(callGas, gasPriceInGwei)
        var total = callGas * gasPriceInGwei;
        console.log(total);
        var wei = this.web3.utils.toWei(total.toFixed(8).toString(), 'gwei')
        var cost = this.web3.utils.fromWei(wei, 'ether');
        console.log(wei)
        console.log(cost)
        return cost;
    }
  
    closeDialog(autoForward): void {
        this.wallet.forward = autoForward;
        this.dialogRef.close(this.wallet);
    }
  
}