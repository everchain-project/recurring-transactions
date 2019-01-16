import { Injectable } from '@angular/core';

import * as TruffleContract from 'truffle-contract';
declare let web3: any;
declare let require: any;

let PaymentDelegateArtifact = require('../../../../../build/contracts/DecentralizedPaymentDelegate.json');
let DaiPriceFeedArtifact = require('../../../../../build/contracts/DSValueInterface.json');
const PaymentDelegate = TruffleContract(PaymentDelegateArtifact);

@Injectable({
  providedIn: 'root'
})
export class PaymentDelegateService {

	private KOVAN_DAI_PRICE_FEED = "0xa5aA4e07F5255E14F02B385b1f04b35cC50bdb66";

	public ready: any;
	private instance: any;
	private DaiPriceFeed: any;
	public ethPriceInUsd: number;

	constructor(){
		PaymentDelegate.setProvider(web3.currentProvider);
		this.DaiPriceFeed = new web3.eth.Contract(DaiPriceFeedArtifact.abi, this.KOVAN_DAI_PRICE_FEED);
		
		this.ready = Promise.all([
			PaymentDelegate.deployed(),
			this.DaiPriceFeed.methods.read().call(),
		])
		.then(promises => {
			var instance = promises[0];
			this.ethPriceInUsd = Number(web3.utils.fromWei(promises[1],"ether"));
			
			localStorage.setItem(instance.address + ".name", "Decentralized Payment Delegate");
			this.instance = new web3.eth.Contract(PaymentDelegateArtifact.abi, instance.address);
		})
		.catch(Promise.reject)
	}

	getInstance(){
		return this.ready.then(() => {
			return this.instance;
		})
	}

	getPayments(direction, account){ //, factoryFilter){
		return this.ready.then(() => {
			if (direction == 'in' || direction == 'incoming') {
				return this.instance.methods.getIncomingPayments(account).call();
			}
			else if (direction == 'out' || direction == 'outgoing') {
				return this.instance.methods.getOutgoingPayments(account).call();
			}
			else return Promise.reject('invalid direction')
		})
	}
	
}
