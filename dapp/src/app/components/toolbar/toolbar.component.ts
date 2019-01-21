import { Component, OnInit } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from "@angular/router";
import { MatDialog, MatSnackBar } from '@angular/material';

declare let web3: any;
import { Web3Service } from '../../services/web3/web3.service';
import { AlarmClockService } from '../../services/alarm-clock/alarm-clock.service';
import { PaymentDelegateService } from '../../services/payment-delegate/payment-delegate.service';
import { WalletManagerService } from '../../services/wallet-manager/wallet-manager.service';
import { UserService } from '../../services/user/user.service';
import { StorageService } from '../../services/storage/storage.service';
import { CreateWalletComponent } from '../create-wallet/create-wallet.component';
import { QrcodeComponent } from '../qrcode/qrcode.component';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit {

    initialized;
    currentWallet;
    currentRoute;
    currentView
    newWalletName: string;
    editWalletName: boolean = false;
    error: string = null;
    
    constructor(
        private router: Router,
        private dialog: MatDialog,
        private snackbar: MatSnackBar,
        private Web3: Web3Service,
        private AlarmClock: AlarmClockService,
        private PaymentDelegate: PaymentDelegateService,
        public WalletManager: WalletManagerService,
        public User: UserService,
        public Storage: StorageService,
    ) { }

    ngOnInit() {
        this.Web3.ready().then(networkId => {
            if(networkId != 42) this.error = "Wrong network detected... Switch to the Kovan Testnet!";
            this.initialized = true;
        })
        .catch(err => {
            this.error = err;
            this.initialized = true;
        })

        this.init();

        this.router.events.forEach((event) => {
            if(event instanceof NavigationStart) {
                //this.destroy();
            }
            if(event instanceof NavigationEnd) {
                this.init();
            }
            // NavigationCancel
            // NavigationError
            // RoutesRecognized
        });
    }

    init(){
        var option = this.router.url.split('/');
        this.currentWallet = option[2];
        this.currentRoute = '/' + option[1] + '/' + option[2];
        this.currentView = option[3];
        this.newWalletName = this.Storage.get(this.currentWallet,"name");
    }

    createWallet(){
        const dialogRef = this.dialog.open(CreateWalletComponent, {
            //width: '90vw',
            //height: '90vh',
            //data: {}
        });
    
        dialogRef.afterClosed().subscribe(newWallet => {
            this.init();
            if(newWallet && newWallet.tx){
                var title = 'Waiting for ' + newWallet.name + ' to be deployed. Be patient!';
                var buttonText = 'view on etherscan';
                let snackBarRef = this.snackbar.open(title, buttonText);
                snackBarRef.onAction().subscribe(() => {
                    window.open('https://kovan.etherscan.io/tx/' + newWallet.txHash);
                });
                
                newWallet.tx.on("confirmation", (confirmations, txReceipt)  => {
                    if(confirmations == 0){
                        console.log("Transaction successfully buried '0' confirmations deep. This should be a custom setting eventually");                        
                        var walletAddress = txReceipt.events.AddWallet_event.returnValues.wallet;
                        localStorage.setItem(walletAddress + '.name', newWallet.name);
                        this.WalletManager.watch(walletAddress);
                        this.WalletManager.walletList.push(walletAddress);
                        
                        var title = newWallet.name + ' Deployed';
                        var buttonText = 'view wallet';
                        let snackBarRef = this.snackbar.open(title, buttonText);
                        snackBarRef.onAction().subscribe(() => {
                            this.User.wallets.push(walletAddress);
                            this.router.navigate(['/wallet/' + walletAddress]);
                        });
                    }
                })
                .catch(err => {
                    console.error(err);
                })   
            } else {
                this.init();
            }
        });
    }
    

    showQRCode(){
        console.log(this.currentWallet);
        const dialogRef = this.dialog.open(QrcodeComponent, {
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
            this.init();
            console.log(this.Web3.watchedAccount)
            return this.User.set(this.Web3.watchedAccount)
        })
        .catch(err => {
            console.error(err);
        })
    }

    triggerWalletChange() {
        if(this.currentWallet == "new"){
            this.createWallet();
        } else {
            this.router.navigate(['wallet/' + this.currentWallet + '/alarm-clocks']);
        }
    }

    triggerWalletNameChange(newWalletName){
        if(newWalletName && newWalletName.length > 4){
            this.User.wallets[this.currentWallet].name = newWalletName;
            this.Storage.set(this.currentWallet,'.name', newWalletName);
        }
    }

}
