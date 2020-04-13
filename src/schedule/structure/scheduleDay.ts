import ScheduleTime from '../time/scheduleTime';
import { InlineDayBlock, RawBlock, RegularDayBlock } from './scheduleBlock';
import ScheduleDate from '../time/scheduleDate';
import scheduleParamUtils from '../utils/scheduleParamUtils';

export class ScheduleDayMeta {
    readonly letter: string;

    constructor(letter: string) {
        this.letter = letter;
    }

    toJSON(): any {
        return this.letter;
    }
}

export let normalTimes: ScheduleTime[];
export let covidTimes: ScheduleTime[] = [
    new ScheduleTime(8, 0),
    new ScheduleTime(10, 0),
    new ScheduleTime(11, 0),
    new ScheduleTime(11, 15),
    new ScheduleTime(12, 15),
    new ScheduleTime(13, 0),
    new ScheduleTime(14, 0)
];
export let covidPassingTimeAtEnd: boolean[] = [
    false,
    false,
    false,
    false,
    false
];
export let normalPassingTimeAtEnd: boolean[];
let lateStartTimes: ScheduleTime[];
export let lateStartPassingTimeAtEnd: boolean[];

if (scheduleParamUtils.getSchoolDivision() == 'us') {
    normalTimes = [
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
    normalPassingTimeAtEnd = [
        false,
        true,//915
        false,
        true,//940
        true,//1030
        false,
        true,//1150
        false,
        true,//105
        false,
        true,//225
        false,
    ];
    lateStartTimes = [
        new ScheduleTime(8, 0),
        new ScheduleTime(9, 0),
        new ScheduleTime(9, 45), // TODO: What time does morning flex start? I don't have any morning flex jsonBlocks
        new ScheduleTime(10, 10),
        new ScheduleTime(10, 30),
        new ScheduleTime(11, 20),
        new ScheduleTime(12, 5),
        new ScheduleTime(12, 30),
        new ScheduleTime(13, 15),
        new ScheduleTime(13, 40),
        new ScheduleTime(14, 30)
    ];
    lateStartPassingTimeAtEnd = [
        false,
        false,
        false,
        false,
        true,//1030
        true,//1120
        false,
        false,
        true,//110
        false,
        true,//230
        false,
    ];
} else { // ms
    normalTimes = [
        new ScheduleTime(8, 0),
        new ScheduleTime(9, 15),
        new ScheduleTime(9, 30),
        new ScheduleTime(9, 45),
        new ScheduleTime(10, 35),
        new ScheduleTime(11, 25),
        new ScheduleTime(11, 55),
        new ScheduleTime(12, 35),
        new ScheduleTime(13, 10),
        new ScheduleTime(14, 30)
    ];
    normalPassingTimeAtEnd = [
        false,
        false,
        true,//945
        true,//1035
        true,//1125
        false,
        false,
        true,//110
        true,//230
        false,
    ];
    lateStartTimes = [
        new ScheduleTime(8, 0),
        new ScheduleTime(9, 0),
        new ScheduleTime(10, 20),
        new ScheduleTime(11, 10),
        new ScheduleTime(11, 55),
        new ScheduleTime(12, 30),
        new ScheduleTime(13, 10),
        new ScheduleTime(14, 30)
    ];
    lateStartPassingTimeAtEnd = [
        false,
        false,
        true,//1020
        true,//1110
        false,
        false,
        true,//110
        true,//230
        false,
    ];
}

const schoolEndTime = new ScheduleTime(15, 15);
export const normalAllTimes = normalTimes.concat([schoolEndTime]);
export const covidAllTimes = covidTimes.concat([schoolEndTime]);


export const lateStartAllTimes = lateStartTimes.concat([schoolEndTime]);

export enum ScheduleDayType {
    REGULAR,
    INLINE,
    TEXT,
    LATE_START,
    COVID
}

export abstract class ScheduleDay {
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
            throw new Error('Assertion Failed: No jsonBlocks contain a date!');
        }
        let dayDate = dayWithDate.date;

        let dayWithMeta = rawBlocks.find(rawBlock => rawBlock.dayMeta !== null);
        let dayMeta = dayWithMeta !== undefined ? dayWithMeta.dayMeta : new ScheduleDayMeta(''); // default day meta if no jsonBlocks have info
        if (this.isCovidDay(rawBlocks)) {
            // @ts-ignore
            return CovidDay.fromRawBlocks(dayDate, dayMeta, rawBlocks);
        } else if (this.isRegularDay(rawBlocks)) {
            // @ts-ignore
            return RegularDay.fromRawBlocks(dayDate, dayMeta, rawBlocks);
        } else if (this.isLateStartDay(rawBlocks)) {
            // @ts-ignore
            let lateStartDay = LateStartDay.fromRawBlocks(dayDate, dayMeta, rawBlocks);
            // @ts-ignore
            if (lateStartDay === null) return InlineDay.fromRawBlocks(dayDate, dayMeta, rawBlocks);
            return lateStartDay;
        } else {
            // @ts-ignore
            return InlineDay.fromRawBlocks(dayDate, dayMeta, rawBlocks);
        }
    }

    private static isCovidDay = (rawBlocks: RawBlock[]): boolean => {
        if (rawBlocks.length > 3) return false;
        return rawBlocks.every(block => {
            let startHours = block.startTime.hours;
            let startMinutes = block.startTime.minutes;
            return covidTimes.some(time => startHours === time.hours && startMinutes === time.minutes);
        });
    };

    private static isRegularDay = (rawBlocks: RawBlock[]): boolean =>
        rawBlocks.every(block => {
            let startHours = block.startTime.hours;
            let startMinutes = block.startTime.minutes;
            if (isNaN(startHours) || startHours < 8 || startHours >= 12 + 3)
                // TODO: time comparators
                return true;
            return normalTimes.some(time => startHours === time.hours && startMinutes === time.minutes);
        });

    private static isLateStartDay = (rawBlocks: RawBlock[]): boolean =>
        rawBlocks.every(block => {
            let startHours = block.startTime.hours;
            let startMinutes = block.startTime.minutes;
            if (isNaN(startHours) || startHours < 8 || startHours >= 12 + 3)
                // TODO: time comparators
                return true;
            return lateStartTimes.some(time => startHours === time.hours && startMinutes === time.minutes);
        });

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

