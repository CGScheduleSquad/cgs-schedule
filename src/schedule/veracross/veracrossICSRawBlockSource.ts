import { RawBlockSource } from '../building/scheduleBuilder';
import { RawBlock } from '../structure/scheduleBlock';
import { ScheduleDayMeta } from '../structure/scheduleDay';
import { VeracrossICalUtils } from './veracrossICalUtils';

export class VeracrossICSRawBlockSource implements RawBlockSource {
    private readonly _calendarUUID: string;
    private _loadingInBackground: boolean;

    constructor(calendarUUID: string, loadingInBackground: boolean) {
        this._calendarUUID = calendarUUID;
        this._loadingInBackground = loadingInBackground;
    }

    getBlocksPromise(): Promise<RawBlock[]> {
        return VeracrossICalUtils.getVeracrossCalendarFromUUID(this._calendarUUID).then(calendarEvents => {
            let filteredBlocks = calendarEvents
                .map((event: any) => {
                    try {
                        let date = VeracrossICalUtils.getDate(event[1]);
                        let startTime = VeracrossICalUtils.getStartTime(event[1]);
                        let endTime = VeracrossICalUtils.getEndTime(event[1]);
                        let title = VeracrossICalUtils.getTitle(event[1]);
                        let location = VeracrossICalUtils.getLocation(event[1]);
                        let letter = VeracrossICalUtils.getLetter(event[1]);
                        let label = VeracrossICalUtils.getLabel(event[1]);

                        if (
                            date === null ||
                            endTime === null ||
                            startTime === null ||
                            title.match(/Morning Choir/) !== null // TODO: Remove custom rules
                        )
                            return null;

                        return new RawBlock(title, location, label, date, new ScheduleDayMeta(letter), startTime, endTime);
                    } catch (e) {
                        return null;
                    }
                })
                .filter((rawBlock: any) => rawBlock !== null);
            if (filteredBlocks.length === 0) {
                let message = 'Found 0 class blocks from the provided calendar link! Make sure to copy your calendar link from the correct \'Subscribe\' button in step 2!';
                if (this._loadingInBackground) {
                    console.warn(message);
                } else {
                    alert(message);
                    window.location.href = './index.html'; // exits the page
                    throw new Error(message);
                }
            }
            return filteredBlocks;
        }).catch(() => {
            let message = 'Calendar link returned 404! Make sure to copy your calendar link from the correct \'Subscribe\' button in step 2!';
            if (this._loadingInBackground) {
                console.warn(message);
            } else {
                alert(message);
                window.location.href = './index.html'; // exits the page
                throw new Error(message);
            }
        });
    }
}
