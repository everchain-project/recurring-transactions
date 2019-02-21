import { Pipe, PipeTransform } from '@angular/core';

import { Web3Service } from '../../services/web3/web3.service';

@Pipe({
  name: 'toDai'
})
export class ToDaiPipe implements PipeTransform {

	constructor(
        public Web3: Web3Service,
    ){}

	transform(value: any, args?: any): any {
		if(!value) return null;
		return this.Web3.weiToDai(value)
	}

}
