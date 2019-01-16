import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';
import { ngCopy } from 'angular-6-clipboard';

import { NotificationComponent } from '../notification/notification.component';

@Component({
  selector: 'app-qrcode',
  templateUrl: './qrcode.component.html',
  styleUrls: ['./qrcode.component.css']
})
export class QrcodeComponent {

	constructor(
		private dialogRef: MatDialogRef<QrcodeComponent>,
		@Inject(MAT_DIALOG_DATA) public dataToCopy: any,
		public snackbar: MatSnackBar,
	) { }

	copyToClipboard(){
	    ngCopy(this.dataToCopy);

	    let snackBarRef = this.snackbar.openFromComponent(NotificationComponent, {
	        duration: 5000,
	        data: {
	            title: "Copied to Clipboard",
	            msg: this.dataToCopy
	        }
	    });
	}
}
