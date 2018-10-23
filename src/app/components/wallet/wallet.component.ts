import { Component, OnInit } from '@angular/core';
import { Router, Event, NavigationStart, RoutesRecognized, RouteConfigLoadStart, RouteConfigLoadEnd,  NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { NameService } from 'src/app/services/name/name.service';
import { WalletService } from 'src/app/services/wallet/wallet.service';
import { Web3Service } from '../../services/web3/web3.service';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit {

    private web3;
    private wallet;
    private initialized;

    private editWalletName: boolean;

    constructor(
        private router: Router,
        private NameService: NameService,
        private WalletService: WalletService,
        private Web3Service: Web3Service,
    ){}

    ngOnInit() {
        this.Web3Service.getWeb3Instance()
        .then(web3 => {
            this.web3 = web3;
            
            var walletAddress = this.router.url.split('/')[4];
            this.wallet = this.WalletService.getWallet(walletAddress);
            this.wallet['name'] = this.NameService.getName(walletAddress);
            this.wallet['address'] = this.wallet._address;
            this.initialized = true;
        });

        this.router.events.subscribe( (event: Event) => {
            if (event instanceof NavigationStart) {
                // Navigation started.
            } else if (event instanceof RoutesRecognized) { 
                // Router parses the URL and the routes are recognized.
            } else if (event instanceof RouteConfigLoadStart) {
                // Before the Router lazyloads a route configuration.
            } else if (event instanceof RouteConfigLoadEnd) { 
                // Route has been lazy loaded.
            } else if (event instanceof NavigationEnd) {
                // Navigation Ended Successfully.
                var walletAddress = this.router.url.split('/')[4];
                this.wallet = this.WalletService.getWallet(walletAddress);
                this.wallet['name'] = this.NameService.getName(walletAddress);
                this.wallet['address'] = this.wallet._address;
                this.editWalletName = false;
            } else if (event instanceof NavigationCancel) { 
                // Navigation is canceled as the Route-Guard returned false during navigation.
            } else if (event instanceof NavigationError) {
                // Navigation fails due to an unexpected error.
                console.error(event.error);
            }
        });
    }

    keyPress(event, name){
        if(event.keyCode == 13) {
            this.NameService.setName(this.wallet.address, name)
            this.editWalletName = false;
        }
    }

}