class CovidDay extends ScheduleDay {
    blocks: RegularDayBlock[];

    constructor(date: ScheduleDate, dayMeta: ScheduleDayMeta, blocks: RegularDayBlock[]) {
        super(date, dayMeta);
        this.blocks = blocks;
    }

    static fromRawBlocks(date: ScheduleDate, dayMeta: ScheduleDayMeta, sortedRawBlocks: RawBlock[]): RegularDay {
        sortedRawBlocks.push(
            new RawBlock('', '', '', ScheduleDate.now(), new ScheduleDayMeta(''), new ScheduleTime(24, 0), null)
        );
        let regularDayBlocks = new Array<RegularDayBlock>();
        let timeIndex = 0;

        sortedRawBlocks.forEach((rawBlock: RawBlock) => {
            while (timeIndex < covidTimes.length && rawBlock.startTime.totalMinutes > covidTimes[timeIndex].totalMinutes) {
                let title = '';
                let label = '';
                let rowSpan = 1; // TODO: free block merging
                let durationMins = Math.min(
                    Math.max(
                        covidAllTimes[timeIndex + rowSpan].totalMinutes - covidAllTimes[timeIndex].totalMinutes,
                        5
                    ),
                    90
                ); // double sided constrain
                regularDayBlocks.push(new RegularDayBlock(title, '', label, timeIndex, rowSpan, durationMins, true));
                timeIndex++;
            }

            if (timeIndex >= covidTimes.length) return;

            let rowSpan = 1;
            let durationMins = Math.min(
                Math.max(covidAllTimes[timeIndex + rowSpan].totalMinutes - covidAllTimes[timeIndex].totalMinutes, 5),
                90
            ); // double sided constrain
            regularDayBlocks.push(
                new RegularDayBlock(
                    rawBlock.title,
                    rawBlock.location,
                    rawBlock.label,
                    timeIndex,
                    rowSpan,
                    durationMins,
                    false
                )
            );
            timeIndex += rowSpan;
        });

        return new CovidDay(date, dayMeta, regularDayBlocks);
    }

    getType(): ScheduleDayType {
        return ScheduleDayType.COVID;
    }
}


