import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { NameService } from 'src/app/services/name/name.service';
import { Web3Service } from 'src/app/services/web3/web3.service';
import { SchedulerService } from 'src/app/services/scheduler/scheduler.service';

export interface DialogData {
    payment: any;
}

@Component({
  selector: 'app-view-payment',
  templateUrl: './view-payment.component.html',
  styleUrls: ['./view-payment.component.css']
})
export class ViewPaymentComponent implements OnInit {

    private payment;
    private web3;
    private estimatedGasCost;
    private executable;
    private interval;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        public dialogRef: MatDialogRef<ViewPaymentComponent>,
        private NameService: NameService,
        private Web3Service: Web3Service,
        private PaymentScheduler: SchedulerService
    ) {
        this.payment = data.payment;
        this.web3 = Web3Service.ready();
    }

    ngOnInit() {
        this.interval = setInterval(() => {
            this.executable = Number(this.payment.alarmClock.startTimestamp) < new Date().getTime()/1000;
        }, 1000)
    }

    ngOnDestroy() {
        clearInterval(this.interval)
    }

    execute() {
        this.Web3Service.getCurrentAccount()
        .then(currentAccount => {
            return this.payment.execute().send({
                from: currentAccount,
                gas: 1000000
            })
            .on('transactionHash', txHash => {
                console.log(txHash);
                return this.web3.eth.getTransactionReceipt(txHash)
            })
            .then(txReceipt => {
                console.log(txReceipt)
                this.closeDialog();
            })
        })
    }

    cancel(){
        this.Web3Service.getCurrentAccount()
        .then(currentAccount => {
            return this.payment.cancel()
            .send({
                from: currentAccount,
                gas: 200000, // Auto calculation for this function is failing to provide enough gas for some unknown reason
            })
        })
        .then(txReceipt => {
            console.log(txReceipt)
            this.closeDialog();
        })   
    }

    closeDialog(): void {
        this.dialogRef.close();
    }
}
