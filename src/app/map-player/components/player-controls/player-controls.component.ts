import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  signal,
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { GeoDataHistoryService } from '../../services/geo-data-history.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-player-controls',
  imports: [MatIcon, MatButton, MatIconButton, MatSlider, MatSliderThumb],
  templateUrl: './player-controls.component.html',
  styleUrl: './player-controls.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerControls {
  public readonly historyService = inject(GeoDataHistoryService);

  public currentTimestamp = signal(0);
  public currentIndex = signal(0);
  // public currentIndex = computed(() =>
  //   this.historyService.history.map((h) => h.timestamp).findIndex(this.currentTimestamp),
  // );

  public timeStamps = signal<number[]>([]);
  public isStopped = false;

  public min = signal(0);
  public max = signal(1);

  public emitPlay = output<boolean>();
  public emitLive = output<void>();
  public emitTimestamp = output<number>();

  constructor() {
    this.historyService.historySubject$.pipe(takeUntilDestroyed()).subscribe((history) => {
      if (history.length > 1) {
        const lastIndex = history.length - 1;
        // const last = history[history.length - 1].timestamp;
        // this.min.set(history[0].timestamp);
        this.max.set(lastIndex);
        this.timeStamps.set(history.map((_, index) => index));
        if (!this.isStopped) {
          this.currentIndex.set(lastIndex);
        }
      }
    });
  }

  public playPause(e: PointerEvent) {
    e.stopPropagation();
    if (this.isStopped) {
      this.play();
    } else {
      this.pause();
    }
  }

  handleTimestampChange(timeStamp: number) {
    this.pause();
    this.emitTimestamp.emit(timeStamp);
  }

  play() {
    this.isStopped = false;
    this.emitPlay.emit(true);
  }

  pause() {
    this.isStopped = true;
    this.emitPlay.emit(false);
  }

  playLive() {
    this.emitLive.emit();
  }
}
