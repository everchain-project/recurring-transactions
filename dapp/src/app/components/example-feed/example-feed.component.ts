import { Component, OnInit } from '@angular/core';

declare let web3: any;
import { AlarmClockService } from '../../services/alarm-clock/alarm-clock.service';

@Component({
  selector: 'app-example-feed',
  templateUrl: './example-feed.component.html',
  styleUrls: ['./example-feed.component.css']
})
export class ExampleFeedComponent implements OnInit {

	constructor(
		public AlarmClock: AlarmClockService,
	) { }

	ngOnInit() { 

    }

}
