import { Injectable } from '@angular/core';
import { Web3Service } from "../web3/web3.service";

@Injectable({
    providedIn: 'root'
})
export class NameService {

    private web3;

    constructor(
        private Web3Service: Web3Service
    ) { 
        Web3Service.getWeb3Instance()
        .then(web3 => {
            this.web3 = web3;
        })
    }

    getName(address){
        if(!address) return;

        var length = address.length;
        var addressPrefix = address.slice(0,5);
        var addressSuffix = address.slice(length-3,length);

        var name = localStorage.getItem(this.web3.utils.toChecksumAddress(address) + '.name');
        if(!name)
            return "Unknown Address " + addressPrefix + '...' + addressSuffix;
            
        return name;
    }

    setName(address, name){
        localStorage.setItem(this.web3.utils.toChecksumAddress(address) + '.name', name);
    }

}
