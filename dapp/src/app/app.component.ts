import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from "@angular/platform-browser";

declare let require: any;
declare let web3: any;
import { Web3Service } from './services/web3/web3.service';
import { UserService } from './services/user/user.service';
import { AlarmClockService } from './services/alarm-clock/alarm-clock.service';
import { PaymentDelegateService } from './services/payment-delegate/payment-delegate.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

    initialized: boolean = false;

    constructor(
        private matIconRegistry: MatIconRegistry,
        private domSanitizer: DomSanitizer,
        private AlarmClock: AlarmClockService,
        private PaymentDelegate: PaymentDelegateService,
        private User: UserService,
        private Web3: Web3Service,
    ){}

    ngOnInit() {
        Promise.all([
            this.Web3.ready(),
            this.PaymentDelegate.ready(),
            this.AlarmClock.ready(),
        ])
        .then(promises => {
            if(this.Web3.networkId != 42){
                return Promise.reject("Wrong network detected")
            }
            else{
                return this.Web3.getCurrentAccount()
                .then(currentAccount => {
                    if(currentAccount) 
                        return this.User.set(currentAccount);
                    else 
                        Promise.resolve(null);
                })
                .then(() => {
                    this.initialized = true;
                })
            }
        })
        .catch(err => {
            this.initialized = true;
        })

        // Add custom icons
        this.matIconRegistry.addSvgIcon("ether", this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/ethereum-logo.svg"));
        this.matIconRegistry.addSvgIcon("qrcode", this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/qrcode.svg"));
    }

}
