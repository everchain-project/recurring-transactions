import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from "@angular/router";

import { Web3Service } from '../../services/web3/web3.service';
import { WalletManagerService } from '../../services/wallet-manager/wallet-manager.service';
import { StorageService } from '../../services/storage/storage.service';
import { AlarmClockService } from '../../services/alarm-clock/alarm-clock.service';
import { PaymentDelegateService } from '../../services/payment-delegate/payment-delegate.service';

@Component({
  selector: 'app-view-wallet-delegates',
  templateUrl: './view-wallet-delegates.component.html',
  styleUrls: ['./view-wallet-delegates.component.css']
})
export class ViewWalletDelegatesComponent implements OnInit {

    Wallet;
    currentWallet: string;
    newDelegateAddress;
    newDelegateName;
    vettedDelegates = [];
    initialized;

	constructor(
        private router: Router,
        private ngZone: NgZone,
		private WalletManager: WalletManagerService,
        public Storage: StorageService,
        private Web3: Web3Service,
        private AlarmClockManager: AlarmClockService,
        private PaymentDelegate: PaymentDelegateService,
	){}

	ngOnInit() {
		var option = this.router.url.split('/');
		this.currentWallet = option[2];
        this.WalletManager.watch(this.currentWallet)
        .then(() => {
            this.Wallet = this.WalletManager.wallets[this.currentWallet];
            this.init();
        })

	}

    init(){
        var delegates = this.WalletManager.wallets[this.currentWallet].delegates;
        this.vettedDelegates = [];

        var deployer = this.AlarmClockManager.deployer._address;
        this.vettedDelegates.push({
            address: deployer,
            name: this.Storage.get(deployer,"name"),
            isDelegate: delegates.includes(deployer)
        })

        var paymentDelegate = this.PaymentDelegate.instance._address;
        this.vettedDelegates.push({
            address: paymentDelegate,
            name: this.Storage.get(paymentDelegate,"name"),
            isDelegate: delegates.includes(paymentDelegate)
        })

        this.initialized = true;
    }

    toggleDelegate(delegate){
        console.log(delegate);
        if(!delegate.isDelegate){
            this.removeDelegate(delegate.address)
        }
        else {
            this.addDelegate(delegate.address, null)
        }
    }

	addDelegate(delegateAddress, delegateName){
        if(!delegateAddress) return;
        
        this.Web3.getCurrentAccount()
        .then(currentAccount => {
            this.Wallet.methods.addDelegate(delegateAddress).send({
                from: currentAccount
            })
            .on('transactionHash', txHash => {
                console.log(txHash)
            })
            .on('confirmation', (confirmations, txReceipt) => {
                if(confirmations == 0){
                    console.log(txReceipt);
                    var newDelegate = txReceipt.events.AddDelegate_event.returnValues.delegate;
                    if(delegateName) this.Storage.set(newDelegate,'name',delegateName);
                    this.ngZone.run(() => {
                        this.Wallet.delegates.push(newDelegate)
                        this.init();
                    })
                }
            }) 
            .catch(err => {
                console.log(err)
            }) 
        })
    }

    removeDelegate(delegateAddress){
        if(!delegateAddress) return;
        
        this.Web3.getCurrentAccount()
        .then(currentAccount => {
            this.Wallet.methods.removeDelegate(delegateAddress).send({
                from: currentAccount
            })
            .on('transactionHash', txHash => {
                console.log(txHash)
            })
            .on('confirmation', (confirmations, txReceipt) => {
                if(confirmations == 0){
                    console.log(txReceipt);
                    var removedDelegate = txReceipt.events.RemoveDelegate_event.returnValues.delegate;
                    var index = this.Wallet.delegates.indexOf(removedDelegate)
                    this.ngZone.run(() => {
                        this.Wallet.delegates.splice(index,1);
                        this.init();
                    })
                }
            })
            .catch(err => {
                console.log(err)
            })
        })
    }

}
