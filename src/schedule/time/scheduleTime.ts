export default class ScheduleTime {
    static now = (): ScheduleTime => ScheduleTime.fromDate(new Date());
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

    equals(other: ScheduleTime): boolean {
        return other.totalMinutes === this.totalMinutes;
    }

    compareTo(other: ScheduleTime): number {
        return this.totalMinutes - other.totalMinutes;
    }

    toJSON(): number {
        return this.totalMinutes;
    }

    to12HourString(): string {
        return ((this.hours - 1) % 12) + 1 + ':' + (this.minutes < 10 ? '0' : '') + this.minutes;
    }

    toDate(): Date {
        return new Date(0,0,0,this.hours, this.minutes);
    }
}
