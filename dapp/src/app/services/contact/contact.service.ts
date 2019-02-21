import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ContactService {

    account: string;
    list = [];

	constructor(){}

    setAccount(address){
        this.account = address;
        var contacts = JSON.parse(localStorage.getItem(this.account + ".contacts"));
        if(!contacts) {
            contacts = [];
            this.saveContactList(contacts);
        }

        this.list = contacts;
    }

    getName(contactAddress){
        return localStorage.getItem(this.account + '.' + contactAddress + ".name");
    }

	add(contactAddress, contactName){
        if(!this.list.includes(contactAddress)){
            this.list.push(contactAddress);
            this.saveContactList(this.list);
        }
        
        this.updateContact(contactAddress, contactName);
    }

    remove(contactAddress){
        for (var i = this.list.length - 1; i >= 0; i--) {
            if(this.list[i] == contactAddress){
                var removed = this.list.splice(i,1)
                this.saveContactList(this.list)
            }
        }
    }

    updateContact(contactAddress, contactName){
        localStorage.setItem(this.account + '.' + contactAddress + ".name", contactName);
    }    

    private saveContactList(contacts){
        localStorage.setItem(this.account + ".contacts", JSON.stringify(contacts));
    }

}
