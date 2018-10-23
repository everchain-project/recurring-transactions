import { Component, OnInit } from '@angular/core';
import { Router, Event, NavigationStart, RoutesRecognized, RouteConfigLoadStart, RouteConfigLoadEnd,  NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { Web3Service } from '../../services/web3/web3.service';

@Component({
  selector: 'app-token',
  templateUrl: './token.component.html',
  styleUrls: ['./token.component.css']
})
export class TokenComponent implements OnInit {

    private web3;
    public ETHER;

    private wallet = {
        address: null,
        subscription: null,
    }

    private initialized = false;

    private tokens = ['0x0000000000000000000000000000000000000000', '0xA', '0xB', '0xC', '0xD', '0xE', '0xF', '0xG'];
    private tokenData = {
        '0x0000000000000000000000000000000000000000': {name: 'Ether'  , address: '0x0000000000000000000000000000000000000000', balance: 0},
        '0xA': {name: 'Token A', address: '0xA', balance: 0},
        '0xB': {name: 'Token B', address: '0xB', balance: 0},
        '0xC': {name: 'Token C', address: '0xC', balance: 0},
        '0xD': {name: 'Token D', address: '0xD', balance: 0},
        '0xE': {name: 'Token E', address: '0xE', balance: 0},
        '0xF': {name: 'Token F', address: '0xF', balance: 0},
        '0xG': {name: 'Token G', address: '0xG', balance: 0},
    };

    constructor(
        private router: Router,
        private Web3Service: Web3Service
    ){}

    ngOnInit() {
        this.Web3Service.getWeb3Instance()
        .then(web3 => {
            this.web3 = web3;
            this.ETHER = this.web3.emptyAddress;
            var url = this.router.url;
            var options = url.split('/');
            this.wallet.address = options[4];

            this.updateWalletBalances();
            
            if(this.wallet.subscription){
                this.wallet.subscription.unsubscribe((err, success) => {
                    //console.log(err, success);
                })
            }

            this.wallet.subscription = this.web3.eth.subscribe('logs', {address: this.wallet.address},(err, result) => {
                //console.log(err, result)
                this.updateWalletBalances();
            })

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
                    this.wallet.address = options[4];
                    if(this.wallet.address)
                        this.updateWalletBalances();
                    
                    if(this.wallet.subscription){
                        this.wallet.subscription.unsubscribe((err, success) => {
                            //console.log(err, success);
                        })
                    }
        
                    this.wallet.subscription = this.web3.eth.subscribe('logs', {address: this.wallet.address},(err, result) => {
                        //console.log(err, result)
                        this.updateWalletBalances();
                    })
                } else if (event instanceof NavigationCancel) { 
                    // Navigation is canceled as the Route-Guard returned false during navigation.
                } else if (event instanceof NavigationError) {
                    // Navigation fails due to an unexpected error.
                    console.log(event.error);
                }
            });
        })
    }

    updateWalletBalances(){
        this.web3.eth.getBalance(this.wallet.address)
        .then(etherBalance => {
            this.tokenData[this.ETHER].balance = this.web3.utils.fromWei(etherBalance, 'ether');
            this.initialized = true;
        })
    }

}
