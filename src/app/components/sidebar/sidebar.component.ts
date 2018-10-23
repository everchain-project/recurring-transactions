import { Component, OnInit, Inject, Input } from '@angular/core';
import {Router} from "@angular/router";
import { MatSnackBar, MatSnackBarRef, MAT_SNACK_BAR_DATA, MatDialog } from '@angular/material';
import { ngCopy } from 'angular-6-clipboard';
import { Web3Service } from '../../services/web3/web3.service';
import { NameService } from '../../services/name/name.service';
import { WalletService } from '../../services/wallet/wallet.service';
import { SchedulerService } from '../../services/scheduler/scheduler.service';
import { DeployWalletComponent } from './deploy-wallet-dialog/deploy-wallet.component';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

    @Input() name: string;

    private initialized;
    private web3;

    private account = {
        isLoggedIn: false,
        address: null,
        addressPrefix: '',
        addressSuffix: '',
        wallets: [],
    }

    constructor(
        private router: Router,
        private Web3Service: Web3Service,
        private NameService: NameService,
        private WalletService: WalletService,
        private SchedulerService: SchedulerService,
        public snackBar: MatSnackBar,
        public dialog: MatDialog,
    ) {}

    ngOnInit(){
        Promise.all([
            this.Web3Service.getWeb3Instance(),
            this.SchedulerService.ready()
        ])
        .then(promises => {
            this.web3 = promises[0];

            this.account.address = this.web3.utils.toChecksumAddress(this.web3.currentAccount);
            this.account.isLoggedIn = this.account.address != this.web3.emptyAddress;
            if(!this.account.isLoggedIn){
                console.log('not logged in')
                this.initialized = true;
            } else {
                console.log('Logged in as: ', this.account.address)
                var length = this.account.address.length;
                this.account.addressPrefix = this.account.address.slice(0,5);
                this.account.addressSuffix = this.account.address.slice(length-3, length);
                
                this.WalletService.getWallets(this.account.address)
                .then(walletList => {
                    this.account.wallets = walletList;
                    this.initialized = true;
                })

               this.WalletService.watchForNewWallets({owner: this.account.address})
               .then(filter => {
                   filter.watch((err, event) => {
                       console.log(event)
                       this.account.wallets.push(event.args.wallet)
                   })
               })
            }
        })
    }

    createWallet(){
        const dialogRef = this.dialog.open(DeployWalletComponent, {
            width: '500px',
            // data: { }
        });
    
        dialogRef.afterClosed().subscribe(wallet => {
            console.log('returned dialog wallet data:', wallet);
            if(wallet){
                if(wallet.name)
                    this.setWalletName(wallet.address, wallet.name)

                if(wallet.forward){
                    console.log('forwarding to newly deployed wallet: ' + wallet.address)
                    this.router.navigate(['/account/' + this.web3.currentAccount + '/wallet/' + wallet.address]);
                }
            }
        });
    }

    getWalletName(address){
        return this.NameService.getName(address);
    }

    setWalletName(wallet, name){
        this.NameService.setName(wallet, name);
    }

    showWalletTransactionSnackBar(txHash){
        let snackBarRef = this.snackBar.openFromComponent(WalletDeployedComponent, {
            duration: 10000,
            data: {
                title: 'Waiting for Wallet Deployment',
                btn1Text: 'view transaction on etherscan',
                btn2Text: 'dismiss'
            }
        });

        snackBarRef.afterDismissed().subscribe(() => {
            console.log('The snack-bar was dismissed');
        });
          
        snackBarRef.onAction().subscribe(() => {
            console.log('The snack-bar action was triggered!');
        });
    }

    showWalletDeployedSnackBar(walletAddress): void {
        let snackBarRef = this.snackBar.openFromComponent(WalletDeployedComponent, {
            duration: 10000,
            data: {
                title: 'Wallet Successfully Deployed',
                btn1Text: 'view',
                btn2Text: 'dismiss'
            }
        });

        snackBarRef.afterDismissed().subscribe(() => {
            console.log('The snack-bar was dismissed');
        });
          
        snackBarRef.onAction().subscribe(() => {
            console.log('The snack-bar action was triggered!');
        });
    }

    copyToClipboard(text){
        ngCopy(text);

        let snackBarRef = this.snackBar.openFromComponent(SnackBarPopupComponent, {
            duration: 5000,
            data: {
                title: "Copied to Clipboard",
                msg: text
            }
        });
        
        snackBarRef.afterDismissed().subscribe(() => {
            console.log('The snack-bar was dismissed');
        });
          
        snackBarRef.onAction().subscribe(() => {
            console.log('The snack-bar action was triggered!');
        });
    }

}

@Component({
    selector: 'wallet-deployed-popup',
    template: '<h4>{{data.title}}</h4>'
            + '<div class="padding" fxLayout="row" fxLayoutAlign="start center">'
            +   '<small>{{data.msg}}</small> &nbsp;' 
            +   '<button mat-button (click)="onAction()">btn1Text</button> &nbsp;'
            +   '<button mat-button (click)="onDismiss()">btn2Text</button>'
            + '</div>',
})
export class WalletDeployedComponent {
    constructor(
        @Inject(MAT_SNACK_BAR_DATA) public data: any,
        private snackBarRef: MatSnackBarRef<WalletDeployedComponent>
    ){

    }

    onAction(){
        this.snackBarRef.closeWithAction();
    }

    onDismiss(){
        this.snackBarRef.dismiss();
    }
}

@Component({
    selector: 'copied-to-clipboard-popup',
    template: '<h4 style="margin: 4px 0px;">{{ data.title }}</h4>'
            + '<small>{{ data.msg }}</small>',
})
export class SnackBarPopupComponent {
    constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any) { }
}