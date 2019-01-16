import { Injectable } from '@angular/core';

import * as TruffleContract from 'truffle-contract';
declare let web3: any;
declare let require: any;

let DelegatedWalletArtifact = require('../../../../../build/contracts/DelegatedWallet.json');
let DelegatedWalletFactoryArtifact = require('../../../../../build/contracts/DelegatedWalletFactory.json');
let DelegatedWalletManagerArtifact = require('../../../../../build/contracts/DelegatedWalletManager.json');

const DelegatedWalletFactory = TruffleContract(DelegatedWalletFactoryArtifact);
const DelegatedWalletManager = TruffleContract(DelegatedWalletManagerArtifact);

@Injectable({
  providedIn: 'root'
})
export class DelegatedWalletService {

	private ready: any;
	private factory: any;
	private manager: any;

	constructor() {
		DelegatedWalletManager.setProvider(web3.currentProvider);
		DelegatedWalletFactory.setProvider(web3.currentProvider);

		this.ready = Promise.all([
			DelegatedWalletFactory.deployed(),
			DelegatedWalletManager.deployed(),
		])
		.then(instances => {
			this.factory = new web3.eth.Contract(DelegatedWalletFactoryArtifact.abi, instances[0].address)
			this.manager = new web3.eth.Contract(DelegatedWalletManagerArtifact.abi, instances[1].address)
		})
		.catch(Promise.reject)
	}

	getWallets(account){
		return this.ready
		.then(() => {
			return this.manager.methods.getWallets(account).call()
		})
	}

	getWallet(walletAddress){
		return new web3.eth.Contract(DelegatedWalletArtifact.abi, walletAddress)
	}

	at(walletAddress){
		return new web3.eth.Contract(DelegatedWalletArtifact.abi, walletAddress)
	}

	getDelegates(walletAddress){
		return this.getWallet(walletAddress).methods.getDelegates().call();
	}

	createWallet(delegates, options){
		return this.manager.methods.createWallet(this.factory._address, delegates).send(options)
	}

	estimateGas(delegates, options){
		return this.ready
		.then(() => {
			return this.manager.methods.createWallet(this.factory._address, delegates).estimateGas(options)
		})
	}

}
