import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ViewHomeComponent } from './components/view-home/view-home.component';
import { ViewWalletComponent } from './components/view-wallet/view-wallet.component';

const routes: Routes = [
	{
        path: 'home', 
        component: ViewHomeComponent 
    },
    {
        path: 'wallet/:walletAddress', 
        redirectTo: 'wallet/:walletAddress/alarm-clocks',
        pathMatch: 'full'
    },
    {
        path: 'wallet/:walletAddress/:view', 
        component: ViewWalletComponent 
    },
    {
        path: '**', 
        redirectTo: 'home', 
        pathMatch: 'full' 
    },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
