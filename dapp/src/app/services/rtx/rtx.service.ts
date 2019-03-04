import { Injectable } from '@angular/core';
import { MatDialog, MatSnackBar } from '@angular/material';

declare let require: any;
declare let web3: any;

import { Web3Service } from '../web3/web3.service';

import { CreateRtxDialog } from '../../dialogs/create-rtx/create-rtx.component';

let IPayment = require('../../../../../build/contracts/IPayment.json');
let GasPriceOracleArtifact = require('../../../../../build/contracts/GasPriceOracle.json');
let ExampleTaskArtifact = require('../../../../../build/contracts/ExampleTask.json');
let RecurringTransactionArtifact = require('../../../../../build/contracts/RecurringTransaction.json');
let RecurringTransactionFactoryArtifact = require('../../../../../build/contracts/RecurringTransactionFactory.json');
let RecurringTransactionDeployerArtifact = require('../../../../../build/contracts/RecurringTransactionDeployer.json');
let TransactionRequestInterface = require('../../../../../build/contracts/TransactionRequestInterface.json');

@Injectable({
  providedIn: 'root'
})
export class RtxService {

	private readyPromise: Promise<any>;

    public factory: any;
    public deployer: any;
    public example: any;
    public oracle: any;

    public exampleEvents = [];

    constructor (
        private dialog: MatDialog,
        private Web3: Web3Service,
    ) {
        this.readyPromise = this.Web3.ready()
        .then(() => {
            this.setFactory();
            this.setDeployer();
            this.setExample();
            this.setOracle();

            var fromBlock = this.Web3.block.number - 4*60*24*7;
            this.example.getPastEvents("allEvents", {fromBlock: fromBlock})
            .then(events => {
                // console.log(events)
                var promises = [];
                for (var i = 0; i < events.length; i++) {
                    promises.push(web3.eth.getBlock(events[i].blockNumber))
                }

                Promise.all(promises)
                .then(blockData => {
                    for (var i = events.length - 1; i >= 0; i--) {
                        events[i]['timestamp'] = blockData[i].timestamp;
                        var now = new Date().getTime()/1000;
                        var difference = events[i].timestamp - now;
                        var options = { weekday: 'short', hour: 'numeric', minute: 'numeric' };
                        events[i]['date'] = new Date(events[i].timestamp*1000);
                        events[i]['formattedDate'] = events[i].date.toLocaleDateString('en-US', options);
                    }

                    this.exampleEvents = events;
                })
            })

            this.example.events.Trigger_event(null, (err, event) => {
                //console.log(err, event)
                var included = false;
                for (var i = this.exampleEvents.length - 1; i >= 0; i--) {
                    if(this.exampleEvents[i].transactionHash == event.transactionHash)
                        included = true;
                }

                if(event && !included){
                    event['timestamp'] = this.Web3.block.timestamp;
                    var now = new Date().getTime()/1000;
                    var difference = event.timestamp - now;
                    var options = { weekday: 'short', hour: 'numeric', minute: 'numeric' };
                    event['date'] = new Date(event.timestamp*1000);
                    event['formattedDate'] = event.date.toLocaleDateString('en-US', options);
                    this.exampleEvents.push(event);
                }
            })
        })
        .catch(err => {
            // console.error(err);
        })
    }

    async ready () {
        return this.readyPromise;
    }

