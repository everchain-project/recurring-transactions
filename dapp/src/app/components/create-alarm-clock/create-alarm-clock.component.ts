import { Component, OnInit, OnChanges, Inject, NgZone } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Router } from "@angular/router";

declare let web3: any;
import { Web3Service } from '../../services/web3/web3.service';
import { AlarmClockService } from '../../services/alarm-clock/alarm-clock.service';
import { PaymentDelegateService } from '../../services/payment-delegate/payment-delegate.service';
import { WalletManagerService } from '../../services/wallet-manager/wallet-manager.service';

@Component({
  selector: 'app-create-alarm-clock',
  templateUrl: './create-alarm-clock.component.html',
  styleUrls: ['./create-alarm-clock.component.css']
})
export class CreateAlarmClockComponent implements OnInit {

    title;
    currentAccount;
    currentGasPrice;
    view: string = 'building';
    
    taskPlaceholder = "0x9e74F79c806a79f3Bd85DDe4307245B077596D8a";
    dataPlaceholder = "0x16230b010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000c48656c6c6f20576f726c64210000000000000000000000000000000000000000";

    public settings = {
        bigBanner: true,
        timePicker: true,
        format: 'MMM dd, yyyy @ hh:mm a',
        defaultOpen: false
    }

    public newAlarm = {
        label: null,
        startDate: new Date(new Date().getTime() + 30*24*60*60*1000).toString(), // set 24 hours ahead
        endDate: null,
        call: {
            address: null,
            value: null,
            gas: null,
            data: null,
        },
        interval: {
            value: 1,
            unit: 4,
            type: 'forever',
            max: 0,
        },
        tx: {
            gasPrice: null,
            gas: null,
            cost: null,
        },
        cost: null,
    }

	constructor(
        public dialogRef: MatDialogRef<CreateAlarmClockComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private router: Router,
        private ngZone: NgZone,
        private Web3: Web3Service,
		private AlarmClock: AlarmClockService,
        private PaymentDelegate: PaymentDelegateService,
        public WalletManager: WalletManagerService,
	) { }

	ngOnInit() {
        this.title = this.data.title;

        Promise.all([
            this.Web3.getCurrentAccount(),
            web3.eth.getGasPrice(),
        ])
        .then(promises => {
            this.currentAccount = promises[0];
            this.newAlarm.tx.gasPrice = promises[1];
        })
        .catch(err => {
            console.error(err)
        })
	}

    valid(){
        if(!this.newAlarm.label) return false;
        if(!this.newAlarm.startDate) return false;
        if(!this.newAlarm.interval.value) return false;
        if(!this.newAlarm.interval.unit) return false;
        if(!this.newAlarm.interval.max) return false;
        if(!this.newAlarm.call.address) return false;
        if(!this.newAlarm.call.value) return false;
        if(!this.newAlarm.call.data) return false;
        if(!this.newAlarm.call.gas) return false;

        return true;
    }

    setupOverview(){
        var callValue = this.newAlarm.call.value;
        var callGas = this.newAlarm.call.gas;
        var startTimestamp = Math.floor(new Date(this.newAlarm.startDate).getTime()/1000);
        var windowSize = this.calculateWindowSize();
        var intervalValue  = this.newAlarm.interval.value;
        var intervalUnit = this.newAlarm.interval.unit;
        var maxIntervals = this.newAlarm.interval.max;
        
        var wallet = this.router.url.split('/')[2];
        var delegate = this.PaymentDelegate.instance._address;
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

        return web3.eth.getGasPrice()
        .then(currentGasPrice => {
            this.AlarmClock.deployer.methods.createAndStartAlarmClock(
                wallet,
                delegate,
                callAddress,
                callData,
                callOptions
            ).estimateGas({
                from: this.currentAccount,
                gasPrice: currentGasPrice
            })
            .then(estimatedGasConsumption => {
                this.newAlarm.tx.gasPrice = Math.round(currentGasPrice * 1.25);
                this.newAlarm.tx.gas = estimatedGasConsumption;

                var intervalSeconds = this.AlarmClock.getUnitWeight(this.newAlarm.interval.unit) * this.newAlarm.interval.value;
                var endTimestamp = startTimestamp + (intervalSeconds * this.newAlarm.interval.max);
                this.newAlarm.endDate = new Date(endTimestamp*1000).toString();
            })
        })

    }

