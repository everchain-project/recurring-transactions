import { Component, OnInit, Input } from '@angular/core';

import { RtxService } from '../../services/rtx/rtx.service';

@Component({
  selector: 'app-rtx',
  templateUrl: './rtx.component.html',
  styleUrls: ['./rtx.component.css']
})
export class RtxComponent implements OnInit {

	@Input() rtx;

	constructor(
        public RTx: RtxService,
	){}

	ngOnInit() {
		//console.log(this.rtx);
		//this.RTx.getDetails(this.rtx)
	}

}
