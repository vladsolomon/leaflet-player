import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  signal,
  ViewChild,
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
import { interval, Subscription, throttleTime } from 'rxjs';
import { GeoDataHistoryService } from './services/geo-data-history.service';
import { GeoSignalMessage } from '@app/interface/geo-data.interface';
import { WebsocketGeoDataService } from '@app/services/websocket-data-service';

@Component({
  selector: 'app-map-player',
  imports: [PlayerControls],
  templateUrl: './map-player.html',
  styleUrl: './map-player.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    GeoDataConverter,
    GeoDataHistoryService,
    {
      provide: WebsocketGeoDataService,
      useClass: FakeGeoWebsocketService,
    },
  ],
})
export default class MapPlayer implements AfterViewInit, OnDestroy {
  private readonly geoWebsocketService = inject(WebsocketGeoDataService);
  private readonly geoDataHistoryService = inject(GeoDataHistoryService);
  private readonly geoDataConverter = inject(GeoDataConverter);

  private playSubscription!: Subscription;

  @ViewChild(PlayerControls) public controls!: PlayerControls;

  private map!: WritableSignal<Map>;

  private polygon: Polygon | null = null;
  private marker: Marker | null = null;

  private readonly icon = new Icon({
    iconUrl: 'marker.svg',
    iconSize: [64, 64],
    iconAnchor: [32, 32],
  });

  constructor() {
    this.geoWebsocketService.connect('url');
    this.geoWebsocketService.stream$
      .pipe(takeUntilDestroyed(), throttleTime(100))
      .subscribe((data) => {
        if (this.controls.isLive) {
          this.handleGeoData(data);
        } else {
          this.geoDataHistoryService.add(data);
        }
      });
  }

  ngAfterViewInit() {
    this.initMap();
    this.centerMap();
  }

  ngOnDestroy() {
    this.stopPlayingHistory();
    this.geoWebsocketService.disconnect();
  }

  private initMap() {
    const baseMapURl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    this.map = signal(leafletMap('map'));
    tileLayer(baseMapURl).addTo(this.map());
  }

  private centerMap() {
    const bounds = this.polygon?.getBounds();
    if (this.marker && bounds) {
      bounds?.extend(this.marker.getLatLng());
    }
    if (!bounds) {
      // TODO: fit default
      return;
    }
    this.map().fitBounds(bounds, { padding: [80, 80] });
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

  onPlay() {
    // On Play
    if (this.controls.isPlay && !this.controls.isLive) {
      this.playSubscription = interval(2000).subscribe(() => {
        const index = this.controls.currentIndex();
        this.controls.currentIndex.set(index + 1);
        const snapshot = this.geoDataHistoryService.getByIndex(index + 1);
        this.renderGeoData(snapshot);
        this.centerMap();
      });
    }
    // On Pause
    if (!this.controls.isPlay) {
      this.stopPlayingHistory();
    }
  }

  onLive() {
    this.stopPlayingHistory();
    this.onChangeTimestamp(this.controls.max() - 1);
  }

  onChangeTimestamp(index: number) {
    const geoData = this.geoDataHistoryService.getByIndex(index);

    if (geoData) {
      this.renderGeoData(geoData);
      this.centerMap();
    }
  }

  private stopPlayingHistory() {
    if (this.playSubscription) {
      this.playSubscription.unsubscribe();
    }
  }
}