export class RegularDay extends ScheduleDay {
    blocks: RegularDayBlock[];

    constructor(date: ScheduleDate, dayMeta: ScheduleDayMeta, blocks: RegularDayBlock[]) {
        super(date, dayMeta);
        this.blocks = blocks;
    }

    static fromRawBlocks(date: ScheduleDate, dayMeta: ScheduleDayMeta, sortedRawBlocks: RawBlock[]): RegularDay {
        sortedRawBlocks.push(
            new RawBlock('', '', '', ScheduleDate.now(), new ScheduleDayMeta(''), new ScheduleTime(24, 0), null)
        );
        let regularDayBlocks = new Array<RegularDayBlock>();
        let timeIndex = 0;

        sortedRawBlocks.forEach((rawBlock: RawBlock) => {
            while (
                timeIndex < normalTimes.length &&
                rawBlock.startTime.totalMinutes > normalTimes[timeIndex].totalMinutes
            ) {
                let title = 'Free';
                let label = '';
                switch (timeIndex) {
                    case 1:
                        label = 'Early Flex';
                        break;
                    case 6:
                        label = 'AM Flex';
                        break;
                    case 7:
                        title = 'Co-Curric';
                        break;
                    case 8:
                        title = 'Lunch';
                        break;
                    case 9:
                        label = 'PM Flex';
                        break;
                }
                let rowSpan = 1; // TODO: free block merging
                let durationMins = Math.min(
                    Math.max(
                        normalAllTimes[timeIndex + rowSpan].totalMinutes - normalAllTimes[timeIndex].totalMinutes,
                        5
                    ),
                    90
                ); // double sided constrain
                regularDayBlocks.push(new RegularDayBlock(title, '', label, timeIndex, rowSpan, durationMins, true));
                timeIndex++;
            }

            if (timeIndex >= normalTimes.length) return;

            let rowSpan = 1;
            if (
                timeIndex < normalTimes.length - 1 &&
                (rawBlock.label.match(/.L/) != null || rawBlock.title === 'Assembly') && scheduleParamUtils.getSchoolDivision() === 'us'
            ) {
                rowSpan++;
            }
            let durationMins = Math.min(
                Math.max(normalAllTimes[timeIndex + rowSpan].totalMinutes - normalAllTimes[timeIndex].totalMinutes, 5),
                90
            ); // double sided constrain
            regularDayBlocks.push(
                new RegularDayBlock(
                    rawBlock.title,
                    rawBlock.location,
                    rawBlock.label,
                    timeIndex,
                    rowSpan,
                    durationMins,
                    false
                )
            );
            timeIndex += rowSpan;
        });

        return new RegularDay(date, dayMeta, regularDayBlocks);
    }

    getType(): ScheduleDayType {
        return ScheduleDayType.REGULAR;
    }
}

class LateStartDay extends ScheduleDay {
    blocks: RegularDayBlock[];

    constructor(date: ScheduleDate, dayMeta: ScheduleDayMeta, blocks: RegularDayBlock[]) {
        super(date, dayMeta);
        this.blocks = blocks;
    }

