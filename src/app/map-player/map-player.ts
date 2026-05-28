import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  Map,
  map as leafletMap,
  tileLayer,
  polygon as leafletPolygon,
  Polygon,
  marker as leafletMarker,
  Marker,
  Icon,
} from 'leaflet';
import { PlayerControls } from './components/player-controls/player-controls.component';
import { FakeGeoWebsocketService } from './services/fake-geo-websocket.service';
import { GeoDataConverter } from './services/geo-data-converter';
import { throttleTime } from 'rxjs';
import { GeoDataHistoryService } from './services/geo-data-history.service';
import { GeoSignalMessage } from '../interface/geo-data.interface';

@Component({
  selector: 'app-map-player',
  imports: [PlayerControls],
  templateUrl: './map-player.html',
  styleUrl: './map-player.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FakeGeoWebsocketService, GeoDataConverter, GeoDataHistoryService],
})
export default class MapPlayer implements OnInit, AfterViewInit {
  private readonly geoWebsocketService = inject(FakeGeoWebsocketService);
  private readonly geoDataHistoryService = inject(GeoDataHistoryService);
  private readonly geoDataConverter = inject(GeoDataConverter);

  private map!: WritableSignal<Map>;

  private polygon: Polygon | null = null;
  private marker: Marker | null = null;
  private play: boolean = true;

  private readonly icon = new Icon({
    iconUrl: 'marker.svg',
    iconSize: [64, 64],
    iconAnchor: [32, 32],
  });

  constructor() {
    this.geoWebsocketService.stream$
      .pipe(takeUntilDestroyed(), throttleTime(100))
      .subscribe((data) => {
        if (this.play) {
          this.handleGeoData(data)
        } else {
          this.geoDataHistoryService.add(data);
        }
      });
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this.initMap();
    this.centerMap();
  }

  private initMap() {
    const baseMapURl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    this.map = signal(leafletMap('map'));
    tileLayer(baseMapURl).addTo(this.map());
  }

  private centerMap() {
    const bounds = this.polygon?.getBounds();
    if (this.marker) {
      bounds?.extend(this.marker.getLatLng());
    }
    if (!bounds) {
      // TODO: fit default
    }
    if (bounds) {
      this.map().fitBounds(bounds, { padding: [80, 80] });
    }
  }

  private handleGeoData(data: GeoSignalMessage) {
    this.geoDataHistoryService.add(data);
    this.renderGeoData(data);
    this.centerMap();
  }

  private renderGeoData(data: GeoSignalMessage) {
    const { marker, polygon } = this.geoDataConverter.convertGeoDataEntity(data);

    if (polygon) {
      this.polygon?.remove();
      this.polygon = leafletPolygon(polygon).addTo(this.map());
    }
    if (marker) {
      this.marker?.remove();
      this.marker = leafletMarker(marker, { icon: this.icon }).addTo(this.map());
    }
  }

  onPlay(play: boolean) {
    this.play = play;
  }

  onLive() {
    console.log('live');
  }

  onChangeTimestamp(index: number) {
    const geoData = this.geoDataHistoryService.getByIndex(index);

    if (geoData) {
      this.renderGeoData(geoData);
      this.centerMap();
    }
  }
}
