import { Component, OnInit, Input, NgZone } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from "@angular/router";
import { MatDialog, MatSnackBar } from '@angular/material';

declare let web3: any;
import { Web3Service } from '../../services/web3/web3.service';
import { DelegatedWalletService } from '../../services/delegated-wallet/delegated-wallet.service';
import { CreateWalletComponent } from '../create-wallet/create-wallet.component';
import { QrcodeComponent } from '../qrcode/qrcode.component';
import { AlarmClockService } from '../../services/alarm-clock/alarm-clock.service';
import { CreateAlarmClockComponent } from '../create-alarm-clock/create-alarm-clock.component';
import { PaymentDelegateService } from '../../services/payment-delegate/payment-delegate.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit {

    user: any = {
        isLoggedIn: false
    };

    currentAccount;
	currentWallet;
	currentRoute;
	currentView;
    newWalletName: string;
	editWalletName: boolean = false;
    walletAddresses;
    currentBalance;

	walletBalanceSubscriptions = [];

	constructor(
		private router: Router,
		private dialog: MatDialog,
		private snackbar: MatSnackBar,
		private ngZone: NgZone,
		private Web3: Web3Service,
        private AlarmClock: AlarmClockService,
		private WalletService: DelegatedWalletService,
        private PaymentDelegate: PaymentDelegateService,
	) { }

	ngOnInit() {
		//this.init();

        web3.eth.subscribe('newBlockHeaders', (error, blockHash) => {
            if (!error && this.user.isLoggedIn){
                //console.log(blockHash);
                this.Web3.getBalance(this.user.address)
                .then(updatedBalance => {
                    this.user.balance = updatedBalance;
                    console.log(updatedBalance.ether,this.PaymentDelegate.ethPriceInUsd)
                    this.user.balance['usd'] = updatedBalance.ether * this.PaymentDelegate.ethPriceInUsd;
                })
            }
        });

		this.router.events.forEach((event) => {
            if(event instanceof NavigationStart) {
            	this.destroy();
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
		this.newWalletName = this.getName(this.currentWallet);

        this.getUser()
        .then(user => {
            this.user = user;
            
            for (var i = this.user.wallets.length - 1; i >= 0; i--) {
                var wallet = this.user.wallets[i];
                this.watchForWalletBalanceChanges(wallet);
            }
        })
	}

	destroy(){
		var unsubscribe = this.walletBalanceSubscriptions;
		this.walletBalanceSubscriptions = [];
    	for (var i = unsubscribe.length - 1; i >= 0; i--) {
        	unsubscribe[i].unsubscribe((err, success) => {
        		//console.log(err, success);
        	})
        }
	}

	watchForWalletBalanceChanges(walletAddress){
        this.walletBalanceSubscriptions.push(
        	this.WalletService.getWallet(walletAddress)
	        .events.allEvents(null, (err, event) => {
	            web3.eth.getBalance(walletAddress)
	            .then(weiBalance => {
	                var etherBalance = Number(web3.utils.fromWei(weiBalance, 'ether'));
	                var usdBalance = etherBalance * this.PaymentDelegate.ethPriceInUsd;
                    console.log(usdBalance)

	                this.ngZone.run(() => {
	                    this.user[walletAddress] = {
	                        balance: {
	                            wei: weiBalance,
	                            ether: etherBalance,
	                            usd: usdBalance,
	                        }
	                    }
	                })
	            })
	            .catch(err => {
	                console.error(err)
	            })
	        })
	    );
    }

	triggerWalletChange() {
        if(this.currentWallet == "new"){
            var wait = setInterval(() => {
                this.createWallet();
                clearInterval(wait);
            }, 100)
        } else {
            var route = 'wallet/' + this.currentWallet + '/alarm-clocks';
            //console.log("Routing to: ", route);
            this.router.navigate([route]);
        }
    }

    createWallet(){
        const dialogRef = this.dialog.open(CreateWalletComponent, {
            //width: '90vw',
            //height: '90vh',
            //data: {}
        });
    
        dialogRef.afterClosed().subscribe(newWallet => {
            if(newWallet && newWallet.tx){
                var title = 'Waiting for ' + newWallet.name + ' to be deployed. Be patient!';
                var buttonText = 'view on etherscan';
                let snackBarRef = this.snackbar.open(title, buttonText);
                snackBarRef.onAction().subscribe(() => {
                    window.open('https://kovan.etherscan.io/tx/' + newWallet.txHash);
                });
                
                newWallet.tx.on("confirmation", (confirmations, txReceipt)  => {
                    console.log(confirmations);
                    if(confirmations == 0){
                        console.log("Transaction successfully buried '0' confirmations deep. This should be a custom setting eventually");                        
                        var walletAddress = txReceipt.events.AddWallet_event.returnValues.wallet;
                        this.currentWallet = walletAddress;
                        localStorage.setItem(walletAddress + '.name', newWallet.name);
                        var title = newWallet.name + ' Deployed';
                        var buttonText = 'view wallet';
                        

                        let snackBarRef = this.snackbar.open(title, buttonText);
                        snackBarRef.onAction().subscribe(() => {
                            console.log(walletAddress)
                            this.ngZone.run(() => {
                                this.router.navigate(['/wallet/' + walletAddress]);
                            });
                        });
                    }
                })
                .catch(err => {
                    console.error(err);
                })   
            } else {
            	this.currentWallet = null;
            }
        });
    }

    createAlarmClock(){
        const dialogRef = this.dialog.open(CreateAlarmClockComponent, {
            width: '90vw',
            height: '90vh',
            data: { 
                title: "Create New Alarm",
                alarmType: 'new',
            }
        });
    
        dialogRef.afterClosed().subscribe(newAlarmClock => {
        	console.log(newAlarmClock)
            if(newAlarmClock && newAlarmClock.tx){
                
            } else {
            	
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
            this.init()
        })
        .catch(err => {
            console.error('failed to login to web3');
        })
    }

    getName(id){
        var name = localStorage.getItem(id + '.name');
        if(!name) return "Unnamed Wallet"
        return name;
    }

    triggerWalletNameChange(newWalletName){
        if(newWalletName && newWalletName.length > 4){
    		this.user[this.currentWallet].name = newWalletName;
            localStorage.setItem(this.currentWallet + '.name', newWalletName);
        }
    }

    getUser(){
        return Promise.all([
            this.Web3.getCurrentAccount(),
            this.PaymentDelegate.ready
        ])
        .then(promises => {
            var currentAccount = promises[0];
            if(!currentAccount) {
                return Promise.resolve({
                    isLoggedIn: false,
                    wallets: [],
                });
            }
            else {
                this.currentAccount = currentAccount;
                localStorage.setItem(currentAccount + ".name", "You");
                return Promise.all([
                    this.Web3.getBalance(currentAccount),
                    this.WalletService.getWallets(currentAccount)
                ])
                .then(promises => {
                    this.currentBalance = promises[0];
                    this.walletAddresses = promises[1];
                    this.currentBalance['usd'] = this.currentBalance.ether * this.PaymentDelegate.ethPriceInUsd;

                    var walletBalances = [];
                    for (var i = 0; i < this.walletAddresses.length; i++) {
                        walletBalances.push(web3.eth.getBalance(this.walletAddresses[i]));
                    }

                    return Promise.all(walletBalances)
                })
                .then(walletBalances => {
                    var user  = {
                        isLoggedIn: true,
                        address: this.currentAccount,
                        balance: this.currentBalance,
                        wallets: this.walletAddresses
                    };

                    for (var i = 0; i < this.walletAddresses.length; i++) {
                        var walletAddress = this.walletAddresses[i];
                        var weiBalance = walletBalances[i];
                        var etherBalance = Number(web3.utils.fromWei(weiBalance, 'ether'));
                        var usdBalance = etherBalance * this.PaymentDelegate.ethPriceInUsd;

                        user[walletAddress] = {
                            address: walletAddress,
                            balance: {
                                wei: weiBalance,
                                ether: etherBalance,
                                usd: usdBalance,
                            },
                            name: this.getName(walletAddress)
                        }
                    }

                    return user;
                })
            }
        })
        .catch(err => {
            console.error(err)
        })
    }

}
