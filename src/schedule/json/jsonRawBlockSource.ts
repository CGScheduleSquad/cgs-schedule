import { RawBlockSource } from '../building/scheduleBuilder';
import { RawBlock } from '../structure/scheduleBlock';
import ScheduleDate from '../time/scheduleDate';
import ScheduleTime from '../time/scheduleTime';
import blocks from './blocks.json';

export class JsonRawBlockSource implements RawBlockSource {

    constructor() {
    }

    getBlocksPromise(): Promise<RawBlock[]> {
        return new Promise<RawBlock[]>((resolve, reject) => {
            let rawBlocks = [];
            for (let date in blocks) {
                blocks[date].forEach(block => {
                    let startTime = ScheduleTime.fromDate(JsonRawBlockSource.parseVeracrossTime(block.startTime));
                    if (startTime.hours === 11 && startTime.minutes === 25) startTime = new ScheduleTime(11, 20); // TODO: get rid of this
                    rawBlocks.push(new RawBlock(block.title, '', '', ScheduleDate.fromString(date), null, startTime, null));
                });
            }
            resolve(rawBlocks);
        });
    }

    private static parseVeracrossTime(timeString: string) {
        let isPm = false;
        if (timeString.includes('am')) {
            timeString = timeString.replace(' am', '');
        }
        if (timeString.includes('pm')) {
            timeString = timeString.replace(' pm', '');
            isPm = true;
        }
        let splitString = timeString.split(':');
        return new Date(0, 0, 0, parseInt(splitString[0]) + (isPm && parseInt(splitString[0]) !== 12 ? 12 : 0), parseInt(splitString[1]));
    }
}
