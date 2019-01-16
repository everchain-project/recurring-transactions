import { Component, OnInit, NgZone } from '@angular/core';

declare let web3: any;
import { AlarmClockService } from '../../services/alarm-clock/alarm-clock.service';

@Component({
  selector: 'app-example-feed',
  templateUrl: './example-feed.component.html',
  styleUrls: ['./example-feed.component.css']
})
export class ExampleFeedComponent implements OnInit {

	events = [];
    exampleEventSubscription;
	
	constructor(
		private ngZone: NgZone,
		private AlarmClock: AlarmClockService,
	) { }

	ngOnInit() {
		Promise.all([
            this.AlarmClock.ready,
            web3.eth.getBlockNumber(),
        ])
        .then(promises => {
            var fromBlock = promises[1] - 10000;
            this.AlarmClock.example.getPastEvents("allEvents", {fromBlock: fromBlock})
            .then(events => {
                //console.log(events)
                var promises = [];
                for (var i = 0; i < events.length; i++) {
                    promises.push(web3.eth.getBlock(events[i].blockNumber))
                }

                Promise.all(promises)
                .then(blockData => {
                    for (var i = events.length - 1; i >= 0; i--) {
                        events[i]['timestamp'] = blockData[i].timestamp;
                    }

                    this.events = events;
                })
            })

            this.exampleEventSubscription = this.AlarmClock.example.events.Trigger_event(null, (err, event) => {
                //console.log(err, event)
                this.ngZone.run(() => {
                    if(event){
                        web3.eth.getBlock(event.blockNumber)
                        .then(block => {
                            console.log(block);
                            event['timestamp'] = block.timestamp;
                            this.events.push(event);
                        })
                    } 
                });
            })
        })
	}

}
