import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from "@angular/platform-browser";
import { Router, NavigationEnd } from "@angular/router";

import { Web3Service } from './services/web3/web3.service';
import { WalletService } from './services/wallet/wallet.service';
import { RtxService } from './services/rtx/rtx.service';
import { PaymentService } from './services/payment/payment.service';
import { ContactService } from './services/contact/contact.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

    constructor(
        private matIconRegistry: MatIconRegistry,
        private domSanitizer: DomSanitizer,
        private router: Router,
        private Web3: Web3Service,
        private Wallets: WalletService,
        private RTx: RtxService,
        private Payments: PaymentService,
    ){}

    ngOnInit() {
        this.Web3.ready()
        .then(() => {
            if(this.Web3.netId != 42) 
                return Promise.reject(new Error("Wrong network detected... Switch to the Kovan Testnet!"));
            else {
                return Promise.all([
                    this.RTx.ready(),
                    this.Payments.ready(),
                    this.Wallets.ready(),
                ])
            }
        })
        .then(() => {
            this.watchPayments();
            this.Wallets.addVettedDelegate(this.Payments.instance._address);
            this.Wallets.addVettedDelegate(this.RTx.factory._address);
            this.Wallets.addVettedDelegate(this.RTx.deployer._address);
            this.Payments.factories.push(this.RTx.factory._address);

            if(this.Web3.signedIn){
                localStorage.setItem(this.Web3.account.address + '.name', 'You');
                this.Wallets.watch(this.Web3.account.address);
            }

            this.router.events.forEach((event) => {
                if(event instanceof NavigationEnd) {
                    this.watchPayments();
                }
            });
        })
        .catch(err => {
            console.error(err);
        })

        // Add custom icons
        this.matIconRegistry.addSvgIcon("ether", this.domSanitizer.bypassSecurityTrustResourceUrl("./assets/ethereum-logo.svg"));
        this.matIconRegistry.addSvgIcon("qrcode", this.domSanitizer.bypassSecurityTrustResourceUrl("./assets/qrcode.svg"));
    }
    
    watchPayments(){
        var option = this.router.url.split('/');
        var currentWallet = option[2];
        this.Wallets.current = currentWallet;
        
        if(currentWallet){
            this.Payments.subscribe(currentWallet)
            .then(payments => {
                
            });
        }
    }

}
