import { Injectable } from '@angular/core';
import * as TruffleContract from 'truffle-contract';
import { Web3Service } from '../web3/web3.service';
import { NameService } from '../name/name.service';
import { promise } from 'selenium-webdriver';

declare let require: any;
let IPaymentArtifact = require('../../../../build/contracts/IPayment.json');
let RecurringPaymentSchedulerArtifact = require('../../../../build/contracts/RecurringPaymentScheduler.json');
const RecurringPaymentSchedulerContract = TruffleContract(RecurringPaymentSchedulerArtifact);
let PaymentDelegateArtifact = require('../../../../build/contracts/PaymentDelegate.json');
const PaymentDelegateContract = TruffleContract(PaymentDelegateArtifact);
let RecurringPaymentFactoryArtifact = require('../../../../build/contracts/RecurringPaymentFactory.json');
const RecurringPaymentFactoryContract = TruffleContract(RecurringPaymentFactoryArtifact);
let RecurringAlarmClockFactoryArtifact = require('../../../../build/contracts/RecurringAlarmClockFactory.json');
const RecurringAlarmClockFactoryContract = TruffleContract(RecurringAlarmClockFactoryArtifact);
let ITaskArtifact = require('../../../../build/contracts/ITask.json');
let RecurringAlarmClockArtifact = require('../../../../build/contracts/RecurringAlarmClock.json');

@Injectable({
    providedIn: 'root'
})
export class SchedulerService {

    private initialized;
    private web3;
    public contract;

    public PaymentDelegate;
    public AlarmClockFactory;
    public PaymentFactory;

    constructor(
        private Web3Service: Web3Service,
        private NameService: NameService,
    ){ 
        this.initialized = this.Web3Service.getWeb3Instance()
        .then(web3 => {
            this.web3 = web3;

            RecurringPaymentSchedulerContract.setProvider(this.web3.currentProvider);
            PaymentDelegateContract.setProvider(this.web3.currentProvider);
            RecurringAlarmClockFactoryContract.setProvider(this.web3.currentProvider);
            RecurringPaymentFactoryContract.setProvider(this.web3.currentProvider);
            return Promise.all([
                RecurringPaymentSchedulerContract.deployed(),
                PaymentDelegateContract.deployed(),
                RecurringAlarmClockFactoryContract.deployed(),
                RecurringPaymentFactoryContract.deployed(),
            ])
        })
        .then(promises => {
            this.contract = new this.web3.eth.Contract(RecurringPaymentSchedulerArtifact.abi, promises[0].address)
            this.PaymentDelegate = new this.web3.eth.Contract(PaymentDelegateArtifact.abi, promises[1].address)
            this.AlarmClockFactory = new this.web3.eth.Contract(RecurringAlarmClockFactoryArtifact.abi, promises[2].address)
            this.PaymentFactory = new this.web3.eth.Contract(RecurringPaymentFactoryArtifact.abi, promises[3].address)
            this.PaymentDelegate['address'] = this.PaymentDelegate._address
            this.AlarmClockFactory['address'] = this.AlarmClockFactory._address
            this.PaymentFactory['address'] = this.PaymentFactory._address

            console.log("Alarm Clock Factory", this.AlarmClockFactory.address)
            console.log("Payment Factory", this.PaymentFactory.address)
            
            localStorage.setItem(this.PaymentDelegate._address + '.name', 'Payment Scheduler')
        })
    }

    ready(){
        return this.initialized;
    }
    
