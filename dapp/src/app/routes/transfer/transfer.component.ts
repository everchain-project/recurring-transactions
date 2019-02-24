import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";

declare let web3: any;
import { Web3Service } from '../../services/web3/web3.service';
import { WalletService } from '../../services/wallet/wallet.service';
import { ContactService } from '../../services/contact/contact.service';

@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.css']
})
export class TransferComponent implements OnInit {

	currentWallet: string;
    toAddress: string;
    transferAmount: number;
    newContactAddress: string;
    newContactName: string;
    addNewContact: boolean;

    constructor(
        private router: Router,
        public Web3: Web3Service,
        public Wallets: WalletService,
        public Contacts: ContactService,
    ){}

    ngOnInit() {
        var option = this.router.url.split('/');
        this.currentWallet = option[2];
    }

    max(){
        this.transferAmount = Number(web3.utils.fromWei(this.Wallets.wallets[this.currentWallet].balance, "ether"));
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

    transfer(){
        this.Web3.getCurrentAccount()
        .then(currentAccount => {
            this.Wallets.wallets[this.currentWallet].instance.methods.transfer(
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
