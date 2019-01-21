import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

    constructor() { }

    get(key, label){
        var name = localStorage.getItem(key + "." + label);
        if(!name) return "No " + label + " found";
        return name;
    }

    set(key, label, value){
        localStorage.setItem(key + "." + label, value);
    }
    
}