    static fromRawBlocks(
        date: ScheduleDate,
        dayMeta: ScheduleDayMeta,
        sortedRawBlocks: RawBlock[]
    ): LateStartDay | null {
        let regularDayBlocks = new Array<RegularDayBlock>();
        let timeIndex = 0;

        let result = sortedRawBlocks.every((rawBlock: RawBlock) => {
            while (
                timeIndex < lateStartTimes.length &&
                rawBlock.startTime.totalMinutes > lateStartTimes[timeIndex].totalMinutes
            ) {
                let title = 'Free';
                let label = '';
                switch (timeIndex) {
                    case 0:
                        title = 'Late Start';
                        break;
                    case 2:
                        label = 'Early Flex';
                        break;
                    case 6:
                        label = 'AM Flex';
                        break;
                    case 8:
                        label = 'PM Flex';
                        break;
                }
                let rowSpan = 1; // TODO: free block merging
                let durationMins = Math.min(
                    Math.max(
                        lateStartAllTimes[timeIndex + rowSpan].totalMinutes - lateStartAllTimes[timeIndex].totalMinutes,
                        5
                    ),
                    90
                ); // double sided constrain
                regularDayBlocks.push(new RegularDayBlock(title, '', label, timeIndex, rowSpan, durationMins, true));
                timeIndex++;
            }

            if (timeIndex >= lateStartTimes.length) return true;

            let rowSpan = 1;
            if (timeIndex < lateStartTimes.length - 1 && rawBlock.label.match(/.L/) !== null) {
                rowSpan++;
            }
            if (lateStartTimes[timeIndex].totalMinutes !== rawBlock.startTime.totalMinutes) {
                console.log('Assertion Failed: Day matched as regular day but was going to display incorrect time!');
                return false;
            }
            let durationMins = Math.min(
                Math.max(
                    lateStartAllTimes[timeIndex + rowSpan].totalMinutes - lateStartAllTimes[timeIndex].totalMinutes,
                    5
                ),
                90
            ); // double sided constrain
            regularDayBlocks.push(
                new RegularDayBlock(
                    rawBlock.title,
                    rawBlock.location,
                    rawBlock.label,
                    timeIndex,
                    rowSpan,
                    durationMins,
                    false
                )
            );
            timeIndex += rowSpan;
            return true;
        });

        while ( // TODO: Duplicated code!!!!!!!!
            timeIndex < lateStartTimes.length
            ) {
            let title = 'Free';
            let label = '';
            switch (timeIndex) {
                case 0:
                    title = 'Late Start';
                    break;
                case 2:
                    label = 'Early Flex';
                    break;
                case 6:
                    label = 'AM Flex';
                    break;
                case 8:
                    label = 'PM Flex';
                    break;
            }
            let rowSpan = 1; // TODO: free block merging
            let durationMins = Math.min(
                Math.max(
                    lateStartAllTimes[timeIndex + rowSpan].totalMinutes - lateStartAllTimes[timeIndex].totalMinutes,
                    5
                ),
                90
            ); // double sided constrain
            regularDayBlocks.push(new RegularDayBlock(title, '', label, timeIndex, rowSpan, durationMins, true));
            timeIndex++;
        }

        if (!result) {
            return null;
        }

        return new LateStartDay(date, dayMeta, regularDayBlocks);
    }

    getType(): ScheduleDayType {
        return ScheduleDayType.LATE_START;
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
            sortedRawBlocks.unshift(
                new RawBlock('Free', '', '', date, dayMeta, normalTimes[0], sortedRawBlocks[0].startTime)
            );
        }

        let inlineDayBlocks = new Array<InlineDayBlock>();
        sortedRawBlocks.forEach((rawBlock: RawBlock, index: number, otherBlocks: RawBlock[]) => {
            // Calculate end time and duration if not already set
            let endTime =
                rawBlock.endTime === null
                    ? index === otherBlocks.length - 1
                        ? schoolEndTime
                        : otherBlocks[index + 1].startTime
                    : rawBlock.endTime;
            let duration = Math.min(Math.max(endTime.compareTo(rawBlock.startTime), 5), 90);

            // Add this block
            inlineDayBlocks.push(
                new InlineDayBlock(
                    rawBlock.title,
                    rawBlock.location,
                    rawBlock.label,
                    rawBlock.startTime,
                    endTime,
                    duration,
                    false
                )
            );

            // Add a free block if necessary
            let nextTime = index === otherBlocks.length - 1 ? schoolEndTime : otherBlocks[index + 1].startTime;
            if (nextTime.compareTo(endTime) > 10) {
                let freeDuration = Math.min(Math.max(nextTime.compareTo(endTime), 5), 90);
                inlineDayBlocks.push(new InlineDayBlock('Free', '', '', endTime, nextTime, freeDuration, true));
            }
        });

        return new InlineDay(date, dayMeta, inlineDayBlocks, false); // TODO: remove lateStart
    }

    getType(): ScheduleDayType {
        return ScheduleDayType.INLINE;
    }
}

export class TextDay extends ScheduleDay {
    text: string;
    url: string;

    constructor(date: ScheduleDate, dayMeta: ScheduleDayMeta, text: string, url: string) {
        super(date, dayMeta);
        this.text = text;
        this.url = url;
    }

    getType(): ScheduleDayType {
        return ScheduleDayType.TEXT;
    }
}
