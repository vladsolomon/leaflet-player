import { Injectable } from '@angular/core';
import { GeoPoint, GeoSignalMessage } from '../../interface/geo-data.interface';
import { latLng, LatLngExpression } from 'leaflet';

@Injectable()
export class GeoDataConverter {
  toLeafletLatLng(point?: GeoPoint): LatLngExpression | null {
    if (point?.lat == null || point?.lon == null) {
      return null;
    }

    return latLng(point.lat, point.lon);
  }

  toLeafletPolygon(points: GeoPoint[]): LatLngExpression[] | null {
    return points.filter((p) => p?.lat && p?.lon).map((p) => latLng(p.lat, p.lon));
  }

  convertGeoDataEntity(data: GeoSignalMessage): {
    marker: LatLngExpression | null;
    polygon: LatLngExpression[] | null;
  } {
    const marker = this.toLeafletLatLng(data.point);
    const polygon = this.toLeafletPolygon(data.zone);

    return {
      marker,
      polygon,
    };
  }
}
