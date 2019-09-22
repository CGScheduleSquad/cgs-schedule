import ScheduleTime from '../time/scheduleTime';
import { ScheduleDayMeta } from './scheduleDay';
import { CompressionManager } from '../compressionManager';
import ScheduleDate from '../time/scheduleDate';

class ScheduleBlock {
    readonly title: string;
    readonly location: string;
    readonly label: string;

    constructor(title: string, location: string, label: string) {
        this.title = title;
        this.location = location;
        this.label = label;
    }
}

export class RawBlock extends ScheduleBlock {
    readonly date: ScheduleDate;
    readonly dayMeta: ScheduleDayMeta;
    readonly startTime: ScheduleTime;
    readonly endTime: ScheduleTime | null;

    constructor(title: string, location: string, label: string, date: ScheduleDate, dayMeta: ScheduleDayMeta, startTime: ScheduleTime, endTime: ScheduleTime | null) {
        super(title, location, label);
        this.date = date;
        this.dayMeta = dayMeta;
        this.startTime = startTime;
        this.endTime = endTime;
    }
}

export class RegularDayBlock extends ScheduleBlock {
    readonly timeIndex: number;
    readonly rowSpan: number;
    readonly durationMins: number;
    readonly free: boolean;

    constructor(title: string, location: string, label: string, timeIndex: number, rowSpan: number, durationMins: number, free: boolean) {
        super(title, location, label);
        this.timeIndex = timeIndex;
        this.rowSpan = rowSpan;
        this.durationMins = durationMins;
        this.free = free;
    }

    toJSON(): any {
        // copy all fields from `this` to an empty object and return in
        return [CompressionManager.processCompressString(this.title), CompressionManager.processCompressString(this.location), this.label, this.timeIndex, this.rowSpan, this.durationMins, this.free];
    }
}

export class InlineDayBlock extends ScheduleBlock {
    readonly startTime: ScheduleTime;
    readonly endTime: ScheduleTime;
    readonly durationMins: number; // TODO: not needed with both a start and end time
    readonly free: boolean;

    constructor(title: string, location: string, label: string, startTime: ScheduleTime, endTime: ScheduleTime, durationMins: number, free: boolean) {
        super(title, location, label);
        this.startTime = startTime;
        this.endTime = endTime;
        this.durationMins = durationMins;
        this.free = free;
    }

    toJSON(): any {
        // copy all fields from `this` to an empty object and return in
        return [CompressionManager.processCompressString(this.title), CompressionManager.processCompressString(this.location), this.label, this.startTime, this.endTime, this.durationMins, this.free];
    }
}
