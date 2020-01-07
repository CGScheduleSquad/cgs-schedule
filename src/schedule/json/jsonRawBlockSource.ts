import { RawBlockSource } from '../building/scheduleBuilder';
import { RawBlock } from '../structure/scheduleBlock';
import ScheduleDate from '../time/scheduleDate';
import ScheduleTime from '../time/scheduleTime';
// @ts-ignore
import usblocks from './blocks.json';
// @ts-ignore
import msblocks from './ms-blocks.json';
import scheduleParamUtils from '../utils/scheduleParamUtils';

export default class JSONRawBlockSource implements RawBlockSource {
    constructor() {}

    getBlocksPromise = (): Promise<RawBlock[]> =>
        new Promise<RawBlock[]>(resolve => {
            let jsonBlocks = scheduleParamUtils.getSchoolDivision() === 'us' ? usblocks : msblocks;
            let rawBlocks: RawBlock[] = [];
            for (let date in jsonBlocks) {
                if (jsonBlocks.hasOwnProperty(date)) {
                    jsonBlocks[date].forEach((block: { startTime: string; title: string; label: string | undefined }) => {
                        let startTime = ScheduleTime.fromDate(JSONRawBlockSource.parseVeracrossTime(block.startTime));
                        if (startTime.hours === 11 && startTime.minutes === 25) startTime = new ScheduleTime(11, 20); // TODO: get rid of this
                        let label = block.label !== undefined ? block.label : '';
                        rawBlocks.push(
                            new RawBlock(block.title, '', label, ScheduleDate.fromString(date), null, startTime, null)
                        );
                    });
                }
            }
            resolve(rawBlocks);
        });

    private static parseVeracrossTime(timeString: string): Date {
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
