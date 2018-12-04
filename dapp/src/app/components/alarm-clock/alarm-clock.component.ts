import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-alarm-clock',
  templateUrl: './alarm-clock.component.html',
  styleUrls: ['./alarm-clock.component.css']
})
export class AlarmClockComponent implements OnInit {

    @Input() alarmClock: any;

    constructor() { }

    ngOnInit() {
        
    }

}
