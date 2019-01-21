import { Injectable } from '@angular/core';
import * as TruffleContract from 'truffle-contract';

declare let web3: any;
declare let require: any;
import { Web3Service } from '../../services/web3/web3.service';
import { PaymentDelegateService } from '../payment-delegate/payment-delegate.service';

let IPayment = require('../../../../../build/contracts/IPayment.json');
let GasPriceOracleArtifact = require('../../../../../build/contracts/GasPriceOracle.json');
let ExampleTaskArtifact = require('../../../../../build/contracts/ExampleTask.json');
let RecurringAlarmClockArtifact = require('../../../../../build/contracts/RecurringAlarmClock.json');
let RecurringAlarmClockFactoryArtifact = require('../../../../../build/contracts/RecurringAlarmClockFactory.json');
let RecurringAlarmClockDeployerArtifact = require('../../../../../build/contracts/RecurringAlarmClockDeployer.json');
let TransactionRequestInterface = require('../../../../../build/contracts/TransactionRequestInterface.json');

const ExampleTask = TruffleContract(ExampleTaskArtifact);
const GasPriceOracle = TruffleContract(GasPriceOracleArtifact);
const RecurringAlarmClock = TruffleContract(RecurringAlarmClockArtifact);
const RecurringAlarmClockFactory = TruffleContract(RecurringAlarmClockFactoryArtifact);
const RecurringAlarmClockDeployer = TruffleContract(RecurringAlarmClockDeployerArtifact);

@Injectable({
  providedIn: 'root'
})
export class AlarmClockService {

    private readyPromise;

    public factory: any;
    public deployer: any;
    public example: any;
    public oracle: any;

    exampleEvents = [];

    alarmClocks = {};

    constructor(
        private Web3: Web3Service,
        private PaymentDelegate: PaymentDelegateService,
    ) { 
        this.Web3.ready().then(() => {
            RecurringAlarmClockFactory.setProvider(web3.currentProvider);
            RecurringAlarmClockDeployer.setProvider(web3.currentProvider);
            ExampleTask.setProvider(web3.currentProvider);
            GasPriceOracle.setProvider(web3.currentProvider);

            return this.readyPromise = Promise.all([
                RecurringAlarmClockFactory.deployed(),
                RecurringAlarmClockDeployer.deployed(),
                ExampleTask.deployed(),
                GasPriceOracle.deployed(),
                web3.eth.getBlockNumber()
            ])
        })
        .then(promises => {
            this.factory = new web3.eth.Contract(RecurringAlarmClockFactoryArtifact.abi, promises[0].address)
            this.deployer = new web3.eth.Contract(RecurringAlarmClockDeployerArtifact.abi, promises[1].address)
            this.example = new web3.eth.Contract(ExampleTaskArtifact.abi, promises[2].address);
            this.oracle = new web3.eth.Contract(GasPriceOracleArtifact.abi, promises[3].address);
            var currentBlock = promises[4];
            var fromBlock = currentBlock - 4*60*24*2;
            localStorage.setItem(this.deployer._address + ".name", "Alarm Clock Deployer");
            
            this.example.getPastEvents("allEvents", {fromBlock: fromBlock})
            .then(events => {
                //console.log(events)
                var promises = [];
                for (var i = 0; i < events.length; i++) {
                    promises.push(web3.eth.getBlock(events[i].blockNumber))
                }

                Promise.all(promises)
                .then(blockData => {
                    for (var i = events.length - 1; i >= 0; i--) {
                        events[i]['timestamp'] = blockData[i].timestamp;
                    }

                    this.exampleEvents = events;
                })
            })

            this.example.events.Trigger_event(null, (err, event) => {
                //console.log(err, event)
                if(event){
                    web3.eth.getBlock(event.blockNumber)
                    .then(block => {
                        //console.log(block);
                        event['timestamp'] = block.timestamp;
                        this.exampleEvents.push(event);
                    })
                }
            })
        })
        .catch(Promise.reject)
    }

    ready(){
        return this.readyPromise;
    }

    createAndStart(
        wallet,
        delegate,
        callAddress,
        callData,
        callOptions,
        txOptions
    ){
        if(!wallet) return Promise.reject('wallet cannot be empty')
        if(!delegate) return Promise.reject('delegate cannot be empty')
        if(!callAddress) return Promise.reject('call address cannot be empty')
        if(!callOptions) return Promise.reject('call options cannot be empty')
        if(!txOptions) return Promise.reject('tx options cannot be empty')

        return this.deployer.methods.createAndStartAlarmClock(
            wallet,
            delegate,
            callAddress,
            callData,
            callOptions
        )
        .send(txOptions)
    }

    watch(address){
        if(this.alarmClocks[address]) return;

        this.Web3.ready()
        .then(() => {
            this.updateAlarmClock(address)
            .then(alarmClock => {
                if(alarmClock.alarm){
                    alarmClock.alarm.instance.events.allEvents(null, (err, event) => {
                        console.log(address)
                        console.log(event)
                        this.updateAlarmClock(address);
                    })
                }
                
                alarmClock.instance.events.allEvents(null, (err, event) => {
                    console.log(address)
                    console.log(event)
                    this.updateAlarmClock(address);
                });
            })
        })
    }

