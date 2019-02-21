import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { ngCopy } from 'angular-6-clipboard';

@Component({
  selector: 'app-qrcode',
  templateUrl: './qrcode.component.html',
  styleUrls: ['./qrcode.component.css']
})
export class QrcodeDialog {

    constructor(
        private dialogRef: MatDialogRef<QrcodeDialog>,
        @Inject(MAT_DIALOG_DATA) public dataToCopy: any,
        public snackbar: MatSnackBar,
    ) { }

    copyToClipboard(){
        ngCopy(this.dataToCopy);

        let snackBarRef = this.snackbar.open(
            "Copied To Clipboard: " + this.dataToCopy,
            'Dismiss',
            {
                duration: 15000,
            }
        );

        snackBarRef.onAction().subscribe(() => {
            snackBarRef.dismiss()
        });
    }
}
