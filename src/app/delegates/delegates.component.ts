import { Component, OnInit } from '@angular/core';
import { Router, Event, NavigationStart, RoutesRecognized, RouteConfigLoadStart, RouteConfigLoadEnd,  NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { Web3Service } from '../web3/web3.service';
import * as TruffleContract from 'truffle-contract';

declare let require: any;

let DelegatedWalletArtifact = require('../../../build/contracts/DelegatedWallet.json');
let AddresssListArtifact = require('../../../build/contracts/AddressList.json');
const DelegatedWalletContract = TruffleContract(DelegatedWalletArtifact);
const AddressListContract = TruffleContract(AddresssListArtifact);

@Component({
  selector: 'app-delegates',
  templateUrl: './delegates.component.html',
  styleUrls: ['./delegates.component.css']
})
export class DelegatesComponent implements OnInit {

    private initialized = false;
    private web3;
    private currentAccount;
    private instance;
    private wallet = {
        address: null,
        delegates: []
    }

    constructor(
        private router: Router,
        private Web3: Web3Service
    ){
        this.web3 = Web3.instance();
        AddressListContract.setProvider(this.web3.currentProvider);
        DelegatedWalletContract.setProvider(this.web3.currentProvider);
    }

    ngOnInit() {
        var url = this.router.url;
        var options = url.split('/');
        this.wallet.address = options[3];

        DelegatedWalletContract.at(this.wallet.address)
        .then(instance => {
            this.instance = instance;
            this.wallet.address = instance.address;
            return this.instance.delegates();
        })
        .then(AddressListContract.at)
        .then(delegateList => delegateList.get())
        .then(paymentDelegates => {
            this.wallet.delegates = paymentDelegates;
            console.log(this.web3);
            return this.web3.getCurrentAccount;
        })
        .then(currentAccount => {
            
            this.currentAccount = currentAccount;
            
            this.initialized = true;
        })
        .catch(console.error)
    }

    getDelegateName(address){
        var name = localStorage.getItem(address+'.name');
        if(!name){
            if(this.web3.utils.toChecksumAddress(this.currentAccount) == this.web3.utils.toChecksumAddress(address))
                return 'You';
            else
                return "Unknown Delegate";
        }
        return name;
    }

}
