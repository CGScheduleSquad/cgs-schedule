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

class ScheduleDate {
    static now(): ScheduleDate {
        return new ScheduleDate(new Date());
    }

    static fromString(dateString: string): ScheduleDate {
        let splitDate = dateString.split("-");
        return new ScheduleDate(new Date(parseInt(splitDate[0]), parseInt(splitDate[1]) - 1, parseInt(splitDate[2])));
    }

    static fromDate(date: Date): ScheduleDate {
        return new ScheduleDate(date);
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

    toJSON() {
        return this.toString();
    }
}

class Block {
    readonly title: string;
    readonly location: string;
    readonly label: string;

    constructor(title: string, location: string, label: string) {
        this.title = title;
        this.location = location;
        this.label = label;
    }
}

class RawBlock extends Block {
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

class RegularDayBlock extends Block {
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
        return [
            Schedule.processCompressString(this.title),
            Schedule.processCompressString(this.location),
            this.label,
            this.timeIndex,
            this.rowSpan,
            this.durationMins,
            this.free
        ];
    }
}

class InlineDayBlock extends Block {
    readonly startTime: ScheduleTime;
    readonly endTime: ScheduleTime;
    readonly durationMins: number;
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
        return [
            Schedule.processCompressString(this.title),
            Schedule.processCompressString(this.location),
            this.label,
            this.startTime,
            this.endTime,
            this.durationMins,
            this.free
        ];
    }
}

class ScheduleDayMeta {
    readonly letter: string;

    constructor(letter: string) {
        this.letter = letter;
    }

    toJSON(): any {
        return this.letter;
    }
}

const normalTimes = [
    new ScheduleTime(8, 0),
    new ScheduleTime(8, 45),
    new ScheduleTime(9, 20),
    new ScheduleTime(9, 30),
    new ScheduleTime(9, 45),
    new ScheduleTime(10, 35),
    new ScheduleTime(11, 20),
    new ScheduleTime(11, 55),
    new ScheduleTime(12, 30),
    new ScheduleTime(13, 10),
    new ScheduleTime(13, 40),
    new ScheduleTime(14, 30)
];

let schoolEndTime = new ScheduleTime(15, 15);
let normalAllTimes = normalTimes.concat([schoolEndTime]);

enum ScheduleDayType {
    REGULAR,
    INLINE,
    TEXT
}

abstract class ScheduleDay {
    date: ScheduleDate;
    dayMeta: ScheduleDayMeta;
    type: ScheduleDayType;

    protected constructor(date: ScheduleDate, dayMeta: ScheduleDayMeta) {
        this.date = date;
        this.dayMeta = dayMeta;
        this.type = this.getType();
    }

    static createBlockDay(rawBlocks: RawBlock[]): ScheduleDay {
        let dayWithDate = rawBlocks.find(rawBlock => rawBlock.date !== null);
        if (dayWithDate === undefined) {
            throw new Error("No blocks contain a day! This should be impossible.");
        }
        let dayDate = dayWithDate.date;

        let dayWithMeta = rawBlocks.find(rawBlock => rawBlock.dayMeta !== null);
        let dayMeta = dayWithMeta !== undefined ? dayWithMeta.dayMeta : new ScheduleDayMeta(""); // default day meta if no blocks have info

        if (this.isRegularDay(rawBlocks)) {
            return RegularDay.fromRawBlocks(dayDate, dayMeta, rawBlocks);
        } else {
            return InlineDay.fromRawBlocks(dayDate, dayMeta, rawBlocks);
        }
    }

    private static isRegularDay(rawBlocks: RawBlock[]) {
        return rawBlocks.every(block => {
            let startHours = block.startTime.hours;
            let startMinutes = block.startTime.minutes;
            if (isNaN(startHours) || startHours < 8 || startHours >= 12 + 3) // TODO: time comparators
                return true;
            return normalTimes.some(
                time => startHours === time.hours && startMinutes === time.minutes
            );
        });
    }

    abstract getType(): ScheduleDayType;

    // abstract toJSON(): any;
    toJSON(): any {
        // copy all fields from `this` to an empty object and return in
        return Object.assign({}, this, {
            // convert fields that need converting
            date: undefined
        });
    }
}

