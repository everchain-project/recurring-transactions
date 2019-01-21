import { Component, OnInit } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from "@angular/router";
import { MatDialog, MatSnackBar } from '@angular/material';

import { Web3Service } from '../../services/web3/web3.service';
import { AlarmClockService } from '../../services/alarm-clock/alarm-clock.service';
import { WalletManagerService } from '../../services/wallet-manager/wallet-manager.service';

import { CreateAlarmClockComponent } from '../create-alarm-clock/create-alarm-clock.component';

@Component({
  selector: 'app-view-wallet-alarms',
  templateUrl: './view-wallet-alarms.component.html',
  styleUrls: ['./view-wallet-alarms.component.css']
})
export class ViewWalletAlarmsComponent implements OnInit {

	currentWallet;
    routeWatcher;

    constructor(
        private router: Router,
        private dialog: MatDialog,
        private snackbar: MatSnackBar,
        private Web3: Web3Service,
        public AlarmClockManager: AlarmClockService,
        public WalletManager: WalletManagerService,
    ){}

	ngOnInit() {
        this.init();

        this.routeWatcher = this.router.events.forEach((event) => {
            if(event instanceof NavigationStart) {
                //this.destroy();
            }
            if(event instanceof NavigationEnd) {
                this.init();
            }
            // NavigationCancel
            // NavigationError
            // RoutesRecognized
        });
    }

    init(){
        var option = this.router.url.split('/');
        this.currentWallet = option[2];
    }

    createAlarmClock(){
        const dialogRef = this.dialog.open(CreateAlarmClockComponent, {
            width: '90vw',
            height: '90vh',
            data: { 
                title: "Create New Alarm",
                alarmType: 'new',
            }
        });
    
        dialogRef.afterClosed().subscribe(newAlarmClock => {
            //console.log(newAlarmClock)
            //to do snackbar
        });
    }

}
