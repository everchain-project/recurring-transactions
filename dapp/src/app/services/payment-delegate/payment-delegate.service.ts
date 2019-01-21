import { Injectable } from '@angular/core';
import * as TruffleContract from 'truffle-contract';

declare let web3: any;
declare let require: any;
import { Web3Service } from '../../services/web3/web3.service';

let IPaymentArtifact = require('../../../../../build/contracts/IPayment.json');
let DaiPriceFeedArtifact = require('../../../../../build/contracts/DSValueInterface.json');
let PaymentDelegateArtifact = require('../../../../../build/contracts/DecentralizedPaymentDelegate.json');
const PaymentDelegate = TruffleContract(PaymentDelegateArtifact);

@Injectable({
  providedIn: 'root'
})
export class PaymentDelegateService {

	private KOVAN_DAI_PRICE_FEED = "0xa5aA4e07F5255E14F02B385b1f04b35cC50bdb66";

	private readyPromise: any;
	private DaiPriceFeed: any;
	
	public instance: any;
	public ethPriceInUsd: number;

	payments = {};

	constructor(
		private Web3: Web3Service
	){	
		this.readyPromise = this.Web3.ready().then(() => {
			PaymentDelegate.setProvider(web3.currentProvider);
			this.DaiPriceFeed = new web3.eth.Contract(DaiPriceFeedArtifact.abi, this.KOVAN_DAI_PRICE_FEED);
		
			return Promise.all([
				PaymentDelegate.deployed(),
				this.DaiPriceFeed.methods.read().call(),
			])
		})
		.then(promises => {
			var instance = promises[0];
			this.ethPriceInUsd = Number(web3.utils.fromWei(promises[1],"ether"));
			
			localStorage.setItem(instance.address + ".name", "Decentralized Payment Delegate");
			this.instance = new web3.eth.Contract(PaymentDelegateArtifact.abi, instance.address);
		})
	}

	ready(){
		return this.readyPromise.then(() => {
			return this.instance;
		})
	}

	getPayments(direction, account, factoryFilter){
		return this.ready().then(() => {
			if (direction == 'in' || direction == 'incoming') {
				return this.instance.methods.getIncomingPayments(account).call()
				.then(payments => {
					var paymentPromises = [];
					for (var i = payments.length - 1; i >= 0; i--) {
						var payment = new web3.eth.Contract(IPaymentArtifact.abi, payments[i]);
						paymentPromises.push(payment.methods.factory().call())
					}
					return Promise.all(paymentPromises)
				})
				.then(payments => {
					var filteredPayments = [];
					for (var i = payments.length - 1; i >= 0; i--) {
						console.log(payments[i].factory, factoryFilter);
						if(payments[i].factory == factoryFilter)
							filteredPayments.push(payments[i])
					}
					return filteredPayments;
				})
			}
			else if (direction == 'out' || direction == 'outgoing') {
				return this.instance.methods.getOutgoingPayments(account).call()
				.then(payments => {
					var factoryPromises = [];
					for (var i = payments.length - 1; i >= 0; i--) {
						var payment = new web3.eth.Contract(IPaymentArtifact.abi, payments[i]);
						factoryPromises.push(payment.methods.factory().call())
					}
					return Promise.all(factoryPromises)
					.then(factories => {
						var filteredPayments = [];
						for (var i = payments.length - 1; i >= 0; i--) {
							if(factories[i] == factoryFilter)
								filteredPayments.push(payments[i])
						}
						return filteredPayments;
					})
				})
			}
			else return Promise.reject('invalid direction')
		})
	}
	
}
