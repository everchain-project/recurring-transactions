import { Component, OnInit } from '@angular/core';

import { RtxService } from '../../services/rtx/rtx.service';

@Component({
  selector: 'app-rtx-feed',
  templateUrl: './rtx-feed.component.html',
  styleUrls: ['./rtx-feed.component.css']
})
export class RtxFeedComponent implements OnInit {

	constructor(
		public RTx: RtxService,
	){}

	ngOnInit() {
	}

}
