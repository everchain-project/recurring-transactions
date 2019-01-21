import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ViewHomeComponent } from './components/view-home/view-home.component';
import { ViewWalletAlarmsComponent } from './components/view-wallet-alarms/view-wallet-alarms.component';
import { ViewWalletDelegatesComponent } from './components/view-wallet-delegates/view-wallet-delegates.component';
import { ViewWalletTransferComponent } from './components/view-wallet-transfer/view-wallet-transfer.component';

const routes: Routes = [
	{
        path: '', 
        component: ViewHomeComponent 
    },
    {
        path: 'wallet/:walletAddress',
        redirectTo: 'wallet/:walletAddress/alarm-clocks',
        pathMatch: 'full',
    },
    {
        path: 'wallet/:walletAddress/alarm-clocks',
        component: ViewWalletAlarmsComponent,
    },
    {
        path: 'wallet/:walletAddress/delegates',
        component: ViewWalletDelegatesComponent,
    },
    {
        path: 'wallet/:walletAddress/transfer',
        component: ViewWalletTransferComponent,
    },
    {
        path: '**',
        redirectTo: '', 
        pathMatch: 'full' 
    },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
