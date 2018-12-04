import { Component, OnInit } from '@angular/core';
import { Web3Service } from 'src/app/services/web3/web3.service';

@Component({
  selector: 'app-right-nav',
  templateUrl: './right-nav.component.html',
  styleUrls: ['./right-nav.component.css']
})
export class RightNavComponent implements OnInit {

    initialized: boolean = false;
    web3: any;

    public settings = {
        bigBanner: true,
        timePicker: true,
        format: 'MMM dd, yyyy @ hh:mm a',
        defaultOpen: false
    }

    public newAlarm = {
        label: null,
        wallet: 'walletAddress1',
        startDate: new Date(new Date().getTime() + 24*60*60*1000), // set 24 hours ahead
        taskAddress: null,
        callData: null,
        intervals: 2,
        period: {
            value: 1,
            unit: 'months',
            type: 'forever',
        },
        extraGas: null,
        //  callGas: null,
        //  gasPrice: null,
        //  estimatedCost: {
        //      ether: null,
        //      usd: null,
        //  },
    }

    constructor(
        private Web3: Web3Service,
    ){}

    ngOnInit(){
        this.Web3.ready()
        .then(web3 => {
            this.web3 = web3;
            this.initialized = true;
        })
    }

    createAlarm(){
        console.log('Create Alarm');
    }

}
