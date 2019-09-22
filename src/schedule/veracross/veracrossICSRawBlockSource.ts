import { RawBlockSource } from '../building/scheduleBuilder';
import { RawBlock } from '../structure/scheduleBlock';
import { ScheduleDayMeta } from '../structure/scheduleDay';
import { VeracrossICalUtils } from './veracrossICalUtils';

export class VeracrossICSRawBlockSource implements RawBlockSource {
    private readonly _calendarUUID: string;

    constructor(calendarUUID: string) {
        this._calendarUUID = calendarUUID;
    }

    getBlocksPromise(): Promise<RawBlock[]> {
        return VeracrossICalUtils.getVeracrossCalendarFromUUID(this._calendarUUID).then(calendarEvents => {
            return calendarEvents
                .map((event: any) => {
                    let date = VeracrossICalUtils.getDate(event[1]);
                    let startTime = VeracrossICalUtils.getStartTime(event[1]);
                    let endTime = VeracrossICalUtils.getEndTime(event[1]);
                    let title = VeracrossICalUtils.getTitle(event[1]);
                    let location = VeracrossICalUtils.getLocation(event[1]);
                    let letter = VeracrossICalUtils.getLetter(event[1]);
                    let label = VeracrossICalUtils.getLabel(event[1]);

                    if (date === null || endTime === null || startTime === null || title.match(/Morning Choir/) !== null // TODO: Remove custom rules
                    ) return null;

                    return new RawBlock(title, location, label, date, new ScheduleDayMeta(letter), startTime, endTime);
                })
                .filter((rawBlock: any) => rawBlock !== null);
        });
    }
}
