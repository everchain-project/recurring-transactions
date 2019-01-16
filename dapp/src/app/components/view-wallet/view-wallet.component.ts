import { Component, OnInit, NgZone } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from "@angular/router";

declare let web3: any;
import { Web3Service } from '../../services/web3/web3.service';
import { PaymentDelegateService } from '../../services/payment-delegate/payment-delegate.service';
import { AlarmClockService } from '../../services/alarm-clock/alarm-clock.service';
import { DelegatedWalletService } from '../../services/delegated-wallet/delegated-wallet.service';

@Component({
  selector: 'app-view-wallet',
  templateUrl: './view-wallet.component.html',
  styleUrls: ['./view-wallet.component.css']
})
export class ViewWalletComponent implements OnInit {

	initialized: boolean = false;
	routeListener: any;
	currentView: string;
	currentAccount: string;
	currentBalance;

	walletAddress: string;
	Wallet: any;
	alarmClocks = [];
	delegates = [];

	selectedDelegate: string = 'centralized';
    gasPriceOracle: string = 'centralized';
    currentEtherPrice = 100;

    newDelegateAddress;
    subscription;
    events;
    paymentSubscription;

    toAddress;
    transferAmount;

	constructor(
		private router: Router,
		private ngZone: NgZone,
		private Web3: Web3Service,
		private PaymentDelegate: PaymentDelegateService,
		private AlarmClock: AlarmClockService,
		private WalletService: DelegatedWalletService,
	) { }

	ngOnInit() {
		this.init();

        this.routeListener = this.router.events.forEach((event) => {
            if(event instanceof NavigationStart) {
                for (var i = this.alarmClocks.length - 1; i >= 0; i--) {
                	this.alarmClocks[i].subscription.unsubscribe((err, success) => {
                		//console.log(err,success)
                	})
                }
            }
            if(event instanceof NavigationEnd) {
            	this.init();
            }
            // NavigationCancel
            // NavigationError
            // RoutesRecognized
        });
	}

	init(){
		var route = this.router.url.split('/');
		this.walletAddress = route[2];
		this.currentView = route[3];

		this.Web3.getCurrentAccount()
		.then(currentAccount => {
			this.currentAccount = currentAccount;
			return this.Web3.getBalance(currentAccount)
		})
		.then(currentBalance => {
			this.currentBalance = currentBalance;
		})

		this.PaymentDelegate.getInstance()
		.then(instance => {
			//console.log("PD: ", instance._address)
			this.paymentSubscription = instance.events.Schedule_event({wallet: this.walletAddress}, 
			(err, event) => {
				console.log(err, event);
				this.ngZone.run(() => {
    				this.init()
    			})
			})
		})

		this.AlarmClock.ready.then(() => {
			//console.log("WIZ: ", this.AlarmClock.wizard._address)
		})

		// These should all be seperate routes at some point
		if(this.currentView == 'transfer'){
			this.Wallet = this.WalletService.getWallet(this.walletAddress);
		}
		if(this.currentView == 'delegates'){
			this.Wallet = this.WalletService.getWallet(this.walletAddress);
			this.Wallet.methods.getDelegates().call()
			.then(delegates => {
				this.delegates = delegates;
			})
		}
		else if(this.currentView == 'alarm-clocks'){
			this.PaymentDelegate.getPayments('outgoing', this.walletAddress)
	        .then(payments => {
	            //console.log(payments);
	            var alarmClocks = [];
	            for (var i = payments.length - 1; i >= 0; i--) {
	            	alarmClocks.push(this.AlarmClock.at(payments[i])); 
	            }

	            return Promise.all(alarmClocks)
	        })
	        .then(alarmClocks => {
	            this.alarmClocks = alarmClocks;
	            for (var i = this.alarmClocks.length - 1; i >= 0; i--) {
		            this.watchAlarmClocksForChanges(this.alarmClocks[i], i)
		        }
			})
        } else {
        	//this.router.navigate([''])
        }
	}

	watchAlarmClocksForChanges(alarmClock, i){
		var subscription = this.alarmClocks[i].instance.events.allEvents(null, (err, event) => {
    		//console.log(err, event);
    		this.AlarmClock.at(this.alarmClocks[i].instance._address)
    		.then(alarmClock => {
    			this.ngZone.run(() => {
    				this.alarmClocks[i] = alarmClock;
    				this.alarmClocks[i]['subscription'] = subscription;
    			})
    		})
    	});

    	this.alarmClocks[i]['subscription'] = subscription;
	}

	addDelegate(){
		if(!this.newDelegateAddress) return false;
		
		this.Wallet.methods.addDelegate(this.newDelegateAddress).send({
			from: this.currentAccount
		})
		.on('transactionHash', txHash => {
            console.log(txHash)
        })
        .on('confirmation', (confirmations, txReceipt) => {
            if(confirmations == 0)
                console.log(txReceipt);
        })
	}

	removeDelegate(delegateAddress){
		if(!delegateAddress) return false;
		
		this.Wallet.methods.removeDelegate(delegateAddress).send({
			from: this.currentAccount
		})
		.on('transactionHash', txHash => {
            console.log(txHash)
        })
        .on('confirmation', (confirmations, txReceipt) => {
            if(confirmations == 0)
                console.log(txReceipt);
        })
	}

	getName(id){
		var name = localStorage.getItem(id + '.name');
		if(!name) return "Unknown Delegate";
        return name;
    }

    max(){
    	this.Web3.getBalance(this.Wallet._address)
    	.then(maxAmount => {
    		this.transferAmount = maxAmount.ether;
    	})
    }

    valid(){
    	if(web3.utils.isAddress(this.toAddress) && this.transferAmount > 0)
    		return true;

    	return false;
    }

    transfer(){
    	console.log(this.toAddress, this.transferAmount)
    	this.Wallet.methods.transfer(
    		web3.utils.nullAddress, // ether
    		this.toAddress,
    		web3.utils.toWei(this.transferAmount.toString(),"ether")
    	)
    	.send({
    		from: this.currentAccount
    	})
    	.on('transactionHash', txHash => {
    		console.log(txHash)
    	})
    }

}