    getDetails (rtx) {
        rtx['type'] = "rtx";
        rtx['rtx'] = new web3.eth.Contract(RecurringTransactionArtifact.abi, rtx.address);
        rtx['events'] = [];
        rtx['changeLabel'] = (newLabel) => {
            localStorage.setItem(rtx.address + '.label', newLabel);
        }
        if(!rtx.eventSubscription){
            rtx['eventSubscription'] = rtx.rtx.events.allEvents(null, (err, event) => {
                console.log(err, event);
                rtx.events.push(event);
                if(event.event == 'Destroy_event'){
                    /*
                    this.rtxs[event.address].events.unsubscribe();
                    if(this.rtxs[event.address].alarm)
                        this.rtxs[event.address].alarm.events.unsubscribe();
                    */
                }
                else {
                    this.getDetails(rtx)
                }
            })                
        }

        rtx.rtx.methods.blockStarted().call()
        .then(startBlock => {
            rtx.rtx.events.allEvents({fromBlock: startBlock}, (err, event) => {
                if(!err){
                    this.Web3.getBlock(event.blockNumber)
                    .then(blockData => {
                        event['timestamp'] = blockData.timestamp;
                        rtx.events.push(event);
                    })
                }
            })
        })

        return rtx.rtx.methods.txRequest().call()
        .then(alarmAddress => {
            
            var rtxPromises = [
                rtx.rtx.methods.alarmStart().call(),
                rtx.rtx.methods.intervalValue().call(),
                rtx.rtx.methods.intervalUnit().call(),
                rtx.rtx.methods.currentInterval().call(),
                rtx.rtx.methods.maxIntervals().call(),
                rtx.rtx.methods.callAddress().call(),
                rtx.rtx.methods.callData().call(),
                rtx.rtx.methods.callValue().call(),
                rtx.rtx.methods.callGas().call(),
                web3.eth.getGasPrice(),
            ];

            if(alarmAddress != web3.utils.nullAddress){
                rtx['alarm'] = {
                    address: alarmAddress,
                    instance: new web3.eth.Contract(TransactionRequestInterface.abi, alarmAddress),
                }

                if(!rtx.alarm.events){
                    rtx.alarm['events'] = rtx.alarm.instance.events.allEvents(null, (err, event) => {
                        console.log(err, event);
                        rtx.events.push(event);
                        this.getDetails(rtx);
                    })
                }

                rtxPromises.push(rtx.alarm.instance.methods.requestData().call())
                rtxPromises.push(web3.eth.getBalance(rtx.alarm.address))
            }

            return Promise.all(rtxPromises)
            .then(promises => {
                var now = new Date().getTime()/1000;
                var oneWeek = 60*60*24*7;
                var oneYear = 60*60*24*365;
                rtx['label'] = () => {
                    var label = localStorage.getItem(rtx.address + '.label');
                    if(!label) label = 'No Label Set';
                    return label;
                }
                rtx['windowStart'] = Number(promises[0]);
                rtx['interval'] = {
                    value: promises[1],
                    unit: promises[2],
                    current: promises[3],
                    max: promises[4],
                }
                rtx['call'] = {
                    address: promises[5],
                    data: promises[6],
                    value: promises[7],
                    gas: promises[8]
                }

                var difference = rtx.windowStart - now;
                var options = null;
                if(difference > oneYear){
                    options = { month: 'short', year: 'numeric' };
                }
                else if (difference < oneWeek && difference > (0 - oneWeek)) {
                    options = { weekday: 'short', hour: 'numeric', minute: 'numeric' };
                }
                else {
                    options = { month: 'long', day: 'numeric' };
                }

                rtx['startDate'] = new Date(rtx.windowStart*1000);
                rtx['formattedDate'] = rtx.startDate.toLocaleDateString('en-US', options);
                rtx['cost'] = this.calculateRTxCost(
                    rtx.interval.value, 
                    rtx.interval.unit,
                    Number(rtx.call.gas),
                    promises[9]
                ).toString();

                if(alarmAddress != web3.utils.nullAddress){
                    var txRequest = promises[10];
                    rtx.alarm['balance'] = promises[11];
                    rtx.alarm['isCancelled'] = txRequest[1][0];
                    rtx.alarm['wasCalled'] = txRequest[1][1];
                    rtx.alarm['wasSuccessful'] = txRequest[1][2];
                    rtx.alarm['windowSize'] = Number(txRequest[2][9]);
                    rtx.alarm['windowStart'] = Number(txRequest[2][10]);
                    rtx.alarm['windowEnd'] = rtx.alarm.windowStart + rtx.alarm.windowSize;
                    rtx.alarm['expireDate'] = new Date(rtx.alarm.windowEnd*1000);
                    rtx.alarm['cancel'] = () => {
                        rtx.alarm.instance.methods.cancel().send({
                            from: this.Web3.account.address
                        })
                    }
                } else {
                    rtx['alarm'] = null;
                }
                
                if(rtx.status() == 'loading'){
                    rtx['status'] = () => {
                        var status = 'active';

                        if(!rtx.alarm){
                            if (rtx.interval.current > rtx.interval.max)
                                status = 'complete'
                            else
                                status = 'failed';
                        }
                        else {
                            if (rtx.alarm.isCancelled)
                                status = 'cancelled'
                            else {
                                if (this.Web3.block.timestamp > rtx.alarm.windowEnd)
                                    status = 'failed';
                            }    
                        }
                        
                        return status;
                    }
                }

                rtx['destroy'] = () => {
                    rtx.rtx.methods.destroy().send({
                        from: this.Web3.account.address
                    })
                }

                rtx['reset'] = () => {
                    const dialogRef = this.dialog.open(CreateRtxDialog, {
                        width: '90vw',
                        height: '90vh',
                        data: {
                            type: 'set',
                            RTx: this,
                            rtx: rtx.rtx,
                        }
                    });
                }
                
                rtx['ready'] = true;

                return rtx;
            })
        })
    }

