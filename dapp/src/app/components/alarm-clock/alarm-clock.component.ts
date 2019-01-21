import { Component, OnInit, Input } from '@angular/core';
import { MatDialog, MatSnackBar } from '@angular/material';

import { Web3Service } from '../../services/web3/web3.service';
import { AlarmClockService } from '../../services/alarm-clock/alarm-clock.service';
import { WalletManagerService } from '../../services/wallet-manager/wallet-manager.service';
import { CreateAlarmClockComponent } from '../../components/create-alarm-clock/create-alarm-clock.component';
import { PaymentDelegateService } from '../../services/payment-delegate/payment-delegate.service';

@Component({
  selector: 'app-alarm-clock',
  templateUrl: './alarm-clock.component.html',
  styleUrls: ['./alarm-clock.component.css']
})
export class AlarmClockComponent implements OnInit {

    @Input() alarmClock: any;

    currentAccount;
    newLabel;
    showDetails: boolean = false;
    showAdvancedOptions: boolean = false;

	constructor(
        private dialog: MatDialog,
        private snackbar: MatSnackBar,
		private Web3: Web3Service,
        private AlarmClock: AlarmClockService,
        private WalletService: WalletManagerService,
        private PaymentDelegate: PaymentDelegateService,
    ){}

	ngOnInit() {
        this.newLabel = this.alarmClock.label;

        this.Web3.getCurrentAccount()
        .then(currentAccount => {
            this.currentAccount = currentAccount;
        })
	}

    changeLabel(address, newLabel){
        localStorage.setItem(address + ".label", newLabel)
        this.alarmClock.label = newLabel;
    }

    execute(){
        this.alarmClock.alarm.instance.methods.execute()
        .send({
            from: this.currentAccount
        })
        .on('transactionHash', txHash => {
            console.log(txHash)
        })
        .on('confirmation', (confirmations, tx) => {
            if(confirmations == 0)
                console.log(tx)
        })
    }

    cancel(){
        //console.log(this.alarmClock.instance.methods)
        this.alarmClock.instance.methods.wallet().call()
        .then(walletAddress => {
            return this.WalletService.wallets[walletAddress].methods.call(
                this.alarmClock.alarm.instance._address,
                0,
                '0xea8a1af0' // hex id for cancel() function
            )
            .send({
                from: this.currentAccount
            })
            .on('transactionHash', txHash => {
                console.log(txHash)
            })
            .on('confirmation', (confirmations, txReceipt) => {
                if(confirmations == 0){
                    console.log(txReceipt)
                }
            })
            .catch(err => {
                console.error(err);
            })
        })
    }

    destroy(){
        this.alarmClock.instance.methods.destroy()
        .send({
            from: this.currentAccount
        })
        .on('transactionHash', txHash => {
            console.log(txHash)
        })
        .on('confirmation', (confirmations, txReceipt) => {
            if(confirmations == 0){
                console.log(txReceipt)
            }
        })
        .catch(err => {
            console.error(err);
        })
    }

    setAlarmClock(){
        const dialogRef = this.dialog.open(CreateAlarmClockComponent, {
            width: '90vw',
            height: '90vh',
            data: {
                title: "Set This Alarm",
                alarmType: 'set',
                alarmClock: this.alarmClock.instance,
            }
        });
    
        dialogRef.afterClosed().subscribe(newAlarmClock => {
            if(newAlarmClock && newAlarmClock.tx){
                
            } else {
                
            }
        });
    }
    
}
