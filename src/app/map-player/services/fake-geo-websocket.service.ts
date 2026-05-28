import { Injectable } from '@angular/core';
import { Observable, interval, map, shareReplay } from 'rxjs';
import { GeoPoint, GeoSignalMessage } from '../../interface/geo-data.interface';


@Injectable()
export class FakeGeoWebsocketService {
  /**
   * Fake websocket stream
   * emits every 2 seconds
   */
  readonly stream$: Observable<GeoSignalMessage> = interval(2000).pipe(
    map(() => this.generateMessage()),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  private readonly baseLat = 50.01;
  private readonly baseLon = 30.01;

  private generateMessage(): GeoSignalMessage {
    const center = this.randomizePoint(this.baseLat, this.baseLon);

    return {
      timestamp: Date.now(),
      frequency: this.randomFloat(430, 470, 1),
      point: this.randomizePoint(this.baseLat, this.baseLon),
      zone: this.generatePolygon(center, 8),
    };
  }

  private generatePolygon(
    center: GeoPoint,
    pointsCount: number,
  ): GeoPoint[] {
    const result: GeoPoint[] = [];

    for (let i = 0; i < pointsCount; i++) {
      const angle = (Math.PI * 2 * i) / pointsCount;

      // random radius ~ 500-1500 meters
      const radius = this.randomFloat(0.003, 0.015, 6);

      result.push({
        lat: Number(
          (center.lat + Math.cos(angle) * radius).toFixed(6),
        ),
        lon: Number(
          (center.lon + Math.sin(angle) * radius).toFixed(6),
        ),
      });
    }

    return result;
  }

  private randomizePoint(lat: number, lon: number): GeoPoint {
    return {
      lat: Number(
        (lat + this.randomFloat(-0.005, 0.005, 6)).toFixed(6),
      ),
      lon: Number(
        (lon + this.randomFloat(-0.005, 0.005, 6)).toFixed(6),
      ),
    };
  }

  private randomFloat(
    min: number,
    max: number,
    decimals = 2,
  ): number {
    return Number(
      (Math.random() * (max - min) + min).toFixed(decimals),
    );
  }
}