    calculateAlarmCost(){
        var weiAmount = this.AlarmClock.calculateAlarmCost(
            this.newAlarm.interval.value,
            this.newAlarm.interval.unit,
            this.newAlarm.call.gas,
            this.newAlarm.tx.gasPrice
        );

        return Number(web3.utils.fromWei(weiAmount.toString(), 'ether'));
    }

    calculateFirstAlarmCost(){
        var oneDay = 60*60*24;
        var now = new Date().getTime(); 
        var startDate = new Date(this.newAlarm.startDate).getTime();
        var totalSeconds = Math.round((startDate - now)/1000);
        var elapsedDays = Math.round(totalSeconds/oneDay);
        var multiplier = null;
        if(elapsedDays > 365)
            multiplier = 10;
        else if(elapsedDays > 90)
            multiplier = 10;
        else if (elapsedDays > 30)
            multiplier = 3;
        else if (elapsedDays > 7)
            multiplier = 2;
        else if (elapsedDays > 1)
            multiplier = 1.5;
        else if (elapsedDays > 0)
            multiplier = 1.2;
        else
            multiplier = 1.1;

        var weiAmount = Math.round((700000 + this.newAlarm.call.gas) * this.newAlarm.tx.gasPrice * multiplier);
        return Number(web3.utils.fromWei(weiAmount.toString(), 'ether'));
    }

    calculateTxCost(){
        var gasPriceInEther = Number(web3.utils.fromWei(this.newAlarm.tx.gasPrice.toString(), 'ether'));
        return gasPriceInEther * this.newAlarm.tx.gas;
    }

    calculateWindowSize(){
        var windowSize = 900;

        return windowSize;
    }

    continue(){
        this.setupOverview().then(() => {
            this.view = 'finalizing';
        })
    }

    createAndStartAlarmClock(){
        var callValue = this.newAlarm.call.value;
        var callGas = this.newAlarm.call.gas;
        var startTimestamp = Math.floor(new Date(this.newAlarm.startDate).getTime()/1000);
        var windowSize = this.calculateWindowSize();
        var intervalValue  = this.newAlarm.interval.value;
        var intervalUnit = this.newAlarm.interval.unit;
        var maxIntervals = this.newAlarm.interval.max;
        
        var wallet = this.router.url.split('/')[2];
        var delegate = this.PaymentDelegate.instance._address;
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
            from: this.currentAccount,
            gasPrice: this.newAlarm.tx.gasPrice,
            gas: this.newAlarm.tx.gas,
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
            )
            .on('transactionHash', txHash => {
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
                if(confirmations == 0) console.log(confirmations, txReceipt);
                
                var alarmClockAddress = txReceipt.events.DeployAlarmClock_event.returnValues.alarmClock;
                if(!this.WalletManager.wallets[wallet].alarmClocks.includes(alarmClockAddress)) {
                    console.log(alarmClockAddress)
                    localStorage.setItem(alarmClockAddress + ".label", this.newAlarm.label);
                    this.AlarmClock.watch(alarmClockAddress);
                    this.WalletManager.wallets[wallet].alarmClocks.push(alarmClockAddress)
                }
            });
        } else if (this.data.alarmType == "set"){
            txObject = this.data.alarmClock.methods.start(
                callAddress,
                callData,
                callOptions,
            )
            .send(txOptions)
            .on('transactionHash', txHash => {
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
                console.log(confirmations, txReceipt)
            })
            .catch(err => {
                console.error(err)
            })
        }
    }

    close(){
        this.dialogRef.close()
    }

    fillExampleTask(){
        this.newAlarm.label = "Trigger Message 'Hello World!' 3 times with 1 wei attached";
        this.newAlarm.startDate = new Date(new Date().getTime() + 10*60*1000).toString(); // set 10 minutes ahead
        this.newAlarm.interval.value = 10;
        this.newAlarm.interval.unit = 1;
        this.newAlarm.interval.type = 'custom';
        this.newAlarm.interval.max = 3;
        this.newAlarm.call.address = this.AlarmClock.example._address;
        this.newAlarm.call.gas = 100000;
        this.newAlarm.call.value = 1;
        this.newAlarm.call.data = "0x16230b010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000c48656c6c6f20576f726c64210000000000000000000000000000000000000000";
    }

    triggerIntervalChange(){
        this.newAlarm.interval.max = 0;
    }

}
