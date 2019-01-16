import { Component, OnInit, Input } from '@angular/core';
import { MatDialog, MatSnackBar } from '@angular/material';

import { Web3Service } from '../../services/web3/web3.service';
import { AlarmClockService } from '../../services/alarm-clock/alarm-clock.service';
import { DelegatedWalletService } from '../../services/delegated-wallet/delegated-wallet.service';
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
		private Web3: Web3Service,
        private dialog: MatDialog,
        private snackbar: MatSnackBar,
        private AlarmClock: AlarmClockService,
        private Wallet: DelegatedWalletService,
        private PaymentDelegate: PaymentDelegateService,
    ) { }

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

    cancel(){
        //console.log(this.alarmClock.instance.methods)
        this.alarmClock.instance.methods.wallet().call()
        .then(walletAddress => {
            return this.Wallet.at(walletAddress)
        })
        .then(instance => {
            console.log(this.alarmClock.alarm.instance.methods)
            return instance.methods.call(
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
            .on('confirmation', confirmations => {
                if(confirmations == 0){
                    console.log('confirmed!')
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
        .on('confirmation', confirmations => {
            if(confirmations == 0){
                console.log('confirmed!')
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
            console.log(newAlarmClock)
            if(newAlarmClock && newAlarmClock.tx){
                
            } else {
                
            }
        });
    }
    
}
