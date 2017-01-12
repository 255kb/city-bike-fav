import { Component } from '@angular/core';
import { NavController, ToastController } from 'ionic-angular';
import { BikeProvider } from '../../providers/bike';
import { HomePage } from '../home/home';
import { RouteProvider } from '../../providers/route';
import { UtilsProvider } from '../../providers/utils';
import { StationsFormatterProvider } from '../../providers/stationsFormatter';

@Component({
  selector: 'page-add',
  templateUrl: 'add.html'
})
export class AddPage {
  public currentStep: number = 1;
  public stations: Array<any>;
  public contracts: Array<any>;
  public selectedContract: string = null;
  public selectedStartingStation: number = null;
  public selectedEndingStation: number = null;
  public contractSelected: boolean = false;
  public stationsLoaded: boolean = false;

  constructor(public navCtrl: NavController, public toastController: ToastController, private bikeProvider: BikeProvider, private routeProvider: RouteProvider, private utils: UtilsProvider, private stationsFormatterProvider: StationsFormatterProvider) {
    bikeProvider.getContracts()
      .subscribe((contracts) => {
        this.contracts = contracts.sort(this.utils.compareDesc);
      },
      err => {
        console.log(err);
      });
  }

  public onContractChange(newContract: string) {
    this.contractSelected = true;
    this.selectedContract = newContract;
    this.stationsLoaded = false;

    this.bikeProvider.getStations(newContract)
      .subscribe((stations) => {
        this.stations = this.stationsFormatterProvider.format(stations, true, true, true);
        this.stationsLoaded = true;
      },
      err => {
        console.log(err);
      });
  }

  public addRoute() {
    if (this.selectedContract !== null && this.selectedStartingStation !== null && this.selectedEndingStation !== null) {
      this.routeProvider.addRoute({
        contract: this.selectedContract,
        startStationNumber: this.selectedStartingStation,
        endStationNumber: this.selectedEndingStation
      }).then((result) => {
        this.navCtrl.setPages([{ page: HomePage }]);

        this.toastController.create({
          message: 'Route added',
          duration: 3000
        }).present();
      }).catch((error) => {
        this.toastController.create({
          message: 'Error while saving the route',
          duration: 3000
        }).present();
      });
    }
  }
}
