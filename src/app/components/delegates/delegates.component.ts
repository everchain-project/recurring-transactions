import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Web3Service } from '../../services/web3/web3.service';
import { WalletService } from 'src/app/services/wallet/wallet.service';
import { NameService } from 'src/app/services/name/name.service';


@Component({
  selector: 'app-delegates',
  templateUrl: './delegates.component.html',
  styleUrls: ['./delegates.component.css']
})
export class DelegatesComponent implements OnInit {

    private initialized = false;
    private web3;
    private currentAccount;
    private instance;
    private wallet;

    constructor(
        private router: Router,
        private NameService: NameService,
        private Web3Service: Web3Service,
        private WalletService: WalletService,
    ){}

    ngOnInit() {
        this.Web3Service.getWeb3Instance()
        .then(web3 => {
            this.web3 = web3;

            var walletAddress = this.router.url.split('/')[4];
            this.wallet = this.WalletService.getWallet(walletAddress);
            this.wallet.methods.getDelegates().call()
            .then(delegateList => {
                this.wallet['delegates'] = delegateList;
                this.currentAccount = this.web3.currentAccount;
                this.initialized = true;
                console.log(this.wallet);
            })
            .catch(console.error)
        })
    }

    getDelegateName(delegateAddress){
        return this.NameService.getName(delegateAddress)
    }

}
