import { Injectable } from '@angular/core';

declare let web3: any;
declare let require: any;

import { Web3Service } from '../web3/web3.service';
import { RtxService } from '../rtx/rtx.service';

let IPaymentArtifact = require('../../../../../build/contracts/IPayment.json');
let PaymentDelegateArtifact = require('../../../../../build/contracts/DecentralizedPaymentDelegate.json');

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

    private readyPromise: Promise<any>;    
    public instance: any;
    public factories = [];
    
    //private factoryTypes = {};
    //private watching = {};
    //public list = {};

    private subscriptions = {};
    private for = {};

    constructor(
        private Web3: Web3Service,
        public RTx: RtxService,
    ){}

    async ready () {
        if(this.readyPromise) return this.readyPromise;

        this.readyPromise = this.Web3.ready()
        .then(() => {
            this.setDelegate();
        })

        return this.readyPromise;
    }

    subscribe(account){
        if(this.for[account]) return Promise.resolve(this.for[account]);
        else this.for[account] = [];

        this.watch(account);

        return this.getPayments(account)
        .then(payments => {
            this.for[account] = payments;
            return this.for[account];
        })
    }

    watch (account) {
        if(this.subscriptions[account]) return;
        else this.subscriptions[account] = {};

        try {
            this.subscriptions[account]['schedule'] = this.instance.events.Schedule_event({wallet:[account]}, (err, event) => {
                console.log(err, event)
                var wallet = event.returnValues.wallet;
                var payment = {
                    address: event.returnValues.payment,
                    direction: 'outgoing'
                }

                this.getPaymentDetails(payment)
                .then(() => {
                    if(!this.for[wallet])
                        this.for[wallet] = [payment];
                    else
                        this.for[wallet].push(payment);
                });
            })

            this.subscriptions[account]['unschedule'] = this.instance.events.Unschedule_event({wallet:[account]}, (err, event) => {
                var wallet = event.returnValues.wallet;
                var payment = event.returnValues.payment;
                var index;
                for (var i = this.for[wallet].length - 1; i >= 0; i--) {
                    var current = this.for[wallet][i];
                    if(current.address == payment.address)
                        index = i;
                }
            
                this.for[wallet].splice(index,1);
            })

            /*
            this.instance.events.Register_event({recipient:[account]}, (err, event) => {
                console.log(err, event)
            })

            this.instance.events.Unregister_event({recipient:[account]}, (err, event) => {
                console.log(err, event)
            })

            this.instance.events.Unregister_event({recipient:[account]}, (err, event) => {
                console.log(err, event)
            })
            */
        } 
        catch(err){
            return Promise.reject(err);
        }
    }

    getPayments (account) {
        console.log('get payments for', account)
        return Promise.all([
            this.instance.methods.getOutgoingPayments(account).call(),
            this.instance.methods.getIncomingPayments(account).call()
        ])
        .then(paymentLists => {
            var outgoing = paymentLists[0];
            var incoming = paymentLists[1];
            
            var paymentPromises = [];
            for (var i = outgoing.length - 1; i >= 0; i--) {
                var address = outgoing[i];
                paymentPromises.push(
                    this.getPaymentDetails({
                        address: address,
                        direction: 'outgoing'
                    })
                );
            }

            for (var i = incoming.length - 1; i >= 0; i--) {
                var address = incoming[i];
                paymentPromises.push(
                    this.getPaymentDetails({
                        address: address,
                        direction: 'incoming'
                    })
                );
            }

            return Promise.all(paymentPromises);
        })
        .then(payments => {
            var filteredPayments = [];
            for (var i = payments.length - 1; i >= 0; i--) {
                var payment = payments[i];
        
                if(this.factories.includes(payment.factory)){
                    filteredPayments.push(payment);
                }
            }
            return filteredPayments;
        })
        .catch(err => {
            console.error(err);
        })
    }

    getPaymentDetails (payment) {
        payment['payment'] = new web3.eth.Contract(IPaymentArtifact.abi, payment.address);
        payment['label'] = () => {
            var label = localStorage.getItem(payment.address+'.label');
            if(!label) label = "No Label"
            return label;
        }
        payment['unschedule'] = () => {
            return this.instance.methods.unschedule(payment.address).send({from: this.Web3.account.address})
        }
        
        return payment.payment.methods.factory().call()
        .then(factory => {
            payment['factory'] = factory;
            if(payment.factory == this.RTx.factory._address){
                return this.RTx.getDetails(payment);
            }
            else
                return payment;
        })
    }   

    private setDelegate () {
        var address = PaymentDelegateArtifact.networks[this.Web3.netId].address;
        this.instance = new web3.eth.Contract(PaymentDelegateArtifact.abi, address)
        this.instance['address'] = address;
        localStorage.setItem(this.instance._address + ".name", "Payment Delegate");
    }

}
