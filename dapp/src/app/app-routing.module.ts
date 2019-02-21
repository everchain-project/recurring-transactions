import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './routes/home/home.component';
import { RtxsComponent } from './routes/rtxs/rtxs.component';
import { DelegatesComponent } from './routes/delegates/delegates.component';
import { TransferComponent } from './routes/transfer/transfer.component';

const routes: Routes = [
	{
        path: '', 
        component: HomeComponent 
    },
    {
        path: 'wallet/:walletAddress',
        component: RtxsComponent,
    },
    {
        path: 'wallet/:walletAddress/delegates',
        component: DelegatesComponent,
    },
    {
        path: 'wallet/:walletAddress/transfer',
        component: TransferComponent,
    },
    {
        path: 'wallet/:walletAddress/:invalid',
        redirectTo: 'wallet/:walletAddress',
        pathMatch: 'full',
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
