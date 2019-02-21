import { Component } from '@angular/core';

import { Web3Service } from '../../services/web3/web3.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent  {

	constructor(
		public Web3: Web3Service
	){}

}
