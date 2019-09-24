import { RawBlockSource } from '../building/scheduleBuilder';
import { RawBlock } from '../structure/scheduleBlock';
import ScheduleDate from '../time/scheduleDate';
import ScheduleTime from '../time/scheduleTime';
// @ts-ignore
import blocks from './blocks.json';

export default class JSONRawBlockSource implements RawBlockSource {
    constructor() {}

    getBlocksPromise = (): Promise<RawBlock[]> =>
        new Promise<RawBlock[]>(resolve => {
            let rawBlocks: RawBlock[] = [];
            for (let date in blocks) {
                if (blocks.hasOwnProperty(date)) {
                    blocks[date].forEach((block: { startTime: string; title: string }) => {
                        let startTime = ScheduleTime.fromDate(JSONRawBlockSource.parseVeracrossTime(block.startTime));
                        if (startTime.hours === 11 && startTime.minutes === 25) startTime = new ScheduleTime(11, 20); // TODO: get rid of this
                        rawBlocks.push(
                            new RawBlock(block.title, '', '', ScheduleDate.fromString(date), null, startTime, null)
                        );
                    });
                }
            }
            resolve(rawBlocks);
        });

    private static parseVeracrossTime(timeString: string) {
        let isPm = timeString.includes('pm');
        timeString = timeString.replace(/[ap]m/g, '');
        let splitString = timeString.split(':');
        return new Date(
            0,
            0,
            0,
            parseInt(splitString[0]) + (isPm && parseInt(splitString[0]) !== 12 ? 12 : 0),
            parseInt(splitString[1])
        );
    }
}
