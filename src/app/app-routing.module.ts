import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { WalletComponent } from './wallet/wallet.component';
import { DelegatesComponent } from './delegates/delegates.component';
import { TokenComponent } from './token/token.component';
import { TransferComponent } from './transfer/transfer.component';

const routes: Routes = [
    { path: '', redirectTo: 'account', pathMatch: 'full' },
    { path: 'account', component: HomeComponent },
    { path: 'account/wallet/:address', redirectTo: 'account/wallet/:address/token/0x0000000000000000000000000000000000000000', pathMatch: 'full' },
    { 
        path: 'account/wallet/:address', 
        component: WalletComponent,
        children: [
            { path: '', redirectTo: 'token', pathMatch: 'full'},
            { path: 'delegates', component: DelegatesComponent },
            { 
                path: 'token', 
                component: TokenComponent,
                children: [
                    {path: '', redirectTo: '0x0000000000000000000000000000000000000000', pathMatch: 'full'},
                    {path: ':token', component: TransferComponent}
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