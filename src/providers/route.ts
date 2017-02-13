import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { IRoute } from '../interfaces/IRoute';
import { Observable } from 'rxjs/Rx';
import { BikeProvider } from './bike';

@Injectable()
export class RouteProvider {
  private routesStorageKeyName: string = 'routes';
  private routes: Array<IRoute>;
  private timer: Observable<number>;

  constructor(private storage: Storage, private bikeProvider: BikeProvider) {
    //set timer to fetch stations infos every 60 seconds
    this.timer = Observable.timer(1000, 60 * 1000);

    //get stations info
    this.timer.subscribe(() => {
      this.refreshRoutes();
    });
  }

  public getRoutes(): Promise<Array<IRoute>> {
    if (!this.routes) {
      return new Promise((resolve, reject) => {
        this.storage.get(this.routesStorageKeyName).then((routesString: string) => {
          if (!routesString) {
            this.routes = [];
          } else {
            this.routes = JSON.parse(routesString);
          }
          resolve(this.routes);
        }).catch((error) => {
          reject(error);
        });
      });
    } else {
      return Promise.resolve(this.routes);
    }
  }

  public addRoute(route: IRoute): void {
    this.routes.unshift(route);
    this.refreshRoutes();
  }

  public removeRoute(routeId: number): void {
    //remove from routes array
    if (routeId > -1 && routeId < this.routes.length) {
      this.routes.splice(routeId, 1);

      this.storage.set(this.routesStorageKeyName, JSON.stringify(this.routes)).then((routesString: string) => {
      }).catch((error) => {
        console.log('error while removing route');
      });
    } else {
      throw new Error('route index out of bounds');
    }
  }

  public refreshRoutes() {
    let observables = [];
    this.routes.forEach((route, index) => {
      observables.push(this.bikeProvider.getStations(route.contract, route.startStation.number).do((startStationData) => {
        route.startStation.data = this.setStationColor(startStationData, 'start');
      }));
      observables.push(this.bikeProvider.getStations(route.contract, route.endStation.number).do((endStationData) => {
        route.endStation.data = this.setStationColor(endStationData, 'end');
      }));
    });

    //subscribe to all at once
    Observable.merge(...observables).subscribe(() => {}, (error) => {
      console.log(error);
    }, () => {
      //save to local storage when everything completes
      this.storage.set(this.routesStorageKeyName, JSON.stringify(this.routes)).then((routesString: string) => {
      }).catch((error) => {
        console.log(error);
      });
    });
  }

  private setStationColor(stationData: any, type: string): any {
    let stationProperty = 'available_bikes';
    if (type === 'end') {
      stationProperty = 'available_bike_stands';
    }
    if (stationData[stationProperty] == 0) {
      stationData.color = 'red';
    } else if (stationData[stationProperty] > 0 && stationData[stationProperty] <= 2) {
      stationData.color = 'orange';
    } else if (stationData[stationProperty] > 2) {
      stationData.color = 'green';
    }

    return stationData;
  }
}
