import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";

declare let web3: any;
import { Web3Service } from '../../services/web3/web3.service';
import { WalletManagerService } from '../../services/wallet-manager/wallet-manager.service';
import { UserService } from '../../services/user/user.service';

@Component({
  selector: 'app-view-wallet-transfer',
  templateUrl: './view-wallet-transfer.component.html',
  styleUrls: ['./view-wallet-transfer.component.css']
})
export class ViewWalletTransferComponent implements OnInit {

    Wallet;
    toAddress;
    transferAmount;
    newContactAddress: string ;
    newContactName: string;

    constructor(
        private router: Router,
        private Web3: Web3Service,
        public WalletManager: WalletManagerService,
        public User: UserService,
    ){}

    ngOnInit() {
        var option = this.router.url.split('/');
        var walletAddress = option[2];
        this.Wallet = this.WalletManager.wallets[walletAddress];
    }

    max(){
        this.Web3.getBalance(this.Wallet._address)
        .then(maxAmount => {
            this.transferAmount = maxAmount.ether;
        })
    }

    valid(){
        if(web3.utils.isAddress(this.toAddress) && this.transferAmount > 0)
            return true;

        return false;
    }

    validContact(){
        if(web3.utils.isAddress(this.newContactAddress) && this.newContactName)
            return true;
    }

    addContact(){
        this.User.addContact(this.newContactAddress, this.newContactName);
    }

    removeContact(address){
        this.User.removeContact(address)
    }

    transfer(){
        this.Web3.getCurrentAccount()
        .then(currentAccount => {
            this.Wallet.methods.transfer(
                web3.utils.nullAddress, // ether
                this.toAddress,
                web3.utils.toWei(this.transferAmount.toString(),"ether")
            )
            .send({
                from: currentAccount
            })
            .on('transactionHash', txHash => {
                console.log(txHash)
            })
        })
    }

}
