export default class ScheduleTime {
  static fromDate = (date: Date): ScheduleTime => new ScheduleTime(date.getHours(), date.getMinutes());

  readonly totalMinutes: number;

  constructor(hours: number, minutes: number) {
    this.totalMinutes = hours * 60 + minutes;
  }

  get minutes(): number {
    return this.totalMinutes % 60;
  }

  get hours(): number {
    return (this.totalMinutes - (this.totalMinutes % 60)) / 60;
  }

  equals = (other: ScheduleTime): boolean => other.totalMinutes === this.totalMinutes;

  compareTo = (other: ScheduleTime): number => this.totalMinutes - other.totalMinutes;

  toJSON = (): number => this.totalMinutes;
}
