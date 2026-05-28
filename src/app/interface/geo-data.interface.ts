export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface GeoSignalMessage {
  timestamp: number;
  frequency: number;
  point: GeoPoint;
  zone: GeoPoint[];
}
