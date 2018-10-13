import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AppComponent } from './app.component';
import { Web3Service } from './web3/web3.service';
import { EverchainService } from './everchain/everchain.service';
import { SidebarComponent, SnackBarPopupComponent, WalletDeployedComponent } from './sidebar/sidebar.component';
import { AppRoutingModule } from './app-routing.module';
import { HomeComponent } from './home/home.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LayoutModule } from '@angular/cdk/layout';
import { MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatSlideToggleModule, MatSnackBarModule, MatDialogModule, MatToolbarModule, MatInputModule, MatButtonModule, MatFormFieldModule, MatSidenavModule, MatIconModule, MatListModule, MatGridListModule, MatCardModule, MatMenuModule } from '@angular/material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { WalletComponent } from './wallet/wallet.component';
import { TokenComponent } from './token/token.component';
import { DelegatesComponent } from './delegates/delegates.component';
import { TransferComponent } from './transfer/transfer.component';

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
        TransferComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        LayoutModule,
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
        MatNativeDateModule
    ],
    providers: [
        Web3Service,
        EverchainService
    ],
    bootstrap: [
        AppComponent
    ],
    entryComponents: [
        SnackBarPopupComponent,
        WalletDeployedComponent
    ],
})
export class AppModule {}