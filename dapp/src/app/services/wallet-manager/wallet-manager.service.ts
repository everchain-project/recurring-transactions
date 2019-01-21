import { Injectable } from '@angular/core';
import * as TruffleContract from 'truffle-contract';

declare let web3: any;
declare let require: any;
import { Web3Service } from '../../services/web3/web3.service';
import { StorageService } from '../../services/storage/storage.service';
import { PaymentDelegateService } from '../payment-delegate/payment-delegate.service';
import { AlarmClockService } from '../../services/alarm-clock/alarm-clock.service';

let DelegatedWalletArtifact = require('../../../../../build/contracts/DelegatedWallet.json');
let DelegatedWalletFactoryArtifact = require('../../../../../build/contracts/DelegatedWalletFactory.json');
let DelegatedWalletManagerArtifact = require('../../../../../build/contracts/DelegatedWalletManager.json');

const DelegatedWalletFactory = TruffleContract(DelegatedWalletFactoryArtifact);
const DelegatedWalletManager = TruffleContract(DelegatedWalletManagerArtifact);

@Injectable({
  providedIn: 'root'
})
export class WalletManagerService {

	private ready: any;
	private factory: any;
	private manager: any;

	public walletList = [];
	public wallets = {};

	constructor(
		private Web3: Web3Service,
		private Storage: StorageService,
		private AlarmClockManager: AlarmClockService,
		private PaymentDelegate: PaymentDelegateService,
	) {
		this.Web3.ready().then(() => {
			DelegatedWalletManager.setProvider(web3.currentProvider);
			DelegatedWalletFactory.setProvider(web3.currentProvider);

			this.ready = Promise.all([
				DelegatedWalletFactory.deployed(),
				DelegatedWalletManager.deployed(),
				this.PaymentDelegate.ready()
			])
			.then(instances => {
				this.factory = new web3.eth.Contract(DelegatedWalletFactoryArtifact.abi, instances[0].address)
				this.manager = new web3.eth.Contract(DelegatedWalletManagerArtifact.abi, instances[1].address)
			})
			.catch(Promise.reject)	
		})
	}

	watch(walletAddress){
		if(this.wallets[walletAddress]) return this.wallets[walletAddress].ready();

		var wallet = new web3.eth.Contract(DelegatedWalletArtifact.abi, walletAddress);

		var walletPromise = this.AlarmClockManager.ready()
		.then(() => {
			return Promise.all([
				this.Web3.getBalance(walletAddress),
				this.PaymentDelegate.getPayments('outgoing', walletAddress, this.AlarmClockManager.factory._address),
				wallet.methods.getDelegates().call(),
				web3.eth.getBalance(walletAddress)
			])
		})
		.then(promises => {
			var balanceObject = promises[0];
			var alarmClocks = promises[1];
			var delegates = promises[2];
			var weiBalance = promises[3];
			var etherBalance = Number(web3.utils.fromWei(weiBalance, 'ether'));
            var usdBalance = etherBalance * this.PaymentDelegate.ethPriceInUsd;

			for (var i = alarmClocks.length - 1; i >= 0; i--) {
				this.AlarmClockManager.watch(alarmClocks[i]);
			}
			
			wallet['address'] = walletAddress;
			wallet['name'] = this.Storage.get(walletAddress,"name");
			wallet['balance'] = balanceObject;
			wallet['alarmClocks'] = alarmClocks;
			wallet['delegates'] = delegates;
			wallet['balance']= {
                wei: weiBalance,
                ether: etherBalance,
                usd: usdBalance,
            };
			wallet['subscription'] = wallet.events.allEvents(null, (err, event) => {
				//console.log(err, event);
				this.updateWalletBalance(walletAddress)
			});
			
			this.wallets[walletAddress] = wallet;
		})

		wallet['ready'] = function(){
			return walletPromise;
		};

		return walletPromise;
	}

	getWallet(){

	}

	getWallets(account){
		return this.ready
		.then(() => {
			return this.manager.methods.getWallets(account).call()
			.then(walletList => {
				this.walletList = walletList;

				return this.walletList;
			})
		})
	}

	updateWalletBalance(walletAddress){
		web3.eth.getBalance(walletAddress)
        .then(weiBalance => {
            var etherBalance = Number(web3.utils.fromWei(weiBalance, 'ether'));
            var usdBalance = etherBalance * this.PaymentDelegate.ethPriceInUsd;

            this.wallets[walletAddress].balance = {
                wei: weiBalance,
                ether: etherBalance,
                usd: usdBalance,
            }
        })
        .catch(err => {
            console.error(err)
        })
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
