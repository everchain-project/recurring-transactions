import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material';

@Component({
    selector: 'popup-notification',
    template: '	<div fxLayout="row">'
    		+ '		<div fxLayout="column" fxFlex>'
    		+ '			<h4 style="margin: 4px 0px;">{{ data.title }}</h4>'
            + '			<small fxlayout="row">'
            + '			   {{ data.msg }}'
            + '			</small>'
            + '		</div>'
            + '		&nbsp;<button *ngIf="data.onClick" mat-button (click)="data.onClick()">{{data.buttonText}}</button>'
            + ' </div>',
})
export class NotificationComponent {
    constructor(
        @Inject(MAT_SNACK_BAR_DATA) public data: any,
    ){}
}
