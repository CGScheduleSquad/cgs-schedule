import { ScheduleRange, ViewMode } from './rendering/scheduleRange';
import { ScheduleBuilder } from './building/scheduleBuilder';
import { ScheduleAll } from './structure/scheduleAll';
import { VeracrossICSRawBlockSource } from './veracross/veracrossICSRawBlockSource';
import { ScheduleDate } from './time/scheduleDate';
import { ScheduleRenderer } from './rendering/scheduleRenderer';

class ScheduleParamUtils {
    static getCalendarUUID(): string {
        let calendarUUID = ScheduleParamUtils.getUrlParam("cal");
        if (calendarUUID == null) {
            alert("Invalid URL! Please check that you have followed the instructions correctly.");
            window.location.href = "./?"; // exits the page
            return "";
        }
        return calendarUUID;
    }

    static getSeedDate(): ScheduleDate {
        const dateString = ScheduleParamUtils.getUrlParam("date");
        if (dateString !== null) {
            return ScheduleDate.fromString(dateString);
        } else {
            return ScheduleDate.now();
        }
    }


    static getViewMode(): ViewMode {
        let newRange = ScheduleParamUtils.getUrlParam("range");
        switch (newRange) {
            case "week":
                return ViewMode.Week;
            case "day":
                return ViewMode.Day;
            default:
                return ViewMode.Week; // TODO: different default for thin screens (phones)
        }
    }

    private static getUrlParam(key: string) {
        return new URL(window.location.href).searchParams.get(key);
    }
}

class ScheduleCacheManager {
    public static readonly LOCAL_STORAGE_KEY = 'scheduleEvents';

    static getSchedule(calendarUUID: string): Promise<ScheduleAll> {
        let scheduleString = localStorage.getItem(ScheduleCacheManager.LOCAL_STORAGE_KEY);
        if (scheduleString === null) {
            return this.reloadSchedulePromise(calendarUUID);
        }

        let scheduleObject = JSON.parse(scheduleString);


    }

    private static reloadSchedulePromise(calendarUUID: string): Promise<ScheduleAll> {
        return ScheduleBuilder.generateScheduleFromBlockSources(calendarUUID, new VeracrossICSRawBlockSource(calendarUUID)).then((schedule: ScheduleAll) => {
            localStorage.setItem('scheduleEvents', JSON.stringify(schedule));
            console.log(schedule);
            console.log(JSON.stringify(schedule));
            debugger;
        });
    }
}

window.addEventListener("load", () => {
    let calendarUUID = ScheduleParamUtils.getCalendarUUID();
    let seedDate = ScheduleParamUtils.getSeedDate();
    let viewMode = ScheduleParamUtils.getViewMode();
    let range = new ScheduleRange(seedDate, viewMode);

    ScheduleCacheManager.getSchedule(calendarUUID);


    ScheduleRenderer.updateLinks(calendarUUID, range);
});

/*
//Promise chain:
load data
    if load from cache if valid
    else download and process cal data
    save to cache
render data

//Cal data process:
new toBlock(event)
map date -> blocks
new day(blocks)

 */
