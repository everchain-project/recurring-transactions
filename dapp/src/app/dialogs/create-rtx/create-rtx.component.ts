import { Component, OnInit, OnChanges, Inject, NgZone } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Router } from "@angular/router";

declare let web3: any;

import { Web3Service } from '../../services/web3/web3.service';

@Component({
  selector: 'app-create-rtx',
  templateUrl: './create-rtx.component.html',
  styleUrls: ['./create-rtx.component.css']
})
export class CreateRtxDialog implements OnInit {

    RTx: any;
    currentAccount;
    currentGasPrice;
    view: string = 'building';
    
    taskPlaceholder = "0x9e74F79c806a79f3Bd85DDe4307245B077596D8a";
    dataPlaceholder = "0xbd1c91570000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000c48656c6c6f20576f726c64210000000000000000000000000000000000000000";

    public settings = {
        bigBanner: true,
        timePicker: true,
        format: 'MMM dd, yyyy @ hh:mm a',
        defaultOpen: false
    }

    public newRTx = {
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
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<CreateRtxDialog>,
        private router: Router,
        private Web3: Web3Service,
	){}

	ngOnInit() {
        this.RTx = this.data.RTx

        Promise.all([
            this.Web3.getCurrentAccount(),
            web3.eth.getGasPrice(),
        ])
        .then(promises => {
            this.currentAccount = promises[0];
            this.newRTx.tx.gasPrice = promises[1];
        })
        .catch(err => {
            console.error(err)
        })
	}

    valid(){
        if(!this.newRTx.label) return false;
        if(!this.newRTx.startDate) return false;
        if(!this.newRTx.interval.value) return false;
        if(!this.newRTx.interval.unit) return false;
        if(this.newRTx.interval.max == null || this.newRTx.interval.max < 0) return false;
        if(!this.newRTx.call.address) return false;
        if(!this.newRTx.call.value) return false;
        if(!this.newRTx.call.data) return false;
        if(!this.newRTx.call.gas) return false;

        return true;
    }

    setupOverview(){
        var callValue = this.newRTx.call.value;
        var callGas = this.newRTx.call.gas;
        var startTimestamp = Math.floor(new Date(this.newRTx.startDate).getTime()/1000);
        var windowSize = 900;
        var intervalValue  = this.newRTx.interval.value;
        var intervalUnit = this.newRTx.interval.unit;
        var maxIntervals = this.newRTx.interval.max;
        
        var wallet = this.router.url.split('/')[2];
        var callAddress = this.newRTx.call.address;
        var callData = this.newRTx.call.data;
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
            return this.RTx.deployer.methods.deployAndStart(
                wallet,
                callAddress,
                callData,
                callOptions
            ).estimateGas({
                from: this.currentAccount,
                gasPrice: currentGasPrice
            })
            .then(estimatedGasConsumption => {
                this.newRTx.tx.gasPrice = Math.round(currentGasPrice * 5);
                this.newRTx.tx.gas = estimatedGasConsumption;

                var intervalSeconds = this.RTx.getUnitWeight(this.newRTx.interval.unit) * this.newRTx.interval.value;
                var endTimestamp = startTimestamp + (intervalSeconds * this.newRTx.interval.max);
                this.newRTx.endDate = new Date(endTimestamp*1000).toString();
            })
        })
        .catch(err => {
            console.error(err);
        })

    }

    alarmCost(){
        var weiAmount = this.RTx.calculateRTxCost(
            this.newRTx.interval.value,
            this.newRTx.interval.unit,
            this.newRTx.call.gas,
            this.newRTx.tx.gasPrice
        );

        return Number(web3.utils.fromWei(weiAmount.toString(), 'ether'));
    }

    calculateTxCost(){
        var gasPriceInEther = Number(web3.utils.fromWei(this.newRTx.tx.gasPrice.toString(), 'ether'));
        return gasPriceInEther * this.newRTx.tx.gas;
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

    createAndStart(){
        var callValue = this.newRTx.call.value;
        var callGas = this.newRTx.call.gas;
        var startTimestamp = Math.floor(new Date(this.newRTx.startDate).getTime()/1000);
        var windowSize = this.RTx.getUnitWeight(this.newRTx.interval.unit) * this.newRTx.interval.value;
        var intervalValue  = this.newRTx.interval.value;
        var intervalUnit = this.newRTx.interval.unit;
        var maxIntervals = this.newRTx.interval.max;
        
        var wallet = this.router.url.split('/')[2];
        var callAddress = this.newRTx.call.address;
        var callData = this.newRTx.call.data;
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
            gasPrice: this.newRTx.tx.gasPrice,
            gas: this.newRTx.tx.gas,
        }
        var label = this.newRTx.label;

        // console.log(wallet);
        // console.log(callAddress);
        // console.log(callData);
        // console.log(callOptions);
        // console.log(txOptions);
        // console.log(this.newRTx.label);

        var txObject;
        if(this.data.type == "new"){
            txObject = this.RTx.createAndStart(
                wallet,
                callAddress,
                callData,
                callOptions,
                txOptions,
                label
            )
            .on('transactionHash', txHash => {
                this.dialogRef.close({
                    txObject: txObject,
                    wallet: wallet,
                    callAddress: callAddress,
                    callData: callData,
                    callOptions: callOptions,
                    txOptions: txOptions
                });
            })
        } else if (this.data.type == "set"){
            txObject = this.data.rtx.methods.start(
                callAddress,
                callData,
                callOptions,
            )
            .send(txOptions)
            .on('transactionHash', txHash => {
                console.log(txHash)
                this.dialogRef.close({
                    rtx: this.newRTx,
                    txObject: txObject,
                    wallet: wallet,
                    txOptions: txOptions
                });
            })
            .on('confirmation', (confirmations, txReceipt) => {
                if(confirmations == 0){
                    console.log(txReceipt);
                    var rtxAddress = txReceipt.events.ValidRequest_event.address;
                    localStorage.setItem(rtxAddress + '.label', this.newRTx.label)
                } 
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
        this.newRTx.label = "Hello World!   1 wei   10m   x3";
        this.newRTx.startDate = new Date(new Date().getTime() + 10*60*1000).toString(); // set 10 minutes ahead
        this.newRTx.interval.value = 10;
        this.newRTx.interval.unit = 1;
        this.newRTx.interval.type = 'custom';
        this.newRTx.interval.max = 3;
        this.newRTx.call.address = this.RTx.example.address;
        this.newRTx.call.gas = 100000;
        this.newRTx.call.value = 1;
        this.newRTx.call.data = "0xbd1c91570000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000c48656c6c6f20576f726c64210000000000000000000000000000000000000000";
    }

    triggerIntervalChange(){
        this.newRTx.interval.max = 0;
    }

}
