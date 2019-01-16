import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Router } from "@angular/router";

declare let web3: any;
import { Web3Service } from '../../services/web3/web3.service';
import { AlarmClockService } from '../../services/alarm-clock/alarm-clock.service';
import { PaymentDelegateService } from '../../services/payment-delegate/payment-delegate.service';

@Component({
  selector: 'app-create-alarm-clock',
  templateUrl: './create-alarm-clock.component.html',
  styleUrls: ['./create-alarm-clock.component.css']
})
export class CreateAlarmClockComponent implements OnInit {

    title;
    currentAccount;
    currentGasPrice;
    
    updateCost(){
        // todo
    }

	public settings = {
        bigBanner: true,
        timePicker: true,
        format: 'MMM dd, yyyy @ hh:mm a',
        defaultOpen: false
    }

    public newAlarm = {
        label: null,
        startDate: new Date(new Date().getTime() + 24*60*60*1000), // set 24 hours ahead
        call: {
            address: null,
            value: 0,
            gas: null,
            data: "0x",
        },
        interval: {
            value: 1,
            unit: 4,
            type: 'forever',
            max: 0,
        },
        tx: {
            gasPrice: 1000000000,
            callGas: null,
        }
    }

	constructor(
        public dialogRef: MatDialogRef<CreateAlarmClockComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private router: Router,
        private Web3: Web3Service,
		private AlarmClock: AlarmClockService,
        private PaymentDelegate: PaymentDelegateService,
	) { }

	ngOnInit() {
        this.title = this.data.title;

        Promise.all([
            this.Web3.getCurrentAccount(),
            web3.eth.getGasPrice(),
        ])
        .then(promises => {
            this.currentAccount = promises[0];
            this.currentGasPrice = promises[1];
        })
        .catch(err => {
            console.error(err)
        })
	}

    valid(){
        return true;
    }

    calculateWindowSize(){
        var windowSize = 300;

        return windowSize;
    }

    createAndStartAlarmClock(){
        this.PaymentDelegate.getInstance()
        .then(instance => {
            var callValue = this.newAlarm.call.value;
            var callGas = this.newAlarm.call.gas;
            var startTimestamp = Math.floor(this.newAlarm.startDate.getTime()/1000);
            var windowSize = this.calculateWindowSize();
            var intervalValue  = this.newAlarm.interval.value;
            var intervalUnit = this.newAlarm.interval.unit;
            var maxIntervals = this.newAlarm.interval.max;
            
            var wallet = this.router.url.split('/')[2];
            var delegate = instance._address;
            var callAddress = this.newAlarm.call.address;
            var callData = this.newAlarm.call.data;
            var callOptions = [
                callValue,
                callGas,
                startTimestamp,
                windowSize,
                intervalValue,
                intervalUnit,
                maxIntervals
            ];
            var txOptions = {
                from: this.currentAccount
            }

            // console.log(wallet);
            // console.log(delegate);
            // console.log(callAddress);
            // console.log(callData);
            // console.log(callOptions);
            // console.log(txOptions);

            var txObject;

            if(this.data.alarmType == "new"){
                txObject = this.AlarmClock.createAndStart(
                    wallet,
                    delegate,
                    callAddress,
                    callData,
                    callOptions,
                    txOptions
                );
            } else if (this.data.alarmType == "set"){
                txObject = this.data.alarmClock.methods.start({
                    callAddress,
                    callData,
                    callOptions
                })
                .send(txOptions)
            }

            txObject.on('transactionHash', txHash => {
                console.log(txHash)
                this.dialogRef.close({
                    txObject: txObject,
                    wallet: wallet,
                    delegate: delegate,
                    callAddress: callAddress,
                    callData: callData,
                    callOptions: callOptions,
                    txOptions: txOptions
                });
            })
            .on('confirmation', (confirmations, txReceipt) => {
                if(confirmations == 0){
                    console.log(txReceipt);
                    var alarmClockAddress = txReceipt.events.NewAlarmClock_event.returnValues.alarmClock;
                    localStorage.setItem(alarmClockAddress + ".label", this.newAlarm.label);
                }
            })
            .catch(err => {
                console.error(err)
            })
        })
    }

    close(){
        this.dialogRef.close()
    }

    calculateTxCost(callGas, gasPriceInWei){
        var gasPriceInGwei = Number(web3.utils.fromWei(gasPriceInWei.toString(), 'gwei'));
        var total = callGas * gasPriceInGwei;
        var wei = web3.utils.toWei(total.toFixed(8).toString(), 'gwei')
        var cost = web3.utils.fromWei(wei, 'ether');
        
        return cost;
    }

    fillExampleTask(){
        this.newAlarm.label = "Send Message 'Hello World!' 3 times with 1 wei attached";
        this.newAlarm.startDate = new Date(new Date().getTime() + 10*60*1000); // set 10 minutes ahead
        this.newAlarm.interval.value = 10;
        this.newAlarm.interval.unit = 1;
        this.newAlarm.interval.type = 'custom';
        this.newAlarm.interval.max = 3;
        this.newAlarm.call.address = this.AlarmClock.example._address;
        this.newAlarm.call.gas = 100000;
        this.newAlarm.call.value = 1;
        this.newAlarm.call.data = "0x16230b010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000c48656c6c6f20576f726c64210000000000000000000000000000000000000000";
    }

}
