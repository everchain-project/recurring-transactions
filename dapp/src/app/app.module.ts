import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { LayoutModule } from '@angular/cdk/layout';
import { 
    MatSelectModule,
    MatExpansionModule,
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
    MatMenuModule,
} from '@angular/material';
import { AngularDateTimePickerModule } from 'angular2-datetimepicker';
import { QRCodeModule } from 'angularx-qrcode';
import 'hammerjs';

import { AppComponent } from './app.component';

import { Web3Service } from './services/web3/web3.service';
import { DelegatedWalletService } from './services/delegated-wallet/delegated-wallet.service';
import { PaymentDelegateService } from './services/payment-delegate/payment-delegate.service';
import { AlarmClockService } from './services/alarm-clock/alarm-clock.service';

import { AlarmClockComponent } from './components/alarm-clock/alarm-clock.component';
import { CreateWalletComponent } from './components/create-wallet/create-wallet.component';
import { NotificationComponent } from './components/notification/notification.component';
import { ViewHomeComponent } from './components/view-home/view-home.component';
import { ViewWalletComponent } from './components/view-wallet/view-wallet.component';
import { QrcodeComponent } from './components/qrcode/qrcode.component';
import { CreateAlarmClockComponent } from './components/create-alarm-clock/create-alarm-clock.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { ExampleFeedComponent } from './components/example-feed/example-feed.component';

@NgModule({
  declarations: [
    AppComponent,
    AlarmClockComponent,
    CreateWalletComponent,
    NotificationComponent,
    QrcodeComponent,
    ViewHomeComponent,
    ViewWalletComponent,
    CreateAlarmClockComponent,
    ToolbarComponent,
    ExampleFeedComponent,
  ],
  imports: [
    AngularDateTimePickerModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    LayoutModule,
    FlexLayoutModule,
    MatDialogModule,
    MatExpansionModule,
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
    QRCodeModule
  ],
  exports: [
      MatNativeDateModule,
      MatDialogModule,
  ],
  providers: [
  	Web3Service,
    DelegatedWalletService,
    PaymentDelegateService,
    AlarmClockService,
  ],
  entryComponents: [
      CreateAlarmClockComponent,
      CreateWalletComponent,
      NotificationComponent,
      QrcodeComponent,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
