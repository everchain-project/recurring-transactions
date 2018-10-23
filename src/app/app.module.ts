import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LayoutModule } from '@angular/cdk/layout';
import { NgModule } from '@angular/core';
import { 
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatDialogModule,
    MatToolbarModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatGridListModule,
    MatCardModule,
    MatMenuModule 
} from '@angular/material';

import { Web3Service } from './services/web3/web3.service';
import { NameService } from './services/name/name.service';

import { AppComponent } from './components/app/app.component';
import { DelegatesComponent } from './components/delegates/delegates.component';
import { HomeComponent } from './components/home/home.component';
import { TokenComponent } from './components/token/token.component';
import { SchedulerComponent } from './components/scheduler/scheduler.component';
import { WalletComponent } from './components/wallet/wallet.component';
import { SidebarComponent, SnackBarPopupComponent, WalletDeployedComponent } from './components/sidebar/sidebar.component';
import { DeployWalletComponent } from './components/sidebar/deploy-wallet-dialog/deploy-wallet.component';

@NgModule({
    declarations: [
        AppComponent,
        SidebarComponent,
        HomeComponent,
        WalletComponent,
        TokenComponent,
        SnackBarPopupComponent,
        WalletDeployedComponent,
        DelegatesComponent,
        SchedulerComponent,
        DeployWalletComponent,
    ],
    imports: [
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        LayoutModule,
        MatDialogModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSlideToggleModule,
        MatInputModule,
        MatSnackBarModule,
        MatFormFieldModule,
        MatDialogModule,
        MatToolbarModule,
        MatButtonModule,
        MatSidenavModule,
        MatIconModule,
        MatListModule,
        MatGridListModule,
        MatCardModule,
        MatMenuModule,
        FlexLayoutModule,
    ],
    exports: [
        MatNativeDateModule,
        MatDialogModule,
    ],
    providers: [
        Web3Service,
        NameService,
    ],
    bootstrap: [
        AppComponent,
    ],
    entryComponents: [
        SnackBarPopupComponent,
        WalletDeployedComponent,
        DeployWalletComponent,
    ],
})
export class AppModule {}