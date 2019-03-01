import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from "@angular/router";
import { MatDialog } from '@angular/material';

import { Web3Service } from '../../services/web3/web3.service';
import { WalletService } from '../../services/wallet/wallet.service';
import { PaymentService } from '../../services/payment/payment.service';
import { RtxService } from '../../services/rtx/rtx.service';

import { QrcodeDialog } from '../../dialogs/qrcode/qrcode.component';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit {

    currentWallet;
    currentRoute;
    currentView;

    newWalletName: string;
    editWalletName: boolean = false;
    
    constructor(
        private router: Router,
        private dialog: MatDialog,
        public Web3: Web3Service,
        public Wallets: WalletService,
        public Payments: PaymentService,
        public RTx: RtxService,
    ){}

    ngOnInit() {
        
        this.Web3.ready()
        .then(() => {
            if(this.Web3.netId == 42){
                return this.Wallets.ready()
                .then(() => {
                    this.parseRoute();
                })
            }
        })
        .catch(err => {
            console.error(err);
        })

        this.router.events.forEach((event) => {
            if(event instanceof NavigationEnd) {
                this.parseRoute();
            }
        });
    }

    parseRoute(){
        var option = this.router.url.split('/');
        this.currentWallet = option[2];
        this.currentRoute = '/' + option[1] + '/' + option[2];
        this.currentView = option[3];

        if(this.Web3.netId == 42 && this.currentWallet){
            this.Wallets.update(this.currentWallet);
            this.newWalletName = this.Wallets.wallets[this.currentWallet].name;
        }
    }

    createWallet(){
        this.Wallets.create()
        .then(() => {
            this.parseRoute()
        })
    }

    showQRCode(){
        const dialogRef = this.dialog.open(QrcodeDialog, {
            width: '304px',
            data: this.currentWallet
        });
    }

    routeTo(view){
        this.router.navigate([view]);
    }

    signIn(){
        this.Web3.signIn()
        .then(() => {
            if(this.Web3.signedIn){
                localStorage.setItem(this.Web3.account.address + '.name', 'You');
                return this.Wallets.watch(this.Web3.account.address);
            }
        })
    }

    triggerWalletChange() {
        if(this.currentWallet == "new"){
            this.createWallet();
        } else {
            this.router.navigate(['wallet', this.currentWallet, 'rtxs']);
        }
    }

    triggerWalletNameChange(newWalletName){
        if(newWalletName && newWalletName.length > 4){
            this.Wallets.wallets[this.currentWallet].name = newWalletName;
            localStorage.setItem(this.currentWallet + '.name', newWalletName);
        }
    }

}
