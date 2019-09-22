import { ScheduleTime } from '../time/scheduleTime';
import { InlineDayBlock, RawBlock, RegularDayBlock } from './scheduleBlock';
import { ScheduleDate } from '../time/scheduleDate';

export class ScheduleDayMeta {
    readonly letter: string;

    constructor(letter: string) {
        this.letter = letter;
    }

    toJSON(): any {
        return this.letter;
    }
}

const normalTimes = [new ScheduleTime(8, 0), new ScheduleTime(8, 45), new ScheduleTime(9, 20), new ScheduleTime(9, 30), new ScheduleTime(9, 45), new ScheduleTime(10, 35), new ScheduleTime(11, 20), new ScheduleTime(11, 55), new ScheduleTime(12, 30), new ScheduleTime(13, 10), new ScheduleTime(13, 40), new ScheduleTime(14, 30)];
const schoolEndTime = new ScheduleTime(15, 15);
const normalAllTimes = normalTimes.concat([schoolEndTime]);

export enum ScheduleDayType {
    REGULAR, INLINE, TEXT
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
            throw new Error('No blocks contain a day! This should be impossible.');
        }
        let dayDate = dayWithDate.date;

        let dayWithMeta = rawBlocks.find(rawBlock => rawBlock.dayMeta !== null);
        let dayMeta = dayWithMeta !== undefined ? dayWithMeta.dayMeta : new ScheduleDayMeta(''); // default day meta if no blocks have info

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
            if (isNaN(startHours) || startHours < 8 || startHours >= 12 + 3)
            // TODO: time comparators
                return true;
            return normalTimes.some(time => startHours === time.hours && startMinutes === time.minutes);
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
        sortedRawBlocks.push(new RawBlock('', '', '', ScheduleDate.now(), new ScheduleDayMeta(''), new ScheduleTime(24, 0), null));
        let regularDayBlocks = new Array<RegularDayBlock>();
        let timeIndex = 0;
        if (date.toString() === '2019-9-23') debugger;

        sortedRawBlocks.forEach((rawBlock: RawBlock) => {
            while (timeIndex < normalTimes.length && rawBlock.startTime.totalMinutes > normalTimes[timeIndex].totalMinutes) {
                let title = 'Free';
                let label = '';
                switch (timeIndex) {
                    // case 3:
                    //     title = 'Break';
                    //     break;
                    case 6:
                        label = 'AM Flex';
                        break;
                    case 7:
                        title = 'Co-Curric';
                        break;
                    // case 8:
                    //     title = 'Lunch';
                    //     break;
                    case 9:
                        label = 'PM Flex';
                        break;
                }
                let rowSpan = 1; // TODO: free block merging
                let durationMins = Math.min(Math.max(normalAllTimes[timeIndex + rowSpan].totalMinutes - normalAllTimes[timeIndex].totalMinutes, 5), 90); // double sided constrain
                regularDayBlocks.push(new RegularDayBlock(title, '', label, timeIndex, rowSpan, durationMins, true));
                timeIndex++;
            }

            if (timeIndex >= normalTimes.length) return;

            let rowSpan = 1;
            if (timeIndex < normalTimes.length - 1 && (rawBlock.label.match(/.L/) != null || rawBlock.title === 'Assembly')) {
                rowSpan++;
            }
            let durationMins = Math.min(Math.max(normalAllTimes[timeIndex + rowSpan].totalMinutes - normalAllTimes[timeIndex].totalMinutes, 5), 90); // double sided constrain
            regularDayBlocks.push(new RegularDayBlock(rawBlock.title, rawBlock.location, rawBlock.label, timeIndex, rowSpan, durationMins, true));
            timeIndex += rowSpan;
        });

        // console.log(regularDayBlocks); debugger;
        return new RegularDay(date, dayMeta, regularDayBlocks);
    }

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
            sortedRawBlocks.unshift(new RawBlock('Late Start', '', '', date, dayMeta, normalTimes[0], sortedRawBlocks[0].startTime));
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
                inlineDayBlocks.push(new InlineDayBlock('Free', '', '', endTime, nextTime, freeDuration, true));
            }
        });

        // console.log(inlineDayBlocks); debugger;
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
