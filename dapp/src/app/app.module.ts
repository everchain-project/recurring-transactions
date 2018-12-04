import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
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
import { AngularDateTimePickerModule } from 'angular2-datetimepicker';
import { QRCodeModule } from 'angularx-qrcode';
import 'hammerjs';

import { Web3Service } from './services/web3/web3.service';
import { AppComponent } from './components/app/app.component';
import { HomeComponent } from './components/home/home.component';
import { AlarmClockComponent } from './components/alarm-clock/alarm-clock.component';
import { LeftNavComponent } from './components/left-nav/left-nav.component';
import { RightNavComponent } from './components/right-nav/right-nav.component';

@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        AlarmClockComponent,
        LeftNavComponent,
        RightNavComponent,
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
        QRCodeModule,
    ],
    exports: [
        MatNativeDateModule,
        MatDialogModule,
    ],
    providers: [
        Web3Service,
    ],
    bootstrap: [
        AppComponent,
    ],
    entryComponents: [
        
    ],
})
export class AppModule {}