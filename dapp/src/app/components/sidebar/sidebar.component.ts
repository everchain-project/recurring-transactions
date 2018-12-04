import { Component, OnInit, Inject, Input, ChangeDetectorRef } from '@angular/core';
import { Router } from "@angular/router";
import { MatSnackBar, MatSnackBarRef, MAT_SNACK_BAR_DATA, MatDialog } from '@angular/material';
import { ngCopy } from 'angular-6-clipboard';
import { Web3Service } from '../../services/web3/web3.service';
import { NameService } from '../../services/name/name.service';
import { WalletService } from '../../services/wallet/wallet.service';
import { SchedulerService } from '../../services/scheduler/scheduler.service';
import { NotificationComponent } from '../notification/notification.component';
import { DeployWalletComponent } from './deploy-wallet-dialog/deploy-wallet.component';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

    private initialized;
    private web3;
    private waitForDeployment = {};

    private account = {
        isLoggedIn: false,
        address: null,
        name: null,
        addressSuffix: null,
        wallets: [],
    }

    constructor(
        private router: Router,
        private Web3: Web3Service,
        private NameService: NameService,
        private WalletService: WalletService,
        private SchedulerService: SchedulerService,
        private ref: ChangeDetectorRef,
        public snackBar: MatSnackBar,
        public dialog: MatDialog,
    ){}

    ngOnInit(){
        Promise.all([
            this.Web3.ready(),
            this.SchedulerService.ready()
        ])
        .then(promises => {
            this.web3 = promises[0];
            if(!this.web3.currentAccount){
                this.initialized = true;
            } else {
                this.account.isLoggedIn = true;
                this.account.address = this.web3.currentAccount;
                var length = this.account.address.length;
                this.account.name = this.account.address.slice(0,6) + "..." + this.account.address.slice(length-4, length);
                
                this.WalletService.getWallets(this.account.address)
                .then(walletList => {
                    this.account.wallets = walletList;
                    this.watchForChanges();
                    this.initialized = true;
                })
            }
        })
    }

    createWallet(){
        const dialogRef = this.dialog.open(DeployWalletComponent, {
            width: '600px',
            // data: { }
        });
    
        dialogRef.afterClosed().subscribe(wallet => {
            if(wallet){
                if(wallet.address){
                    if(wallet.name)
                        this.setWalletName(wallet.address, wallet.name)
                    
                    if(wallet.address)
                        this.account.wallets.push(wallet.address);

                    if(wallet.forward){
                        console.log('forwarding to newly deployed wallet: ' + wallet.address)
                        this.router.navigate(['/account/' + this.account.address + '/wallet/' + wallet.address]);
                    }
                } else {
                    this.waitForDeployment[wallet.txHash] = wallet;
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

    copyToClipboard(text){
        ngCopy(text);

        let snackBarRef = this.snackBar.openFromComponent(NotificationComponent, {
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

    private watchForChanges(){
        this.WalletService.onChange(this.account.address, (err, event) => {
            if(!err){
                var walletAddress = event.returnValues.wallet;
                var wallet = this.waitForDeployment[event.transactionHash]
                if(wallet){
                    if(wallet.name)
                        this.setWalletName(walletAddress, wallet.name)
                    else
                        wallet.name = "Unnamed Wallet";

                    this.account.wallets.push(walletAddress);
                    this.ref.detectChanges();

                    let snackBarRef = this.snackBar.openFromComponent(NotificationComponent, {
                        duration: 10000,
                        data: {
                            title: wallet.name + " Deployed",
                            msg: walletAddress,
                            accountAddress: this.account.address,
                            router: this.router,
                            onClick: function(){
                                this.router.navigate(['/account/' + this.accountAddress + '/wallet/' + this.msg]);
                            },
                            buttonText: 'view'
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
        })
    }
}