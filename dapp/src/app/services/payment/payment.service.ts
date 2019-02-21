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
    
    private factories = [];
    private factoryTypes = {};
    private watching = {};
    public list = {};

    constructor(
        private Web3: Web3Service,
        public RTx: RtxService,
    ){
        this.readyPromise = this.Web3.ready()
        .then(() => {
            this.setDelegate();
        })
        .catch(err => {
            // console.error(err);
        });
    }

    async ready () {
        return this.readyPromise;
    }

    watch (account) {
        return this.ready()
        .then(() => {
            if (!this.list[account]) {
                this.list[account] = [];
            
                // watch for changes
                console.log('watching')
                this.instance.events.Schedule_event({wallet:[account]}, (err, event) => {
                    console.log(err, event)
                    var wallet = event.returnValues.wallet;
                    var payment = {
                        address: event.returnValues.payment,
                        direction: 'outgoing'
                    }

                    this.getPaymentDetails(payment)
                    .then(() => {
                        this.list[wallet].push(payment);
                    });
                })

                this.instance.events.Unschedule_event({wallet:[account]}, (err, event) => {
                    console.log(err, event)
                    var wallet = event.returnValues.wallet;
                    var payment = event.returnValues.payment;
                    this.remove(payment, wallet);
                })

                this.instance.events.Register_event({recipient:[account]}, (err, event) => {
                    console.log(err, event)
                })

                this.instance.events.Unregister_event({recipient:[account]}, (err, event) => {
                    console.log(err, event)
                })

                this.instance.events.Unregister_event({recipient:[account]}, (err, event) => {
                    console.log(err, event)
                })
            }

            return this.getPayments(account);
        })
    }

    remove(payment, wallet){
        var index;
        for (var i = this.list[wallet].length - 1; i >= 0; i--) {
            var current = this.list[wallet][i];
            if(current.address == payment.address)
                index = i;
        }
        
        this.list[wallet].splice(index,1);
    }

    getPayments (account) {
        return Promise.all([
            this.instance.methods.getOutgoingPayments(account).call(),
            this.instance.methods.getIncomingPayments(account).call()
        ])
        .then(paymentLists => {
            var outgoing = paymentLists[0];
            var incoming = paymentLists[1];

            var outgoingPromises = [];
            for (var i = outgoing.length - 1; i >= 0; i--) {
                var address = outgoing[i];
                outgoingPromises.push(
                    this.getPaymentDetails({
                        address: address,
                        direction: 'outgoing'
                    })
                );
            }

            var incomingPromises = [];
            for (var i = incoming.length - 1; i >= 0; i--) {
                var address = incoming[i];
                incomingPromises.push(
                    this.getPaymentDetails({
                        address: address,
                        direction: 'incoming'
                    })
                );              
            }

            return Promise.all([
                Promise.all(outgoingPromises), 
                Promise.all(incomingPromises),
            ]);
        })
        .then(paymentLists => {
            var outgoing = paymentLists[0];
            var incoming = paymentLists[1];

            var payment;
            for (var i = outgoing.length - 1; i >= 0; i--) {
                var payment = outgoing[i];
                if(!this.watching[payment.address] && this.factories.includes(payment.factory)){
                    this.list[account].push(payment);
                    this.watching[payment.address] = true;
                }
            }

            for (var i = incoming.length - 1; i >= 0; i--) {
                var payment = incoming[i];
                if(!this.watching[payment.address] && this.factories.includes(payment.factory)){
                    this.list[account].push(incoming[i]);
                    this.watching[payment.address] = true;
                }
            }

            return this.list[account];
        })
        .catch(err => {
            console.error(err);
        })
    }

    getPaymentDetails (payment) {
        payment['instance'] = new web3.eth.Contract(IPaymentArtifact.abi, payment.address);
        payment['label'] = () => {
            var label = localStorage.getItem(payment.address+'.label');
            if(!label) label = "No Label"
            return label;
        }
        
        return payment.instance.methods.factory().call()
        .then(factory => {
            payment['factory'] = factory;
            payment['type'] = this.factoryTypes[factory];
            payment['cancel'] = () => {
                this.instance.methods.unschedule(payment.address).send({from: this.Web3.account.address})
            }

            if(payment.factory == this.RTx.factory._address)
                return this.RTx.getDetails(payment);
            else
                return payment;
        })
    }

    registerPaymentType (factory, type) {
        this.factories.push(factory);
        this.factoryTypes[factory] = type;
    }    

    private setDelegate () {
        var address = PaymentDelegateArtifact.networks[this.Web3.netId].address;
        this.instance = new web3.eth.Contract(PaymentDelegateArtifact.abi, address)
        this.instance['address'] = address;
        localStorage.setItem(this.instance._address + ".name", "Payment Delegate");
    }

}
