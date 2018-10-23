import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { WalletComponent } from './components/wallet/wallet.component';
import { DelegatesComponent } from './components/delegates/delegates.component';
import { TokenComponent } from './components/token/token.component';
import { SchedulerComponent } from './components/scheduler/scheduler.component';

const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },
    { 
        path: 'account/:accountAddress/wallet/:walletAddress', 
        redirectTo: 'account/:accountAddress/wallet/:walletAddress/token/0x0000000000000000000000000000000000000000', 
        pathMatch: 'full' 
    },{ 
        path: 'account/:accountAddress/wallet/:walletAddress', 
        component: WalletComponent,
        children: [
            { path: '', redirectTo: 'token', pathMatch: 'full'},
            { path: 'delegates', component: DelegatesComponent },
            { 
                path: 'token', 
                component: TokenComponent,
                children: [
                    {path: '', redirectTo: '0x0000000000000000000000000000000000000000', pathMatch: 'full'},
                    {path: ':token', component: SchedulerComponent}
                ]
            },
        ]
    },
];

@NgModule({
    imports: [ RouterModule.forRoot(routes) ],
    exports: [ RouterModule ]
})
export class AppRoutingModule {}