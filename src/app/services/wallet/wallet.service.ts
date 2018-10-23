import { Injectable } from '@angular/core';
import * as TruffleContract from 'truffle-contract';
import { Web3Service } from '../web3/web3.service';
import { SchedulerService } from '../scheduler/scheduler.service';

declare let require: any;
let DelegatedWalletArtifact = require('../../../../build/contracts/DelegatedWallet.json');
let WalletManagerArtifact = require('../../../../build/contracts/DelegatedWalletManager.json');
const DelegatedWalletContract = TruffleContract(DelegatedWalletArtifact);
const WalletManagerContract = TruffleContract(WalletManagerArtifact);

@Injectable({
    providedIn: 'root'
})
export class WalletService {

    private initialized;
    private web3;
    private contract;
    public addWallet;

    constructor(
        private Web3Service: Web3Service,
        private SchedulerService: SchedulerService,
    ){
        this.initialized = new Promise((resolve, reject) => {
            this.Web3Service.getWeb3Instance()
            .then(web3 => {
                this.web3 = web3;
                WalletManagerContract.setProvider(web3.currentProvider);
                return WalletManagerContract.deployed()
            })
            .then(instance => {
                this.contract = {
                    truffle: {
                        methods: instance,
                    },
                    web3: new this.web3.eth.Contract(WalletManagerArtifact.abi, instance.address)
                };

                this.addWallet = this.contract.web3.methods.addWallet;

                resolve()
            })
            .catch(reject)
        })
    }

    watchForNewWallets(options){
        return this.initialized.then(() => {
            return this.contract.truffle.methods.AddWallet_event(options)
        })
    }

    getWallets(account){
        return this.initialized.then(() => this.contract.truffle.methods.getWallets(account))
        .then(walletList => {
            for(var i = 0; i < walletList.length; i++)
                walletList[i] = this.web3.utils.toChecksumAddress(walletList[i]);

            return walletList;
        })
    }

    estimateGas(customFactory, delegates){
        if(!customFactory)
            customFactory = this.web3.emptyAddress; // use default factory

        return this.initialized
        .then(() => {
            return this.contract.web3.methods.addWallet(customFactory, delegates).estimateGas({from: this.web3.currentAccount})
        })
    }

    getWallet(walletAddress){
        return new this.web3.eth.Contract(DelegatedWalletArtifact.abi, walletAddress)
    }
    
    ready(){
        return this.initialized
    }
}
