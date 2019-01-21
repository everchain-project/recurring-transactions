import { Component, OnInit } from '@angular/core';

declare let web3: any;
import { PaymentDelegateService } from '../../services/payment-delegate/payment-delegate.service';
import { AlarmClockService } from '../../services/alarm-clock/alarm-clock.service';
import { Web3Service } from '../../services/web3/web3.service';

@Component({
  selector: 'app-view-home',
  templateUrl: './view-home.component.html',
  styleUrls: ['./view-home.component.css']
})
export class ViewHomeComponent implements OnInit {

	web3;

	constructor(
		private PaymentDelegate: PaymentDelegateService,
		private AlarmClock: AlarmClockService,
		private Web3: Web3Service,
	) { }

	ngOnInit() {
		/*
		this.Web3.ready().then(() => {
			this.web3 = web3;
		})
		*/
	}

}