class RegularDay extends ScheduleDay {
    blocks: RegularDayBlock[];

    constructor(date: ScheduleDate, dayMeta: ScheduleDayMeta, blocks: RegularDayBlock[]) {
        super(date, dayMeta);
        this.blocks = blocks;
    }

    static fromRawBlocks(date: ScheduleDate, dayMeta: ScheduleDayMeta, sortedRawBlocks: RawBlock[]): RegularDay {
        sortedRawBlocks.push(new RawBlock("", "", "", ScheduleDate.now(), new ScheduleDayMeta(""), new ScheduleTime(24, 0), null));
        let regularDayBlocks = new Array<RegularDayBlock>();
        let timeIndex = 0;
        sortedRawBlocks.forEach((rawBlock: RawBlock) => {
            while (timeIndex < normalTimes.length && rawBlock.startTime.totalMinutes > normalTimes[timeIndex].totalMinutes) {
                let title = "Free";
                let label = "";
                switch (timeIndex) {
                    // case 3:
                    //     title = 'Break';
                    //     break;
                    case 6:
                        label = "AM Flex";
                        break;
                    case 7:
                        title = "Co-Curric";
                        break;
                    // case 8:
                    //     title = 'Lunch';
                    //     break;
                    case 9:
                        label = "PM Flex";
                        break;
                }
                let rowSpan = 1; // TODO: free block merging
                let durationMins = Math.min(Math.max(normalAllTimes[timeIndex + rowSpan].totalMinutes - normalAllTimes[timeIndex].totalMinutes, 5), 90); // double sided constrain
                regularDayBlocks.push(new RegularDayBlock(title, "", label, timeIndex, rowSpan, durationMins, true));
                timeIndex++;
            }

            if (timeIndex >= normalTimes.length) return;

            let rowSpan = 1;
            if (timeIndex < normalTimes.length - 1 &&
                (rawBlock.label.match(/.L/) != null || rawBlock.title === "Assembly")
            ) {
                rowSpan++;
                timeIndex++;
            }
            let durationMins = Math.min(Math.max(normalAllTimes[timeIndex + rowSpan].totalMinutes - normalAllTimes[timeIndex].totalMinutes, 5), 90); // double sided constrain
            regularDayBlocks.push(
                new RegularDayBlock(rawBlock.title, rawBlock.location, rawBlock.label, timeIndex, rowSpan, durationMins, true));
            timeIndex++;
        });

        // console.log(regularDayBlocks); debugger;
        return new RegularDay(date, dayMeta, regularDayBlocks);
    }

    // toJSON(): any {
    // }

    getType(): ScheduleDayType {
        return ScheduleDayType.REGULAR;
    }
}

class InlineDay extends ScheduleDay {
    blocks: InlineDayBlock[];
    lateStart: boolean;

    constructor(date: ScheduleDate, dayMeta: ScheduleDayMeta, blocks: InlineDayBlock[], lateStart: boolean) {
        super(date, dayMeta);
        this.blocks = blocks;
        this.lateStart = lateStart;
    }

    static fromRawBlocks(date: ScheduleDate, dayMeta: ScheduleDayMeta, sortedRawBlocks: RawBlock[]): InlineDay {
        if (!sortedRawBlocks[0].startTime.equals(normalTimes[0])) {
            sortedRawBlocks.unshift(new RawBlock("Late Start", "", "", date, dayMeta, normalTimes[0], sortedRawBlocks[0].startTime));
        }

        let inlineDayBlocks = new Array<InlineDayBlock>();
        sortedRawBlocks.forEach((rawBlock: RawBlock, index: number, otherBlocks: RawBlock[]) => {
            // Calculate end time and duration if not already set
            let endTime = rawBlock.endTime === null ? index === otherBlocks.length - 1 ? schoolEndTime : otherBlocks[index + 1].startTime : rawBlock.endTime;
            let duration = Math.min(Math.max(endTime.compareTo(rawBlock.startTime), 5), 90);

            // Add this block
            inlineDayBlocks.push(new InlineDayBlock(rawBlock.title, rawBlock.location, rawBlock.label, rawBlock.startTime, endTime, duration, false));

            // Add a free block if necessary
            let nextTime = index === otherBlocks.length - 1 ? schoolEndTime : otherBlocks[index + 1].startTime;
            if (nextTime.compareTo(endTime) > 10) {
                let freeDuration = Math.min(Math.max(nextTime.compareTo(endTime), 5), 90);
                inlineDayBlocks.push(new InlineDayBlock("Free", "", "", endTime, nextTime, freeDuration, true));
            }
        });

        // console.log(inlineDayBlocks); debugger;
        return new InlineDay(date, dayMeta, inlineDayBlocks, false); // TODO: remove lateStart
    }

