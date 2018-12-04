import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';

const routes: Routes = [
    { 
        path: '', redirectTo: 'home', pathMatch: 'full' 
    },
    { 
        path: 'home', component: HomeComponent 
    },
    { 
        path: 'account/:accountAddress/', 
        component: HomeComponent
    },
    {
        path: '**', 
        redirectTo: 'home', 
        pathMatch: 'full' 
    },
];

@NgModule({
    imports: [ RouterModule.forRoot(routes) ],
    exports: [ RouterModule ]
})
export class AppRoutingModule {}