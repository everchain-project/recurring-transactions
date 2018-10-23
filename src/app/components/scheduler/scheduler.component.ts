import { Component, OnInit } from '@angular/core';
import { Router, Event, NavigationStart, RoutesRecognized, RouteConfigLoadStart, RouteConfigLoadEnd,  NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { Web3Service } from '../../services/web3/web3.service';
import { SchedulerService } from 'src/app/services/scheduler/scheduler.service';
import { WalletService } from 'src/app/services/wallet/wallet.service';
import { NameService } from 'src/app/services/name/name.service';

@Component({
    selector: 'app-scheduler',
    templateUrl: './scheduler.component.html',
    styleUrls: ['./scheduler.component.css']
})
export class SchedulerComponent implements OnInit {

    private web3;
    private initialized;

    private minStartDate;
    public isScheduled = false;
    public isRecurring = false;

    private wallet = {
        address: null,
        payments: [],
        subscription: null,
    }

    public payment = {
        delegate: null,
        recipient: null,
        token: null,
        amount: null,
        startDate: null,
        totalPayments: 2,
        periodValue: 1,
        period: 'hours'
    }

    constructor(
        private router: Router,
        private Web3Service: Web3Service,
        private PaymentScheduler: SchedulerService,
        private WalletService: WalletService,
        private NameService: NameService,
    ){}

    ngOnInit() {
        Promise.all([
            this.Web3Service.getWeb3Instance(),
            this.PaymentScheduler.ready(),
        ])
        .then(promises => {
            this.web3 = promises[0];
            this.payment.delegate = this.PaymentScheduler.PaymentDelegate.address;
    
            var now = new Date().getTime();
            var oneHour = 1000*60*60;
            this.minStartDate = new Date(now + oneHour);
            this.payment.startDate = this.minStartDate;
            var options = this.router.url.split('/');
            this.wallet.address = options[4];
            this.payment.token = options[6];
            console.log('PaymentDelegate:', this.PaymentScheduler.PaymentDelegate._address);

            this.wallet.subscription = this.web3.eth.subscribe('logs', {address: this.wallet.address},(err, result) => {
                //console.log(err, result)
                this.updatePaymentList()
                .then(promises => {
                    console.log(promises)
                    this.wallet.payments = promises;
                })
            })

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
                    var options = this.router.url.split('/');
                    this.wallet.address = options[4];
                    this.payment.token = options[6];
                    if(this.wallet.address){
                        this.updatePaymentList()
                        .then(promises => {
                            console.log(promises)
                            this.wallet.payments = promises;
                        })
                    }
                } else if (event instanceof NavigationCancel) { 
                    // Navigation is canceled as the Route-Guard returned false during navigation.
                } else if (event instanceof NavigationError) {
                    // Navigation fails due to an unexpected error.
                    console.log(event.error);
                }
            });

            return this.updatePaymentList()
        }).then(promises => {
            console.log(promises)
            this.wallet.payments = promises;
            this.initialized = true;
        })
    }

    updatePaymentList(){
        return Promise.all([
            this.PaymentScheduler.PaymentDelegate.methods.getIncomingPayments(this.wallet.address).call(),
            this.PaymentScheduler.PaymentDelegate.methods.getOutgoingPayments(this.wallet.address).call(),
            this.PaymentScheduler.PaymentDelegate.methods.getTotalIncomingPayments(this.wallet.address).call(),
            this.PaymentScheduler.PaymentDelegate.methods.getTotalOutgoingPayments(this.wallet.address).call(),
        ])
        .then(payments => {
            var incoming = payments[0];
            var outgoing = payments[1];
            var promises = [];

            incoming.forEach(payment => {
                promises.push(this.PaymentScheduler.getPayment(payment))
            });

            outgoing.forEach(payment => {
                promises.push(this.PaymentScheduler.getPayment(payment))
            });
            
            return Promise.all(promises)
        })
    }

    keyPress(event){
        if(event.keyCode == 13) {
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
        if(this.web3)
            validToken = (this.payment.token == this.web3.emptyAddress || this.web3.utils.isAddress(this.payment.token));

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
        if(this.web3)
            validToken = (this.payment.token == this.web3.emptyAddress || this.web3.utils.isAddress(this.payment.token));

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
        if(this.web3)
            validToken = (this.payment.token == this.web3.emptyAddress || this.web3.utils.isAddress(this.payment.token));

        var valid = (
            validToken &&
            this.web3.utils.isAddress(this.wallet.address) &&
            this.web3.utils.isAddress(this.payment.recipient) &&
            this.payment.amount != null &&
            this.payment.startDate != null &&
            this.payment.totalPayments >= 2 &&
            this.payment.periodValue > 0 &&
            this.payment.period != null
        );
        
        return valid;
    }
    
    transferTokens(){
        console.log(this.payment.token);
        console.log(this.wallet.address);
        console.log(this.payment.recipient);
        console.log(this.payment.amount);
        var Wallet = this.WalletService.getWallet(this.wallet.address)
        console.log(Wallet.methods.transfer)
        Wallet.methods.transfer(this.web3.emptyAddress, this.payment.recipient, this.web3.utils.toWei(this.payment.amount, 'ether'))
        .send({
            from: this.web3.currentAccount
        })
        .on('transactionHash', txHash => {
            console.log(txHash);
            return this.web3.eth.getTransactionReceipt(txHash)
        })
        .then(txReceipt => {
            console.log(txReceipt);
        })
    }

    scheduleOneTimePayment(){
        console.log(this.payment.token);
        console.log(this.wallet.address);
        console.log(this.payment.recipient);
        console.log(this.payment.amount);
        console.log(this.payment.startDate);
    }

    scheduleRecurringPayment(){
        var currentTimestamp = Math.floor(new Date().getTime()/1000);
        var oneHour = 60*60;
        var startTimestamp = currentTimestamp + oneHour;
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
        
        var paymentAmount = this.web3.utils.toWei(this.payment.amount.toString(), 'ether');
        var gas = 1500000;

        console.log(this.payment.delegate);
        console.log(this.wallet.address);
        console.log(this.payment.token);
        console.log(this.payment.recipient);
        console.log(paymentAmount);
        console.log(startTimestamp);
        console.log(this.payment.totalPayments);
        console.log(period);
        console.log(gas);

        this.PaymentScheduler.contract.methods.createRecurringPayment(
            this.payment.delegate,          // IFuturePaymentDelegate delegate,
            this.wallet.address,            // IDelegatedWallet wallet,
            this.payment.token,             // address token,
            this.payment.recipient,         // address recipient,
            paymentAmount,                  // uint paymentAmount,
            startTimestamp,                 // uint startTimestamp,
            this.payment.totalPayments,     // uint totalPayments,
            period,                         // uint period,
            gas,                            // uint gas,
        )
        .send({from: this.web3.currentAccount})
        .on('transactionHash', txHash => {
            console.log(txHash);
            return this.web3.eth.getTransactionReceipt(txHash)
        })
        .then(txReceipt => {
            console.log(txReceipt)
            this.payment.recipient = null;
            this.payment.amount = null;
            this.isScheduled = false;
            this.isRecurring = false;

        })
        .catch(err => {
            console.error(err);
        })
    }

    cancel(payment){
        console.log(payment.type)
        if(payment.type == 'payment'){
            console.log("canceling payment")
            this.PaymentScheduler.cancel(payment.address)
            .then(txReceipt => {
                return this.updatePaymentList()
            })
            .then(promises => {
                console.log(promises)
                this.wallet.payments = promises;
            })
        }
    }
}
