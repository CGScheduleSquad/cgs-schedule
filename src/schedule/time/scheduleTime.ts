export class ScheduleTime {
  static fromDate(date: Date) {
    return new ScheduleTime(date.getHours(), date.getMinutes());
  }

  readonly totalMinutes: number;

  constructor(hours: number, minutes: number) {
    this.totalMinutes = hours * 60 + minutes;
  }

  get minutes(): number {
    return this.totalMinutes % 60;
  }

  get hours(): number {
    return (this.totalMinutes - this.totalMinutes % 60) / 60;
  }

  equals(other: ScheduleTime) {
    return other.totalMinutes == this.totalMinutes;
  }

  compareTo(other: ScheduleTime) {
    return this.totalMinutes - other.totalMinutes;
  }

  toJSON() {
    return this.totalMinutes;
  }
}

