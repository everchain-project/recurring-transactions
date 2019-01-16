import { Injectable } from '@angular/core';
import * as TruffleContract from 'truffle-contract';

declare let web3: any;
declare let require: any;
import { PaymentDelegateService } from '../payment-delegate/payment-delegate.service';

let IPayment = require('../../../../../build/contracts/IPayment.json');
let GasPriceOracleArtifact = require('../../../../../build/contracts/GasPriceOracle.json');
let ExampleTaskArtifact = require('../../../../../build/contracts/ExampleTask.json');
let RecurringAlarmClockArtifact = require('../../../../../build/contracts/RecurringAlarmClock.json');
let RecurringAlarmClockFactoryArtifact = require('../../../../../build/contracts/RecurringAlarmClockFactory.json');
let RecurringAlarmClockWizardArtifact = require('../../../../../build/contracts/RecurringAlarmClockWizard.json');
let TransactionRequestInterface = require('../../../../../build/contracts/TransactionRequestInterface.json');

const ExampleTask = TruffleContract(ExampleTaskArtifact);
const GasPriceOracle = TruffleContract(GasPriceOracleArtifact);
const RecurringAlarmClock = TruffleContract(RecurringAlarmClockArtifact);
const RecurringAlarmClockFactory = TruffleContract(RecurringAlarmClockFactoryArtifact);
const RecurringAlarmClockWizard = TruffleContract(RecurringAlarmClockWizardArtifact);

@Injectable({
  providedIn: 'root'
})
export class AlarmClockService {

	public ready;

	public factory: any;
	public wizard: any;
	public example: any;
	public oracle: any;

	constructor(
		private PaymentDelegate: PaymentDelegateService,
	) { 
		RecurringAlarmClockFactory.setProvider(web3.currentProvider);
		RecurringAlarmClockWizard.setProvider(web3.currentProvider);
		ExampleTask.setProvider(web3.currentProvider);
		GasPriceOracle.setProvider(web3.currentProvider);

		this.ready = Promise.all([
			RecurringAlarmClockFactory.deployed(),
			RecurringAlarmClockWizard.deployed(),
			ExampleTask.deployed(),
			GasPriceOracle.deployed(),
		])
		.then(instances => {
			this.factory = new web3.eth.Contract(RecurringAlarmClockFactoryArtifact.abi, instances[0].address)
			this.wizard = new web3.eth.Contract(RecurringAlarmClockWizardArtifact.abi, instances[1].address)
			this.example = new web3.eth.Contract(ExampleTaskArtifact.abi, instances[2].address);
			this.oracle = new web3.eth.Contract(GasPriceOracleArtifact.abi, instances[3].address);

			localStorage.setItem(this.wizard._address + ".name", "Alarm Clock Wizard");

			console.log(this.wizard)
		})
		.catch(Promise.reject)
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

		return this.wizard.methods.createAndStartAlarmClock(
			wallet,
			delegate,
			callAddress,
			callData,
			callOptions
		)
		.send(txOptions)
	}

	at(address){
		var AlarmClock = new web3.eth.Contract(RecurringAlarmClockArtifact.abi, address);
		return AlarmClock.methods.alarm().call()
		.then(alarmAddress => {
			var TxRequest = new web3.eth.Contract(TransactionRequestInterface.abi, alarmAddress);
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

			if(alarmAddress != web3.utils.nullAddress){
				promises.push(TxRequest.methods.requestData().call())
				promises.push(web3.eth.getBalance(TxRequest._address))
			}

			return Promise.all(promises)
			.then(promises => {
				var alarmStart = promises[0];
				var unitValue = promises[1];
				var unitText = this.getUnitText(promises[2]);
				var totalSeconds = unitValue * this.getUnitWeight(unitText);
				var baseGas = Number(promises[5]);
				var callGas = Number(promises[6]);
				var gasPrice = promises[7];

				var oneDay = 60*60*24;
				var multiplier = null;
				var interval = Math.round(totalSeconds/oneDay);

				if(interval > 365)
		            multiplier = 10;
		        else if(interval > 90)
		            multiplier = 10;
		        else if (interval > 30)
		            multiplier = 3;
		        else if (interval > 7)
		            multiplier = 2;
		        else if (interval > 1)
		            multiplier = 1.5;
		        else if (interval > 0)
		            multiplier = 1.2;
		        else
		            multiplier = 1.1;

				var nextCostWei = Math.round((baseGas + callGas) * gasPrice * multiplier);
				var nextCostEther = Number(web3.utils.fromWei(nextCostWei.toString(), 'ether'));
				var nextCostUsd = Number(nextCostEther * this.PaymentDelegate.ethPriceInUsd);
				var realCostWei = Math.round((baseGas + callGas) * gasPrice);
				var realCostEther = Number(web3.utils.fromWei(realCostWei.toString(), 'ether'));
				var realCostUsd = Number(realCostEther * this.PaymentDelegate.ethPriceInUsd);

				var alarm = {
					active: false,
					failed: false,
					cancelled: false,
					data: null,
					balance: null,
					percentFunded: null,
					instance: null,
				};

				if(alarmAddress != web3.utils.nullAddress){
					var requestData = promises[8];
					var alarmBalance = promises[9];
					var etherBalance = Number(web3.utils.fromWei(alarmBalance.toString(), 'ether'));
					var usdBalance = Number(etherBalance * this.PaymentDelegate.ethPriceInUsd);
					var percentFunded = Math.round(etherBalance/realCostEther*100);

					var isCancelled = requestData[1][0];
					var wasCalled = requestData[1][1];
					var wasSuccessful = requestData[1][2];
					var windowSize = requestData[2][8];
					var hasNotBeenCalled = !requestData[1][1];
					var now = Math.round(new Date().getTime()/1000);
					var timestampExpired = Number(alarmStart) + Number(windowSize);
					var alarmIsExpired =  timestampExpired < now;

					alarm = {
						active: (!wasCalled && !alarmIsExpired),
						failed: alarmIsExpired || (wasCalled && !wasSuccessful),
						cancelled: isCancelled,
						data: requestData,
						balance: {
							wei: alarmBalance,
							ether: etherBalance,
							usd: usdBalance,
						},
						percentFunded: percentFunded,
						instance: TxRequest,
					}
				}

				return {
					label: this.getLabel(AlarmClock._address),
					timestamp: alarmStart,
					interval: {
						value: promises[1],
						unit: unitText,
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
				}
			})
		})
		.catch(err => {
			console.error(err)
		})
	}

	getLabel(alarmClockAddress){
		var label = localStorage.getItem(alarmClockAddress + '.label');
		if(!label) label = 'No Label Set';
		return label;
	}

	getUnitText(unit){
			 if(unit == 0) return 'seconds';
		else if(unit == 1) return 'minutes';
		else if(unit == 2) return 'hours';
		else if(unit == 3) return 'days';
		else if(unit == 4) return 'months';
		else if(unit == 5) return 'years';
		else 			   return null;
	}

	getUnitWeight(unitText){
			 if(unitText == 'seconds') 	return 1;
		else if(unitText == 'minutes') 	return 60;
		else if(unitText == 'hours') 	return 60*60;
		else if(unitText == 'days') 	return 60*60*24;
		else if(unitText == 'months') 	return 60*60*24*30;
		else if(unitText == 'years') 	return 60*60*24*365;
		else 			   				return null;
	}

}
