import { Component, OnInit, Input } from '@angular/core';
import { MatDialog } from '@angular/material';
import { NameService } from 'src/app/services/name/name.service';
import { Web3Service } from 'src/app/services/web3/web3.service';
import { SchedulerService } from 'src/app/services/scheduler/scheduler.service';
import { ViewPaymentComponent } from './view-payment-dialog/view-payment.component';


@Component({
  selector: 'app-payment-list',
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.css']
})
export class PaymentListComponent implements OnInit {

    @Input() wallet: any;
    
    private web3;
    private payments: any;

    constructor(
        private NameService: NameService,
        private Web3Service: Web3Service,
        private PaymentScheduler: SchedulerService,
        public dialog: MatDialog,
    ){}

    ngOnInit(){
        this.web3 = this.Web3Service.ready();
        this.PaymentScheduler.ready()
        .then(() => {
            this.updatePaymentList()
            
            var events = this.PaymentScheduler.PaymentDelegate.events.allEvents({
                filter: {wallet: this.wallet.address},
                fromBlock: 'latest'
            }, () => {
                this.updatePaymentList()
            })
        })
    }

    openDialogFor(payment){
        const dialogRef = this.dialog.open(ViewPaymentComponent, {
            width: '550px',
            data: {
                payment: payment 
            }
        });

        dialogRef.afterClosed().subscribe(() => {
            this.updatePaymentList()
        })
    }

    updatePaymentList(){
        Promise.all([
            this.PaymentScheduler.PaymentDelegate.methods.getIncomingPayments(this.wallet.address).call(),
            this.PaymentScheduler.PaymentDelegate.methods.getOutgoingPayments(this.wallet.address).call(),
        ])
        .then(payments => {
            var incomingPayments = payments[0];
            var outgoingPayments = payments[1];
            var promises = [];

            incomingPayments.forEach(paymentAddress => {
                //promises.push(this.PaymentScheduler.getPayment(paymentAddress))
            });

            outgoingPayments.forEach(paymentAddress => {
                //promises.push(this.PaymentScheduler.getPayment(paymentAddress))
            });
            
            return Promise.all(promises)
        })
        .then(payments => {
            this.payments = payments;
        })
        .catch(console.error)
    }
}