    updateAlarmClock(address){
        var AlarmClock = new web3.eth.Contract(RecurringAlarmClockArtifact.abi, address);
        return AlarmClock.methods.alarm().call()
        .then(alarmAddress => {
            var promises = [
                AlarmClock.methods.alarmStart().call(),
                AlarmClock.methods.intervalValue().call(),
                AlarmClock.methods.intervalUnit().call(),
                AlarmClock.methods.currentInterval().call(),
                AlarmClock.methods.maxIntervals().call(),
                AlarmClock.methods.BASE_GAS_COST().call(),
                AlarmClock.methods.callGas().call(),
                web3.eth.getGasPrice(),
            ];

            var TxRequest;
            if(alarmAddress != web3.utils.nullAddress){
                TxRequest = new web3.eth.Contract(TransactionRequestInterface.abi, alarmAddress);
                promises.push(TxRequest.methods.requestData().call())
                promises.push(web3.eth.getBalance(TxRequest._address))
            }

            return Promise.all(promises)
            .then(promises => {
                var windowStart = Number(promises[0]);
                var intervalValue = promises[1];
                var intervalUnit = this.getUnitText(promises[2]);
                var baseGas = Number(promises[5]);
                var callGas = Number(promises[6]);
                var gasPrice = Number(promises[7]);
                var nextCostWei = this.calculateAlarmCost(intervalValue, promises[2], callGas, gasPrice);
                var nextCostEther = Number(web3.utils.fromWei(nextCostWei.toString(), 'ether'));
                var nextCostUsd = Number(nextCostEther * this.PaymentDelegate.ethPriceInUsd);
                var gasPriceInEther = Number(web3.utils.fromWei(gasPrice.toString(),'ether'));
                var realCostEther = (baseGas + callGas) * gasPriceInEther;
                var realCostWei = web3.utils.toWei(realCostEther.toString(),'ether');
                var realCostUsd = Number(realCostEther * this.PaymentDelegate.ethPriceInUsd);

                var alarm = null;

                if(alarmAddress != web3.utils.nullAddress){
                    var requestData = promises[8];
                    var alarmBalance = promises[9];

                    var etherBalance = Number(web3.utils.fromWei(alarmBalance, 'ether'));
                    var usdBalance = Number(etherBalance * this.PaymentDelegate.ethPriceInUsd);
                    var percentFunded = Math.round(etherBalance/realCostEther*100);

                    var isCancelled = requestData[1][0];
                    var wasCalled = requestData[1][1];
                    var wasSuccessful = requestData[1][2];
                    var windowSize = Number(requestData[2][8]);
                    var claimWindowSize = Number(requestData[2][5])
                    var freezePeriod = Number(requestData[2][6])
                    var reserveWindowSize = Number(requestData[2][7])
                    
                    alarm = {
                        wasSuccessful: wasSuccessful,
                        wasCalled: wasCalled,
                        isCancelled: isCancelled,
                        startClaimWindow: windowStart - freezePeriod - claimWindowSize,
                        endClaimWindow: windowStart - freezePeriod,
                        startExecuteWindow: windowStart + reserveWindowSize,
                        endExecuteWindow: windowStart + windowSize,
                        data: requestData,
                        balance: {
                            wei: alarmBalance,
                            ether: etherBalance,
                            usd: usdBalance,
                        },
                        percentFunded: percentFunded,
                        instance: TxRequest,
                        active(){
                            return (this.endExecuteWindow > this.Web3.now.timestamp);
                        },
                        failed(){
                            return (
                                (this.endExecuteWindow < this.Web3.now.timestamp && !this.wasCalled)
                                || (this.wasCalled && !this.alarm.wasSuccessful)
                            );
                        },
                        inactive(){
                            return !this.active() && !this.failed()
                        },
                        Web3: this.Web3
                    }
                }

                this.alarmClocks[AlarmClock._address] = {
                    label: this.getLabel(AlarmClock._address),
                    timestamp: windowStart,
                    interval: {
                        value: promises[1],
                        unit: intervalUnit,
                        current: promises[3],
                        max: promises[4],
                    },
                    cost: {
                        real: {
                            wei: realCostWei,
                            ether: realCostEther,
                            usd: realCostUsd
                        },
                        next: {
                            wei: nextCostWei,
                            ether: nextCostEther,
                            usd: nextCostUsd
                        }
                    },
                    start: AlarmClock.methods.start,
                    alarm: alarm,
                    callGas: callGas,
                    baseGas: baseGas,
                    instance: AlarmClock,
                };

                return this.alarmClocks[AlarmClock._address];
            })
        })
        .catch(err => {
            console.error(err)
        })
    }

    calculateAlarmCost(intervalValue, intervalUnit, callGas, gasPrice){
        var totalSeconds = intervalValue * this.getUnitWeight(intervalUnit);
        var oneDay = 60*60*24;
        var elapsedDays = Math.round(totalSeconds/oneDay);
        var multiplier = null;
        if(elapsedDays > 365) multiplier = 10;
        else if(elapsedDays > 90) multiplier = 10;
        else if (elapsedDays > 30) multiplier = 3;
        else if (elapsedDays > 7) multiplier = 2;
        else if (elapsedDays > 1) multiplier = 1.5;
        else if (elapsedDays > 0) multiplier = 1.2;
        else multiplier = 1.1;
        
        return Math.round((700000 + callGas) * gasPrice * multiplier);
    }

    getLabel(alarmClockAddress){
        var label = localStorage.getItem(alarmClockAddress + '.label');
        if(!label) label = 'No Label Set';
        return label;
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

}