    getPayment(address){
        var paymentInstance = new this.web3.eth.Contract(IPaymentArtifact.abi, address)
        console.log(paymentInstance.methods)
        return Promise.all([
            paymentInstance.methods.factory().call(),
            paymentInstance.methods.wallet().call(),
            paymentInstance.methods.token().call(),
            paymentInstance.methods.recipient().call(),
            paymentInstance.methods.amount().call(),
        ])
        .then(promises => {
            var payment = {
                address: address,
                factory: promises[0],
                type: null,
                wallet: promises[1],
                token: promises[2],
                recipient: promises[3],
                amount: promises[4],
                executor: null,
                execution: null,
                intervalDuration: null,
                currentInterval: null,
                maximumIntervals: null,
            };

            console.log(payment);

            function convertToReadableTime(seconds){
                var oneYear = 60*60*24*365;
                var years = Math.floor(seconds/oneYear);
                if(years > 1)
                    return years + ' years';
                    else if (years > 0)
                    return years + ' year';

                var oneMonth = 60*60*24*30;
                var months = Math.floor(seconds/oneMonth);
                if(months > 1)
                    return months + ' months';
                    else if (months > 0)
                    return months + ' month';

                var oneWeek = 60*60*24*7;
                var weeks = Math.floor(seconds/oneWeek);
                if(weeks > 1)
                    return weeks + ' weeks';
                    else if (weeks > 0)
                    return weeks + ' week';

                var oneDay = 60*60*24;
                var days = Math.floor(seconds/oneDay);
                if(days > 1)
                    return days + ' days';
                    else if (days > 0)
                    return days + ' day';

                var oneHour = 60*60;
                var hours = Math.floor(seconds/oneHour);
                if(hours > 1)
                    return hours + ' hours';
                    else if (hours > 0)
                    return hours + ' hour';

                var oneMinute = 60;
                var minutes = Math.floor(seconds/oneMinute);
                if(minutes > 1)
                    return minutes + ' minutes';
                    else if (minutes > 0)
                    return minutes + ' minute';
            }

            if(payment.factory == this.PaymentFactory.address){
                payment.type = 'payment'
                var paymentTask = new this.web3.eth.Contract(ITaskArtifact.abi, paymentInstance._address);
                console.log(paymentTask.methods);
                return paymentTask.methods.executor().call()
                .then(executor => {
                    payment.executor = executor;
                    var alarmInstance = new this.web3.eth.Contract(RecurringAlarmClockArtifact.abi, payment.executor);
                    return Promise.all([
                        alarmInstance.methods.task().call(),
                        alarmInstance.methods.currentInterval().call(),
                        alarmInstance.methods.maximumIntervals().call(),
                        alarmInstance.methods.intervalDuration().call(),
                        alarmInstance.methods.eacOptions(5).call(),
                    ])
                    .then(promises => {
                        var taskAddress = promises[0];
                        payment.currentInterval = promises[1];
                        payment.maximumIntervals = promises[2];
                        payment.intervalDuration = convertToReadableTime(promises[3]);
                        payment.execution = promises[4];
                        console.log(payment);
                        return payment; 
                    })
                })
            } 
            else if(payment.factory == this.AlarmClockFactory.address){
                payment.type = 'alarm'
                var alarmInstance = new this.web3.eth.Contract(RecurringAlarmClockArtifact.abi, payment.address);
                return Promise.all([
                    alarmInstance.methods.task().call(),
                    alarmInstance.methods.currentInterval().call(),
                    alarmInstance.methods.maximumIntervals().call(),
                    alarmInstance.methods.intervalDuration().call(),
                    alarmInstance.methods.eacOptions(5).call(),
                ])
                .then(promises => {
                    var taskAddress = promises[0];
                    payment.currentInterval = promises[1];
                    payment.maximumIntervals = promises[2];
                    payment.intervalDuration = convertToReadableTime(promises[3]);
                    payment.execution = promises[4];

                    this.NameService.setName(alarmInstance._address, "Alarm Clock for Payment ID: " + taskAddress.slice(2,6))
                    console.log(payment);
                    return payment; 
                })
            }            
        })
    }

    cancel(paymentAddress){
        var payment = new this.web3.eth.Contract(ITaskArtifact.abi, paymentAddress)
        return payment.methods.cancel()
        .send({from: this.web3.currentAccount})
        .on('transactionHash', txHash => {
            return this.web3.eth.getTransactionReceipt(txHash)
        })
    }

}
