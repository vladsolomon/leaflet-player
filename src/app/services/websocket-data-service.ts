import { Injectable } from '@angular/core';
import { GeoSignalMessage } from '@app/interface/geo-data.interface';
import { Observable } from 'rxjs/internal/Observable';

@Injectable()
export abstract class WebsocketGeoDataService {
  public abstract stream$: Observable<GeoSignalMessage>;

  abstract connect(url: string): void;
  abstract send(message: any): void;
  abstract disconnect(): void;
}