    create(){
        const dialogRef = this.dialog.open(CreateRtxDialog, {
            width: '90vw',
            height: '90vh',
            data: { 
                type: 'new',
                RTx: this
            }
        });
    
        dialogRef.afterClosed().subscribe(rtx => {
            console.log(rtx)
            //to do snackbar
        });
    }

    createAndStart(
        wallet,
        callAddress,
        callData,
        callOptions,
        txOptions,
        label
    ){
        if(!wallet) return Promise.reject('wallet cannot be empty')
        if(!callAddress) return Promise.reject('call address cannot be empty')
        if(!callOptions) return Promise.reject('call options cannot be empty')
        if(!txOptions) return Promise.reject('tx options cannot be empty')

        return this.deployer.methods.deployAndStart(
            wallet,
            callAddress,
            callData,
            callOptions
        )
        .send(txOptions)
        .on('confirmation', (confirmations, txReceipt) => {
            console.log(confirmations + '/25', txReceipt, label);
            var rtxAddress = txReceipt.events.Deploy_event[0].returnValues.rtx;
            localStorage.setItem(rtxAddress + ".label", label);
        });
    }

    calculateRTxCost(intervalValue, intervalUnit, callGas, gasPrice){
        var totalSeconds = intervalValue * this.getUnitWeight(intervalUnit);
        var oneDay = 60*60*24;
        var elapsedDays = Math.round(totalSeconds/oneDay);
        var multiplier = null;
        if(elapsedDays > 365) multiplier = 10;
        else if(elapsedDays > 90) multiplier = 9;
        else if (elapsedDays > 30) multiplier = 8;
        else if (elapsedDays > 7) multiplier = 7;
        else if (elapsedDays > 1) multiplier = 6;
        else multiplier = 5;
        
        return Math.round((700000 + callGas) * gasPrice * multiplier);
    }
    
    getUnitText(intervalUnit){
             if(intervalUnit == 0) return 'seconds';
        else if(intervalUnit == 1) return 'minutes';
        else if(intervalUnit == 2) return 'hours';
        else if(intervalUnit == 3) return 'days';
        else if(intervalUnit == 4) return 'months';
        else if(intervalUnit == 5) return 'years';
        else               return null;
    }

    getUnitWeight(intervalUnit){
             if(intervalUnit == 0) return 1;
        else if(intervalUnit == 1) return 60;
        else if(intervalUnit == 2) return 60*60;
        else if(intervalUnit == 3) return 60*60*24;
        else if(intervalUnit == 4) return 60*60*24*30;
        else if(intervalUnit == 5) return 60*60*24*365;
        else                       return null;
    }

    private setFactory () {
        var address = RecurringTransactionFactoryArtifact.networks[this.Web3.netId].address;
        this.factory = new web3.eth.Contract(RecurringTransactionFactoryArtifact.abi, address)
        localStorage.setItem(this.factory._address + ".name", "RTx Factory");
    }

    private setDeployer () {
        var address = RecurringTransactionDeployerArtifact.networks[this.Web3.netId].address;
        this.deployer = new web3.eth.Contract(RecurringTransactionDeployerArtifact.abi, address)
        localStorage.setItem(this.deployer._address + ".name", "RTx Deployer");
    }

    private setExample () {
        var address = ExampleTaskArtifact.networks[this.Web3.netId].address;
        this.example = new web3.eth.Contract(ExampleTaskArtifact.abi, address);
    }

    private setOracle () {
        var address = GasPriceOracleArtifact.networks[this.Web3.netId].address;
        this.oracle = new web3.eth.Contract(GasPriceOracleArtifact.abi, address);
    }

}
