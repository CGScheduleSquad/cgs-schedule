import { RawBlock } from '../structure/scheduleBlock';
import { ScheduleDay } from '../structure/scheduleDay';
import { ScheduleAll } from '../structure/scheduleAll';
import ScheduleParamUtils from '../utils/scheduleParamUtils';

export interface RawBlockSource {
    getBlocksPromise(): Promise<RawBlock[]>;
}

export class ScheduleBuilder {
    static generateScheduleFromBlockSources(id: string, ...sources: RawBlockSource[]): Promise<ScheduleAll> {
        return Promise.all(sources.map(source => source.getBlocksPromise())).then((nestedRwBlocks: RawBlock[][]) => {
            let rawBlocks: RawBlock[] = new Array<RawBlock>().concat(...nestedRwBlocks); // flatten 2d array

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
                dayMap.set(
                    key,
                    ScheduleDay.createBlockDay(
                        rawBlocks
                            .filter(this.contextBlockFilter)
                            .sort((a: RawBlock, b: RawBlock) => a.startTime.compareTo(b.startTime))
                    )
                );
            });

            return new ScheduleAll(id, dayMap, ScheduleParamUtils.getSchoolDivision());
        });
    }

    private static contextBlockFilter(rawBlock: RawBlock, index: number, otherRawBlocks: RawBlock[]): boolean {
        let startHours = rawBlock.startTime.hours;
        if (isNaN(startHours) || startHours < 8 || startHours >= 12 + 3) return false; // TODO: 3:15 not 3

        // TODO: Add block keeping preferences
        return otherRawBlocks.findIndex((value: RawBlock) => rawBlock.startTime.equals(value.startTime)) >= index;
    }
}
