import { Injectable } from '@angular/core';

declare let web3: any;
import { Web3Service } from '../../services/web3/web3.service';
import { WalletManagerService } from '../../services/wallet-manager/wallet-manager.service';
import { AlarmClockService } from '../../services/alarm-clock/alarm-clock.service';
import { PaymentDelegateService } from '../../services/payment-delegate/payment-delegate.service';
import { StorageService } from '../../services/storage/storage.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

    private readyPromise;
    private blockSubscription;

    address: string = null;
    contacts = [];
    wallets = [];
    balances = {};

    constructor(
        private Web3: Web3Service,
        private Storage: StorageService,
        private AlarmClock: AlarmClockService,
        private WalletManager: WalletManagerService,
        private PaymentDelegate: PaymentDelegateService,
    ){}

    ready(){
        return this.readyPromise;
    }

    set(userAddress){
        this.address = userAddress;
        this.Storage.set(userAddress, 'name', 'You')

        if(this.blockSubscription) 
            this.blockSubscription.unsubcribe(console.log)

        this.blockSubscription = web3.eth.subscribe('newBlockHeaders', (error, blockHash) => {
            if (!error && this.address){
                //console.log(blockHash);
                this.Web3.getBalance(this.address)
                .then(updatedBalance => {
                    this.balances = updatedBalance;
                    this.balances['usd'] = updatedBalance.ether * this.PaymentDelegate.ethPriceInUsd;
                })
            }
        });

        this.readyPromise = Promise.all([
            this.Web3.getBalance(userAddress),
            this.WalletManager.getWallets(userAddress),
            this.PaymentDelegate.ready(),
        ])
        .then(promises => {
            var balancesObject = promises[0];
            var walletAddressArray = promises[1];

            this.balances = balancesObject;
            this.balances['usd'] = balancesObject.ether * this.PaymentDelegate.ethPriceInUsd;
            this.wallets = walletAddressArray;
            this.contacts = this.getContactList();

            var walletPromises = [];
            for (var i = 0; i < this.wallets.length; i++) {
                walletPromises.push(this.WalletManager.watch(this.wallets[i]));
            }

            return Promise.all(walletPromises);
        })
        .catch(err => {
            console.error(err)
        })

        return this.readyPromise;
    }

    addContact(contactAddress, contactName){
        if(!this.contacts.includes(contactAddress)){
            this.contacts.push(contactAddress);
            this.saveContactList(this.contacts);
        }
        
        this.updateContact(contactAddress, contactName);
    }

    getContactList(){
        var contacts = JSON.parse(localStorage.getItem(this.address + ".contacts"));
        if(!contacts) {
            contacts = [];
            this.saveContactList(contacts);
        }

        return contacts;
    }

    saveContactList(contacts){
        localStorage.setItem(this.address + ".contacts", JSON.stringify(contacts));
    }

    contact(contactAddress){
        return localStorage.getItem(this.address + '.' + contactAddress + ".name");
    }

    updateContact(contactAddress, contactName){
        localStorage.setItem(this.address + '.' + contactAddress + ".name", contactName);
    }

    removeContact(contactAddress){
        for (var i = this.contacts.length - 1; i >= 0; i--) {
            if(this.contacts[i] == contactAddress){
                console.log("removing contactAddress")
                var removed = this.contacts.splice(i,1)
                console.log(this.contacts);
                console.log(removed);
                this.saveContactList(this.contacts)
            }
        }
    }

}
