import { ScheduleDay } from './scheduleDay';
import ScheduleCompressionManager from '../utils/scheduleCompressionManager';

export class ScheduleAll {
    public static readonly CURRENT_VERSION_NUMBER = 4;

    readonly versionNumber: number;
    readonly id: string; // unique id
    readonly schoolDivision: string; // unique id
    readonly creationTime: number;
    readonly dayMap: Map<string, ScheduleDay>; // maps date string "2020-1-2" to ScheduleDay

    constructor(id: string, dayMap: Map<string, ScheduleDay>, schoolDivision: string) {
        this.versionNumber = ScheduleAll.CURRENT_VERSION_NUMBER;
        this.creationTime = new Date().getTime();
        this.id = id;
        this.schoolDivision = schoolDivision;
        this.dayMap = dayMap;
    }

    getDay(dateString: string): ScheduleDay | undefined {
        return this.dayMap.get(dateString);
    }

    toJSON(): any {
        // copy all fields from `this` to an empty object and return in
        return Object.assign({}, this, {
            // convert fields that need converting
            dayMap: ScheduleAll.dayMapToObj(this.dayMap),
            compressionList: ScheduleCompressionManager.compressionList
        });
    }

    static dayMapToObj(strMap: Map<string, ScheduleDay>): object {
        ScheduleCompressionManager.resetCompressionList();
        let obj = {};
        strMap.forEach((day: ScheduleDay, dateString: string) => {
            // @ts-ignore
            obj[dateString] = day;
        });
        return obj;
    }
}
