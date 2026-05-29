import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { GeoDataHistoryService } from '../../services/geo-data-history.service';

@Component({
  selector: 'app-player-controls',
  imports: [MatIcon, MatButton, MatIconButton, MatSlider, MatSliderThumb, DatePipe],
  templateUrl: './player-controls.component.html',
  styleUrl: './player-controls.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerControls {
  public readonly historyService = inject(GeoDataHistoryService);

  public currentIndex = signal(0);

  public timeStamps = signal<number[]>([]);
  public isPlay = true;
  public isLive = true;

  public min = signal(0);
  public max = signal(1);

  public emitPlay = output<boolean>();
  public emitLive = output<void>();
  public emitTimestamp = output<number>();

  public snapshotInfo = computed(() => {
    const snapshot = this.historyService.getByIndex(this.currentIndex());
    if (snapshot) {
      const { timestamp, frequency } = snapshot;
      return { timestamp, frequency };
    }
    return { timestamp: Date.now(), frequency: 0 };
  });

  constructor() {
    this.historyService.historySubject$.pipe(takeUntilDestroyed()).subscribe((history) => {
      if (history.length > 1) {
        const lastIndex = history.length - 1;
        this.max.set(lastIndex);
        this.timeStamps.set(history.map((_, index) => index));
        if (this.isPlay && this.isLive) {
          this.currentIndex.set(lastIndex);
        }
      }
    });
  }

  public playPause(e: PointerEvent) {
    e.stopPropagation();
    if (this.isPlay) {
      this.pause();
    } else {
      this.play();
    }
  }

  handleTimestampChange(timeStampIndex: number) {
    this.pause();
    this.currentIndex.set(timeStampIndex);
    this.emitTimestamp.emit(timeStampIndex);
  }

  play() {
    this.isPlay = true;
    this.isLive = false;
    this.emitPlay.emit(true);
  }

  pause() {
    this.isPlay = false;
    this.isLive = false;
    this.emitPlay.emit(false);
  }

  playLive() {
    this.currentIndex.set(this.max());
    this.isPlay = true;
    this.isLive = true;
    this.emitLive.emit();
  }
}
