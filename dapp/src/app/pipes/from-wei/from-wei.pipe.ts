import { Pipe, PipeTransform } from '@angular/core';

declare let web3: any;

@Pipe({
  name: 'fromWei'
})
export class FromWeiPipe implements PipeTransform {

	transform(value: any, args?: any): String {
		if(!value) return null;
		return web3.utils.fromWei(value,args);
	}

}
