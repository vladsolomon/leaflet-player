import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GeoSignalMessage } from '@app/interface/geo-data.interface';

const HOURS_LIMIT = 12;

@Injectable()
export class GeoDataHistoryService {
  private readonly LIMIT = HOURS_LIMIT * 60 * 60 * 1000;
  public readonly historySubject$ = new BehaviorSubject<GeoSignalMessage[]>([]);

  public history: GeoSignalMessage[] = [];

  public add(message: GeoSignalMessage): void {
    this.history.push(message);
    this.historySubject$.next(this.history);
  }

  public getLast(count: number): GeoSignalMessage[] {
    if (count <= 0) {
      return [];
    }
    return this.history.slice(-count);
  }

  public getByIndex(index: number): GeoSignalMessage {
    return this.history[index];
  }

  public getByTimestamp(timestamp: number): GeoSignalMessage | undefined {
    const closest = this.findClosestTimestamp(
      timestamp,
      this.history.map((historyItem) => historyItem.timestamp),
    );
    return this.history.find((historyItem) => (historyItem.timestamp = closest));
  }

  public clear(): void {
    this.history = [];
    this.historySubject$.next(this.history);
  }

  // TODO: trim old snapshots, do this every minute (maybe)
  public trim(): void {
    if (this.history.length <= 1) {
      return;
    }

    const cutOff = Date.now() - this.LIMIT;

    if (this.history[0].timestamp >= cutOff) {
      return;
    }

    let i = 0;
    while (i < this.history.length && this.history[i].timestamp < cutOff) {
      i++;
    }
    if (i === 0) {
      return;
    }

    this.history.splice(0, i);
    this.historySubject$.next(this.history);
  }

  // TODO: switch from index-based to timestamp-based player logic
  private findClosestTimestamp(target: number, timestamps: number[]) {
    let closest = timestamps[0];

    for (const ts of timestamps) {
      if (Math.abs(ts - target) < Math.abs(closest - target)) {
        closest = ts;
      }
    }

    return closest;
  }
}