    // toJSON(): any {
    // }

    getType(): ScheduleDayType {
        return ScheduleDayType.INLINE;
    }
}

class TextDay extends ScheduleDay {
    text: string;
    url: string;

    constructor(date: ScheduleDate, dayMeta: ScheduleDayMeta, text: string, url: string) {
        super(date, dayMeta);
        this.text = text;
        this.url = url;
    }

    // toJSON(): any {
    // }

    getType(): ScheduleDayType {
        return ScheduleDayType.TEXT;
    }
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
            return ICAL.parse(icsFile)[2].filter((a: any) => a[1].length === 8);
        });
    }

    private static corsGetPromise(url: string) {
        return new Promise((resolve, reject) => {
            $.get("https://cors-anywhere.herokuapp.com/" + url, httpText => {
                resolve(httpText);
            }).fail(() => {
                reject();
            });
        });
    }

    // @ts-ignore
    static inMatrix(query, matrix) {
        let res = -1;
        // @ts-ignore
        matrix.forEach((el, i) => {
            if (el.includes(query)) res = i;
        });
        return res;
    }

    // @ts-ignore
    private static getDescription(matrix) {
        let i = ICalUtils.inMatrix("description", matrix);
        let description = [];
        if (i > -1) {
            let raw = matrix[i][3];
            // @ts-ignore
            description = raw.split("; ").map(b => {
                let kv = b.split(": ");
                if (kv.length > 2) {
                    for (let i = 2; i < kv.length; i++) kv[1] += `: ${kv[i]}`;
                }
                return { [kv[0]]: kv[1] };
            });
        }
        return description;
    }

    static getLocation(event: any) {
        let location = ICalUtils.getDescription(event)[2].Room;
        let replacements = {
            "Math: ": "",
            "Science Lab ": "",
            Library: "Lib"
        };
        Object.entries(replacements).forEach(entry => {
            location = location.replace(entry[0], entry[1]);
        });
        return location;
    }

    static getLetter(event: any) {
        let letter = ICalUtils.getDescription(event)[1].Day.match(/US Day [A-Z]/);
        letter = letter !== null ? letter[0].charAt(letter[0].length - 1) : "";
        return letter;
    }

    static getLabel(event: any) {
        return ICalUtils.getDescription(event)[0].Block;
    }

    // @ts-ignore
    private static getDT(time, matrix) {
        let i = ICalUtils.inMatrix(`dt${time}`, matrix);
        return i > -1 ? ScheduleTime.fromDate(new Date(matrix[i][3])) : null;
    }

    // @ts-ignore
    static getStartTime(matrix) {
        return this.getDT("start", matrix);
    }

    // @ts-ignore
    static getEndTime(matrix) {
        return this.getDT("end", matrix);
    }

    // @ts-ignore
    static getDate(matrix) {
        let i = ICalUtils.inMatrix(`dtstart`, matrix);
        return i > -1 ? ScheduleDate.fromDate(new Date(matrix[i][3])) : null;
    }

    // @ts-ignore
    static getTitle(matrix) {
        let i = ICalUtils.inMatrix("summary", matrix);
        return i > -1 ? matrix[i][3].split(" - ")[0] : "N/A";
    }
}

interface RawBlockSource {
    getBlocksPromise(): Promise<RawBlock[]>
}

class VeracrossICSRawBlockSource implements RawBlockSource {
    private readonly _calendarUUID: string;

    constructor(calendarUUID: string) {
        this._calendarUUID = calendarUUID;
    }

