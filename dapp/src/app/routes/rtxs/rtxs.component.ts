import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from "@angular/router";

import { Web3Service } from '../../services/web3/web3.service';
import { PaymentService } from '../../services/payment/payment.service';
import { RtxService } from '../../services/rtx/rtx.service';

@Component({
  selector: 'app-rtxs',
  templateUrl: './rtxs.component.html',
  styleUrls: ['./rtxs.component.css']
})
export class RtxsComponent implements OnInit {

    initialized: boolean;
	currentWallet: string;
    routerSubscription: any;

	constructor(
		private router: Router,
		private Web3: Web3Service,
        public Payments: PaymentService,
        public Rtx: RtxService,
	){}

	ngOnInit() {
        this.parseRoute();

        this.router.events.forEach((event) => {
            if(event instanceof NavigationEnd) {
                this.parseRoute();
            }
        });
    }

    parseRoute(){
        var option = this.router.url.split('/');
        this.currentWallet = option[2];
    }

}
