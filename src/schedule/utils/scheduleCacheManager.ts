import { ScheduleAll } from '../structure/scheduleAll';
import { ScheduleBuilder } from '../building/scheduleBuilder';
import { VeracrossICSRawBlockSource } from '../veracross/veracrossICSRawBlockSource';
import JSONRawBlockSource from '../json/jsonRawBlockSource';
import scheduleParamUtils from './scheduleParamUtils';

export default class ScheduleCacheManager {
    public static readonly LOCAL_STORAGE_KEY = 'scheduleEvents';

    static getSchedule(calendarUUID: string): Promise<any> {
        if (localStorage === undefined) {
            // not supported
            console.log('Local storage is not supported! Loading schedule...');
            return this.reloadSchedulePromise(calendarUUID).then(jsonString => JSON.parse(jsonString));
        }

        let scheduleString = localStorage.getItem(ScheduleCacheManager.LOCAL_STORAGE_KEY);
        if (scheduleString === null) {
            console.log('Schedule cache does not exist! Loading schedule...');
            return this.reloadSchedulePromise(calendarUUID).then(jsonString => JSON.parse(jsonString));
        }

        let scheduleObject = JSON.parse(scheduleString);
        if (scheduleObject.versionNumber === undefined || scheduleObject.versionNumber !== ScheduleAll.CURRENT_VERSION_NUMBER || scheduleObject.id !== calendarUUID || scheduleObject.schoolDivision !== scheduleParamUtils.getSchoolDivision()) {
            console.log('Schedule cache is invalid! Loading schedule...');
            return this.reloadSchedulePromise(calendarUUID).then(jsonString => JSON.parse(jsonString));
        }

        if (scheduleObject.creationTime === undefined || new Date().getTime() - scheduleObject.creationTime > 1000 * 60 * 60 * 24) {
            console.log('Schedule cache is outdated! Loading in the background...');
            this.reloadSchedulePromise(calendarUUID).catch((reason: any) => {// save in the background
                console.warn(reason); // if the cache is just outdated and unable to get the schedule, just use the cached schedule and warn in the debugger;
            });
        }

        console.log('Schedule loaded successfully from cache!');
        return Promise.resolve(scheduleObject);
    }

    private static reloadSchedulePromise(calendarUUID: string): Promise<string> {
        return ScheduleBuilder.generateScheduleFromBlockSources(
            calendarUUID,
            new VeracrossICSRawBlockSource(calendarUUID),
            new JSONRawBlockSource()
        ).then((schedule: ScheduleAll) => {
            let jsonString = JSON.stringify(schedule);
            localStorage.setItem(ScheduleCacheManager.LOCAL_STORAGE_KEY, jsonString);
            console.log('Schedule reloaded from Veracross and saved to localStorage!');
            return jsonString;
        });
    }
}