    getBlocksPromise(): Promise<RawBlock[]> {
        return ICalUtils.getVeracrossCalendarFromUUID(this._calendarUUID).then(calendarEvents => {
            return calendarEvents.map((event: any) => {
                let date = ICalUtils.getDate(event[1]);
                let startTime = ICalUtils.getStartTime(event[1]);
                let endTime = ICalUtils.getEndTime(event[1]);
                let title = ICalUtils.getTitle(event[1]);
                let location = ICalUtils.getLocation(event[1]);
                let letter = ICalUtils.getLetter(event[1]);
                let label = ICalUtils.getLabel(event[1]);

                if (date === null
                    || endTime === null
                    || startTime === null
                    || title.match(/Morning Choir/) !== null // TODO: Remove custom rules
                ) return null;

                return new RawBlock(title, location, label, date, new ScheduleDayMeta(letter), startTime, endTime);
            }).filter((rawBlock: any) => rawBlock !== null);
        });
    }
}

class ScheduleBuilder {
    static generateScheduleFromBlockSources(id: string, ...sources: RawBlockSource[]): Promise<Schedule> {
        return Promise.all(sources.map(source => source.getBlocksPromise())).then((nestedRwBlocks: RawBlock[][]) => {
            let rawBlocks: RawBlock[] = (new Array<RawBlock>()).concat(...nestedRwBlocks); // flatten 2d array

            let blockMap = new Map<string, RawBlock[]>();
            rawBlocks.forEach(rawBlock => {
                let key = rawBlock.date.toString();
                let dayArray = blockMap.get(key);
                if (dayArray !== undefined) {
                    dayArray.push(rawBlock);
                } else {
                    blockMap.set(key, [rawBlock]);
                }
            });

            let dayMap = new Map<string, ScheduleDay>();
            blockMap.forEach((rawBlocks: RawBlock[], key: string) => {
                dayMap.set(key,
                    ScheduleDay.createBlockDay(rawBlocks
                        .filter(this.contextBlockFilter)
                        .sort((a: RawBlock, b: RawBlock) => a.startTime.compareTo(b.startTime))));
            });

            return new Schedule(id, dayMap);
        })
    }

    private static contextBlockFilter(rawBlock: RawBlock, _: any, otherRawBlocks: RawBlock[]): boolean {
        let startHours = rawBlock.startTime.hours;
        if (isNaN(startHours) || startHours < 8 || startHours >= 12 + 3)
            return false;
        return !otherRawBlocks.some(otherBlock => {
            // keep longer description one (TODO: show conflict)
            return (rawBlock.startTime.equals(otherBlock.startTime)
                && (rawBlock.title.length < otherBlock.title.length || rawBlock.location.length < otherBlock.location.length));
        });
    }
}

class Schedule {
    private readonly id: string; // unique id
    private dayMap: Map<string, ScheduleDay>;

    constructor(id: string, dayMap: Map<string, ScheduleDay>) {
        this.id = id;
        this.dayMap = dayMap;
    }

    getDay(dateString: string): ScheduleDay | undefined {
        return this.dayMap.get(dateString);
    }

    toJSON(): any {
        // copy all fields from `this` to an empty object and return in
        return Object.assign({}, this, {
            // convert fields that need converting
            dayMap: Schedule.dayMapToObj(this.dayMap),
            compressionList: Schedule.compressionList
        });
    }

    static dayMapToObj(strMap: Map<string, ScheduleDay>) {
        this.compressionList = new Array<string>();
        let obj = Object.create(null);
        strMap.forEach((day: ScheduleDay, dateString: string) => {
            obj[dateString] = day;
        });
        return obj;
    }

    private static compressionList: Array<string>;

    static processCompressString(inString: string): number {
        let index = this.compressionList.indexOf(inString);
        if (index !== -1) {
            return index;
        } else {
            this.compressionList.push(inString);
            return this.compressionList.length - 1;
        }
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

    let scheduleFactory = ScheduleBuilder.generateScheduleFromBlockSources(calendarUUID, new VeracrossICSRawBlockSource(calendarUUID))
        .then((schedule: Schedule) => {
            console.log(schedule);
            console.log(JSON.stringify(schedule));
            debugger;
        });

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
