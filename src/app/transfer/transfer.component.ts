import { Component, OnInit } from '@angular/core';
import { Router, Event, NavigationStart, RoutesRecognized, RouteConfigLoadStart, RouteConfigLoadEnd,  NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { Web3Service } from '../web3/web3.service';
import { EverchainService } from '../everchain/everchain.service';

import * as TruffleContract from 'truffle-contract';
declare let require: any;
let RecurringPaymentSchedulerArtifact = require('../../../build/contracts/RecurringPaymentScheduler.json');
const RecurringPaymentSchedulerContract = TruffleContract(RecurringPaymentSchedulerArtifact);

@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.css']
})
export class TransferComponent implements OnInit {

    private web3;

    private minStartDate;
    public isScheduled = true;
    public isRecurring = true;
    private activeToken;

    private wallet = {
        address: null
    }

    private PaymentScheduler;
    private currentAccount;

    public payment = {
        recipient: '0x88ce8659f6e865bc11f76cb52a5bb83b924e7e1d',
        amount: 1,
        startDate: null,
        numberOfPayments: 2,
        periodValue: 1,
        period: 'days'
    }

    constructor(
        private router: Router,
        private Web3: Web3Service,
        private Everchain: EverchainService
    ){
        this.web3 = Web3.instance();
        this.activeToken = this.web3.emptyAddress;
        this.web3.eth.getAccounts()
        .then(accounts => {
            if(accounts.length > 0)
                this.currentAccount = accounts[0];
        })

        RecurringPaymentSchedulerContract.setProvider(this.web3.currentProvider);
        RecurringPaymentSchedulerContract.deployed()
        .then(instance => this.PaymentScheduler = instance)
    }

    ngOnInit() {
        var now = new Date().getTime();
        var oneDay = 24*60*60*1000;
        var tomorrow = now + oneDay;
        this.minStartDate = now; //new Date(tomorrow);
        this.payment.startDate = new Date(now + 1000*60*5);
        console.log('start date',this.payment.startDate);
        
        var url = this.router.url;
        var options = url.split('/');
        this.wallet.address = options[3];
        this.activeToken = options[5];

        this.router.events.subscribe( (event: Event) => {
            if (event instanceof NavigationStart) {
                // Navigation started.
                //console.log(event.url);
            } else if (event instanceof RoutesRecognized) { 
                // Router parses the URL and the routes are recognized.
            } else if (event instanceof RouteConfigLoadStart) {
                // Before the Router lazyloads a route configuration.
            } else if (event instanceof RouteConfigLoadEnd) { 
                // Route has been lazy loaded.
            } else if (event instanceof NavigationEnd) {
                // Navigation Ended Successfully.
                var options = event.url.split('/');
                this.wallet.address = options[3];
                this.activeToken = options[5];

            } else if (event instanceof NavigationCancel) { 
                // Navigation is canceled as the Route-Guard returned false during navigation.
            } else if (event instanceof NavigationError) {
                // Navigation fails due to an unexpected error.
                console.log(event.error);
            }
        });
    }

    keyPress(event){
        if(event.keyCode == 13) {
            console.log(this.isScheduled);
            console.log(this.isRecurring);
            
            if(!this.isScheduled){
                this.transferTokens();
            } else if (this.isScheduled && !this.isRecurring){
                this.scheduleOneTimePayment();
            } else if (this.isScheduled && this.isRecurring){
                this.scheduleRecurringPayment();
            }

        }
    }

    validTransfer(){
        var validToken = false;
        if(this.activeToken == '0x0000000000000000000000000000000000000000'){
            validToken = true
        } else {
            validToken = this.web3.utils.isAddress(validToken);
        }

        var valid = (
            validToken &&
            this.web3.utils.isAddress(this.wallet.address) &&
            this.web3.utils.isAddress(this.payment.recipient) &&
            this.payment.amount != null 
        );
        
        return valid;
    }

    validOneTimePayment(){
        var validToken = false;
        if(this.activeToken == '0x0000000000000000000000000000000000000000'){
            validToken = true
        } else {
            validToken = this.web3.utils.isAddress(validToken);
        }

        var valid = (
            validToken &&
            this.web3.utils.isAddress(this.wallet.address) &&
            this.web3.utils.isAddress(this.payment.recipient) &&
            this.payment.amount != null &&
            this.payment.startDate != null
        );
        
        return valid;
    }

    validRecurringPayment(){
        var validToken = false;
        if(this.activeToken == '0x0000000000000000000000000000000000000000'){
            validToken = true
        } else {
            validToken = this.web3.utils.isAddress(validToken);
        }

        var valid = (
            validToken &&
            this.web3.utils.isAddress(this.wallet.address) &&
            this.web3.utils.isAddress(this.payment.recipient) &&
            this.payment.amount != null &&
            this.payment.startDate != null &&
            this.payment.numberOfPayments >= 2 &&
            this.payment.periodValue > 0 &&
            this.payment.period != null
        );
        
        return valid;
    }
    
    transferTokens(){
        console.log(this.activeToken);
        console.log(this.wallet.address);
        console.log(this.payment.recipient);
        console.log(this.payment.amount);
    }

    scheduleOneTimePayment(){
        console.log(this.activeToken);
        console.log(this.wallet.address);
        console.log(this.payment.recipient);
        console.log(this.payment.amount);
        console.log(this.payment.startDate);
    }

    scheduleRecurringPayment(){
        console.log(this.activeToken);
        console.log(this.wallet.address);
        console.log(this.payment.recipient);
        console.log(this.payment.amount);
        console.log(this.payment.startDate);
        console.log(this.payment.numberOfPayments);
        console.log(this.payment.periodValue);
        console.log(this.payment.period);
        console.log(this.PaymentScheduler.address);

        var msTimestamp = new Date().getTime();
        var startTimestamp = Math.floor(msTimestamp/1000) + 10*60;
        var period = this.payment.periodValue;
        if(this.payment.period == 'minutes')
            period = period*60;
        else if(this.payment.period == 'hours')
            period = period*60*60;
        else if(this.payment.period == 'days')
            period = period*60*60*24;
        else if(this.payment.period == 'weeks')
            period = period*60*60*24*7;
        else if(this.payment.period == 'months')
            period = period*60*60*24*30;
        else if(this.payment.period == 'years')
            period = period*60*60*24*365;
        
        console.log(period);

        var amount = this.web3.utils.toWei(this.payment.amount.toString(), 'ether');
        var paymentDelegate = this.Everchain.paymentDelegate;
        console.log(paymentDelegate);

        this.PaymentScheduler.createRecurringPayment(
            paymentDelegate,                // IFuturePaymentDelegate delegate,
            this.wallet.address,            // IDelegatedWallet wallet,
            this.activeToken,               // address token,
            this.payment.recipient,         // address recipient,
            amount,                         // uint paymentAmount,
            startTimestamp,                 // uint startTimestamp,
            this.payment.numberOfPayments,  // uint totalPayments,
            period,                         // uint period,
            1000000,                        // uint gas,
            {from: this.currentAccount}
        )
        .then(tx => {
            console.log(tx);
        })
        .catch(err => {
            console.error(err);
        })
    }

}
