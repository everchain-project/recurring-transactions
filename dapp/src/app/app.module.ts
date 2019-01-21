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
    MatCheckboxModule,
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

import { AlarmClockComponent } from './components/alarm-clock/alarm-clock.component';
import { CreateWalletComponent } from './components/create-wallet/create-wallet.component';
import { NotificationComponent } from './components/notification/notification.component';
import { ViewHomeComponent } from './components/view-home/view-home.component';
import { QrcodeComponent } from './components/qrcode/qrcode.component';
import { CreateAlarmClockComponent } from './components/create-alarm-clock/create-alarm-clock.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { ExampleFeedComponent } from './components/example-feed/example-feed.component';
import { ViewWalletDelegatesComponent } from './components/view-wallet-delegates/view-wallet-delegates.component';
import { ViewWalletAlarmsComponent } from './components/view-wallet-alarms/view-wallet-alarms.component';
import { ViewWalletTransferComponent } from './components/view-wallet-transfer/view-wallet-transfer.component';

@NgModule({
  declarations: [
    AppComponent,
    AlarmClockComponent,
    CreateWalletComponent,
    NotificationComponent,
    QrcodeComponent,
    ViewHomeComponent,
    CreateAlarmClockComponent,
    ToolbarComponent,
    ExampleFeedComponent,
    ViewWalletDelegatesComponent,
    ViewWalletAlarmsComponent,
    ViewWalletTransferComponent,
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
    MatCheckboxModule,
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
