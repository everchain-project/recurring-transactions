import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";

import { Web3Service } from '../../services/web3/web3.service';
import { WalletService } from '../../services/wallet/wallet.service';
import { PaymentService } from '../../services/payment/payment.service';
import { RtxService } from '../../services/rtx/rtx.service';

@Component({
  selector: 'app-delegates',
  templateUrl: './delegates.component.html',
  styleUrls: ['./delegates.component.css']
})
export class DelegatesComponent implements OnInit {

    currentWallet: string;
    newDelegateAddress: string;
    newDelegateName: string;
    showAddDelegatePanel: boolean;
    
    constructor(
        private router: Router,
        public Web3: Web3Service,
        public Wallets: WalletService,
        public Payments: PaymentService,
        public RTx: RtxService,
    ){}

    ngOnInit() {
        var option = this.router.url.split('/');
        this.currentWallet = option[2];
        this.Wallets.update(this.currentWallet);
    }

    toggleDelegate(delegate){
        if(this.Wallets.wallets[this.currentWallet].delegates.includes(delegate)){
            this.removeDelegate(delegate)
        }
        else {
            this.addDelegate(delegate, null)
        }
    }

    addDelegate(delegateAddress, delegateName){
        if(!delegateAddress) return;
        
        this.Web3.getCurrentAccount()
        .then(currentAccount => {
            this.Wallets.wallets[this.currentWallet].instance.methods.addDelegate(delegateAddress).send({
                from: currentAccount
            })
            .on('transactionHash', txHash => {
                //console.log(txHash)
            })
            .on('confirmation', (confirmations, txReceipt) => {
                if(confirmations == 0){
                    //console.log(txReceipt);
                    var newDelegate = txReceipt.events.AddDelegate_event.returnValues.delegate;
                    if(delegateName) localStorage.setItem(newDelegate + '.name', delegateName);
                    this.Wallets.wallets[this.currentWallet].delegates.push(newDelegate);
                    this.Wallets.update(this.currentWallet);
                    //console.log('added delegate',newDelegate);
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
            this.Wallets.wallets[this.currentWallet].instance.methods.removeDelegate(delegateAddress).send({
                from: currentAccount
            })
            .on('transactionHash', txHash => {
                //console.log(txHash)
            })
            .on('confirmation', (confirmations, txReceipt) => {
                if(confirmations == 0){
                    //console.log(txReceipt);
                    var removedDelegate = txReceipt.events.RemoveDelegate_event.returnValues.delegate;
                    var index = this.Wallets.wallets[this.currentWallet].delegates.indexOf(removedDelegate);
                    this.Wallets.wallets[this.currentWallet].delegates.splice(index,1);
                    this.Wallets.update(this.currentWallet);
                    //console.log('removed delegate',removedDelegate);
                }
            })
            .catch(err => {
                console.error(err)
            })
        })
    }

    getName(delegate){
        return localStorage.getItem(delegate + '.name');
    }

}
