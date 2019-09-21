export class ScheduleTime {
    private readonly _totalMinutes: number;

    constructor(hours: number, minutes: number) {
        this._totalMinutes = hours * 60 + minutes;
    }

    get totalMinutes(): number {
        return this._totalMinutes % 60;
    }

    get minutes(): number {
        return this._totalMinutes % 60;
    }

    get hours(): number {
        return (this._totalMinutes - this._totalMinutes % 60) / 60;
    }
}

class ScheduleDate {
    static now(): ScheduleDate {
        return new ScheduleDate(new Date());
    }

    static fromString(dateString: string): ScheduleDate {
        let splitDate = dateString.split("-");
        return new ScheduleDate(new Date(parseInt(splitDate[0]), parseInt(splitDate[1]) - 1, parseInt(splitDate[2])));
    }

    private readonly date: Date;

    private constructor(date: Date) {
        this.date = date;
    }

    copy(): ScheduleDate {
        return new ScheduleDate(new Date(this.date));
    }

    getDay() {
        return this.date.getDay();
    }

    getDate() {
        return this.date.getDate();
    }

    setDate(date: number) {
        this.date.setDate(date);
    }

    getFullYear() {
        return this.date.getFullYear();
    }

    getMonth() {
        return this.date.getMonth();
    }

    toString() {
        return [this.date.getFullYear(), this.date.getMonth() + 1, this.date.getDate()].join("-");
    }
}

class Block {
    startTime: ScheduleTime;
    endTime: ScheduleTime;
    title: string;
    subtitle: string;
    location: string;
    blockTitle: string;
}

abstract class Day {
    date: ScheduleDate;
}

abstract class BlockDay extends Day {
    letter: string;
    blocks: Block[];
}

class RegularDay extends BlockDay {

}

class InlineDay extends BlockDay {
    lateStart: boolean;
}

class TextDay extends Day {
    title: string;
    url: string;
}

class Utilities {
    static getUrlParam(key: string) {
        return new URL(window.location.href).searchParams.get(key);
    }
}

enum ViewMode {
    Day = 1,
    Week = 5,
}

class ScheduleManager {
    static getCalendarUUID(): string {
        let calendarUUID = Utilities.getUrlParam("cal");
        if (calendarUUID == null) {
            alert("Invalid URL! Please check that you have followed the instructions correctly.");
            window.location.href = "./?"; // exits the page
            return "";
        }
        return calendarUUID;
    }

    static getSeedDate(): ScheduleDate {
        const dateString = Utilities.getUrlParam("date");
        if (dateString !== null) {
            return ScheduleDate.fromString(dateString);
        } else {
            return ScheduleDate.now();
        }
    }


    static getViewMode(): ViewMode {
        let newRange = Utilities.getUrlParam("range");
        switch (newRange) {
            case "week":
                return ViewMode.Week;
            case "day":
                return ViewMode.Day;
            default:
                return ViewMode.Week; // TODO: different default for thin screens (phones)
        }
    }
}

class ScheduleRange {
    private readonly _currentDate: ScheduleDate;
    private readonly _nextDate: ScheduleDate;
    private readonly _previousDate: ScheduleDate;
    private readonly _viewMode: ViewMode;

    constructor(currentDate: ScheduleDate, viewMode: ViewMode) { // TODO: Clean up this mess
        this._viewMode = viewMode;
        this._currentDate = currentDate;
        const thisMonday = ScheduleRange.getLastFriday(currentDate);
        thisMonday.setDate(thisMonday.getDate() + 3);
        if (viewMode === ViewMode.Week) {
            // get the previous and next monday for the arrows TODO: Dont modify the dates inside getDatesForWeek so this order doesn't matter
            const previousMonday = thisMonday.copy();
            const nextMonday = thisMonday.copy();
            previousMonday.setDate(thisMonday.getDate() - 7);
            nextMonday.setDate(thisMonday.getDate() + 7);
            this._nextDate = nextMonday;
            this._previousDate = previousMonday;
        } else if (viewMode === ViewMode.Day) {
            let isWeekend = (date: ScheduleDate) => date.getDay() === 0 || date.getDay() === 6;
            let startDate = isWeekend(currentDate) ? thisMonday : currentDate;

            this._nextDate = startDate.copy();
            this._previousDate = startDate.copy();
            this._nextDate.setDate(startDate.getDate() + 1);
            if (isWeekend(this._nextDate)) this._nextDate.setDate(startDate.getDate() + 3);
            this._previousDate.setDate(startDate.getDate() - 1);
            if (isWeekend(this._previousDate)) this._previousDate.setDate(startDate.getDate() - 3);
        } else {
            throw new Error("Unsupported ViewMode value!");
        }
    }

    private static getLastFriday(date: ScheduleDate) {
        let d = date.copy();
        let day = d.getDay();
        let diff = (day <= 5) ? (7 - 5 + day) : (day - 5);

        d.setDate(d.getDate() - diff);
        return d;
    }

    get nextDate(): ScheduleDate {
        return this._nextDate;
    }

    get currentDate(): ScheduleDate {
        return this._currentDate;
    }

    get previousDate(): ScheduleDate {
        return this._previousDate;
    }

    get viewMode(): ViewMode {
        return this._viewMode;
    }
}

class ICalUtils {
    static getVeracrossCalendarFromUUID(calendarUUID: string): Promise<any> {
        return ICalUtils.corsGetPromise(`http://api.veracross.com/catlin/subscribe/${calendarUUID}.ics`).then(icsFile => {
            // @ts-ignore
            return ICAL.parse(icsFile);
        });
    }

    private static corsGetPromise(url: string) {
        return new Promise((resolve, reject) => {
            $.get("https://cors-anywhere.herokuapp.com/" + url, function(raw) {
                resolve(raw);
            }).fail(() => {
                reject();
            });
        });
    }
}

class ScheduleFactory {
    private id: string; // unique id of schedule
    private blocks: Block[];

    constructor(id: string) {
        this.id = id;
    }

    addBlocksICS(calendarUUID: string): Promise<void> {
        return ICalUtils.getVeracrossCalendarFromUUID(calendarUUID).then(parsedCalendar => {
            console.log(parsedCalendar);
        });
    }
}

class CacheManager {

}

class ScheduleRenderer {
    static updateLinks(caldendarUUID: string, range: ScheduleRange) {
        $("#schedarea .sched").addClass(range.viewMode === ViewMode.Week ? "week" : "today");
        // left/right arrows
        let navigationArrows = $("td.arrows a");
        navigationArrows.first().prop("href", "?date=" + range.previousDate.toString() + "&range=" + range + "&cal=" + caldendarUUID);
        navigationArrows.last().prop("href", "?date=" + range.nextDate.toString() + "&range=" + range + "&cal=" + caldendarUUID);

        // this week
        $("#today a").prop("href", "?range=day" + "&cal=" + caldendarUUID);
        $("#this-week a").prop("href", "?range=week" + "&cal=" + caldendarUUID);

        // return to portal link
        $("td.controls.links a").last().prop("href", "https://portals.veracross.com/catlin/student/student/daily-schedule?date=" + range.currentDate.toString());
    }
}

window.addEventListener("load", () => {
    let calendarUUID = ScheduleManager.getCalendarUUID();
    let seedDate = ScheduleManager.getSeedDate();
    let viewMode = ScheduleManager.getViewMode();
    let range = new ScheduleRange(seedDate, viewMode);
    let scheduleFactory = new ScheduleFactory(calendarUUID).addBlocksICS(calendarUUID);
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
new block(event)
map date -> blocks
new day(blocks)

 */
