import { Component, OnInit, NgZone } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from "@angular/router";
import { MatIconRegistry, MatSnackBar, MatDialog } from '@angular/material';
import { DomSanitizer } from "@angular/platform-browser";

declare let web3: any;
import { Web3Service } from './services/web3/web3.service';
import { AlarmClockService } from './services/alarm-clock/alarm-clock.service';
import { DelegatedWalletService } from './services/delegated-wallet/delegated-wallet.service';
import { PaymentDelegateService } from './services/payment-delegate/payment-delegate.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

    initialized: boolean = false;
    currentView: string;
    currentRoute: string;
    currentWallet: string;    
    
    currentAccount;
    currentBalance;
    walletAddresses;
    exampleEventSubscription;
    paymentDelegateSubscription;
    walletBalanceSubscription;
    currentWalletName: string;
    newWalletName: string;
    editWalletName: boolean = false;

    constructor(
        private matIconRegistry: MatIconRegistry,
        private domSanitizer: DomSanitizer,
        private router: Router,
        private ngZone: NgZone,
        private snackbar: MatSnackBar,
        private dialog: MatDialog,
        private Web3: Web3Service,
        private AlarmClock: AlarmClockService,
        private WalletService: DelegatedWalletService,
        private PaymentDelegate: PaymentDelegateService,
    ){
        
    }

    ngOnInit() {
        this.router.events.forEach((event) => {
            if(event instanceof NavigationStart) {
                this.currentWallet = null;
                this.editWalletName = false;

                if(this.exampleEventSubscription) {
                    this.exampleEventSubscription.unsubscribe((err, success) => {
                        //console.log(err, success)
                    })
                }

                if(this.paymentDelegateSubscription) {
                    this.paymentDelegateSubscription.unsubscribe((err, success) => {
                        //console.log(err, success)
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

        // Add custom icons
        this.matIconRegistry.addSvgIcon("ether", this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/ethereum-logo.svg"));
        this.matIconRegistry.addSvgIcon("qrcode", this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/qrcode.svg"));
    }

    init(){
        var option = this.router.url.split('/');
        this.currentWallet = option[2];
        this.currentRoute = '/' + option[1] + '/' + option[2];
        this.currentView = option[3];

        this.PaymentDelegate.getInstance()
        .then(instance => {
            this.paymentDelegateSubscription = instance.events.allEvents({
                filter: {wallet: this.currentWallet}
            }, (err, event) => {
                console.log(err, event);
                this.init()
            })
        })
        
        this.initialized = true;
    }

}
