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
import { HomeComponent } from './routes/home/home.component';
import { RtxsComponent } from './routes/rtxs/rtxs.component';
import { RtxFeedComponent } from './components/rtx-feed/rtx-feed.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';

import { CreateRtxDialog } from './dialogs/create-rtx/create-rtx.component';
import { CreateWalletDialog } from './dialogs/create-wallet/create-wallet.component';
import { QrcodeDialog } from './dialogs/qrcode/qrcode.component';

import { FromWeiPipe } from './pipes/from-wei/from-wei.pipe';
import { ToDaiPipe } from './pipes/to-dai/to-dai.pipe';
import { OrderByPipe } from './pipes/order-by/order-by.pipe';
import { TransferComponent } from './routes/transfer/transfer.component';
import { DelegatesComponent } from './routes/delegates/delegates.component';
import { RtxComponent } from './components/rtx/rtx.component';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    RtxsComponent,
    RtxFeedComponent,
    ToolbarComponent,
    CreateRtxDialog,
    CreateWalletDialog,
    QrcodeDialog,
    FromWeiPipe,
    ToDaiPipe,
    OrderByPipe,
    TransferComponent,
    DelegatesComponent,
    RtxComponent,
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
    CreateRtxDialog,
    CreateWalletDialog,
    QrcodeDialog,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
