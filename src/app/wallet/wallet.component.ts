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
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit {

    private web3;
    private initialized;
    private instance;

    public wallet = {
        address: null,
    };

    public editWalletName = false;

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
            this.initialized = true;
        })
        .catch(console.error)

        this.router.events.subscribe( (event: Event) => {
            if (event instanceof NavigationStart) {
                // Navigation started.
                //console.log(event.url);
            } else if (event instanceof RoutesRecognized) { 
                // Router parses the URL and the routes are recognized.
            } else if (event instanceof RouteConfigLoadStart) {
                // Before the Router lazyloads a route configuration.
            } else if (event instanceof RouteConfigLoadEnd) { 
                // Route has been lazy loaded.
            } else if (event instanceof NavigationEnd) {
                // Navigation Ended Successfully.
                var options = event.url.split('/');
                this.wallet.address = options[3];
                this.editWalletName = false;
            } else if (event instanceof NavigationCancel) { 
                // Navigation is canceled as the Route-Guard returned false during navigation.
            } else if (event instanceof NavigationError) {
                // Navigation fails due to an unexpected error.
                console.log(event.error);
            }
        });
    }

    keyPress(event, name){
        if(event.keyCode == 13) {
            this.setWalletName(name);
        }
    }

    getWalletName(address){
        var length = address.length;
        var addressPrefix = address.slice(0,5);
        var addressSuffix = address.slice(length-3,length);

        var name = localStorage.getItem(address+'.name');
        if(!name)
            return "Unnamed Wallet " + addressPrefix + '...' + addressSuffix;
        return name;
    }

    setWalletName(name){
        if(name)
            localStorage.setItem(this.wallet.address + '.name', name);
        
        this.editWalletName = false;
    }

}
