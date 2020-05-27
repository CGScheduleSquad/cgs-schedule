import { RawBlock } from '../structure/scheduleBlock';
import { RegularDay, ScheduleDay } from '../structure/scheduleDay';
import { ScheduleAll } from '../structure/scheduleAll';
import ScheduleParamUtils from '../utils/scheduleParamUtils';

export interface RawBlockSource {
    getBlocksPromise(): Promise<RawBlock[]>;
}

var cycleDayReference = new Map<string, string>([
    ["2020-2-7", "A"],
    ["2020-2-10", "B"],
    ["2020-2-11", "C"],
    ["2020-2-12", "D"],
    ["2020-2-13", "E"],
    ["2020-2-14", "F"],
    ["2020-2-18", "G"]
]);

export class ScheduleBuilder {
    static generateScheduleFromBlockSources(calendarUrl: string, ...sources: RawBlockSource[]): Promise<ScheduleAll> {
        return Promise.all(sources.map(source => source.getBlocksPromise())).then((nestedRwBlocks: RawBlock[][]) => {
            let rawBlocks: RawBlock[] = new Array<RawBlock>().concat(...nestedRwBlocks); // flatten 2d array

            let cycleMap = new Map<string, RegularDay>();
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
                let value = ScheduleDay.createBlockDay(
                    rawBlocks
                        .filter(this.duplicateOrOutOfRangeBlockRemover)
                        .sort((a: RawBlock, b: RawBlock) => a.startTime.compareTo(b.startTime))
                );
                let cycleLetter = cycleDayReference.get(key);
                if (cycleLetter !== undefined && value instanceof RegularDay) {
                    cycleMap.set(cycleLetter, value);
                }
                dayMap.set(
                    key,
                    value
                );
            });

            return new ScheduleAll(calendarUrl, dayMap, cycleMap, ScheduleParamUtils.getSchoolDivision());
        });
    }

    private static duplicateOrOutOfRangeBlockRemover(rawBlock: RawBlock, index: number, otherRawBlocks: RawBlock[]): boolean {
        let startHours = rawBlock.startTime.hours;
        let outOfSchoolBounds = isNaN(startHours) || startHours < 8 || startHours >= 12 + 4; // TODO: 3:15 not 3 TIME COMPARE

        // TODO: Add block keeping preferences
        let duplicateBlock = otherRawBlocks.findIndex((value: RawBlock) => {
            return rawBlock.startTime.equals(value.startTime)
                // || (rawBlock.endTime !== null && value.endTime !== null && rawBlock.endTime.equals(value.endTime));
        }) >= index;
        return duplicateBlock || outOfSchoolBounds;
    }
}
