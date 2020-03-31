import ScheduleTime from '../time/scheduleTime';
import ScheduleDate from '../time/scheduleDate';
import { VeracrossICalUtils } from './veracrossICalUtils';

export class GenericICalUtils {
    static getCalendarEventsFromUUID = (calendarURL: string): Promise<any> =>
        VeracrossICalUtils.corsGetPromise(calendarURL).then(
            icsFile => {
                // @ts-ignore
                let parsedPath = ICAL.parse(icsFile);
                return parsedPath[2];
            }
        );

    private static inMatrix(query: any, matrix: [[]]): number {
        let res = -1;
        matrix.forEach((el: any, i: number) => {
            if (el.includes(query)) res = i;
        });
        return res;
    }

    private static getDescription(matrix: any): any {
        let i = GenericICalUtils.inMatrix('description', matrix);
        let description = [];
        if (i > -1) {
            let raw = matrix[i][3];
            description = raw.split('; ').map((b: string) => {
                let kv = b.split(': ');
                if (kv.length > 2) {
                    for (let i = 2; i < kv.length; i++) kv[1] += `: ${kv[i]}`;
                }
                return { [kv[0]]: kv[1] };
            });
        }
        return description;
    }

    static getLocation(event: any): string {
        let location = GenericICalUtils.getDescription(event)[2].Room;
        let replacements = {
            'Math: ': '',
            'Science Lab ': '',
            Library: 'Lib'
        };
        Object.entries(replacements).forEach(entry => {
            location = location.replace(entry[0], entry[1]);
        });
        return location;
    }

    static getLetter(event: any): string {
        let letter = GenericICalUtils.getDescription(event)[1].Day.match(/S Day [A-Z]/);
        letter = letter !== null ? letter[0].charAt(letter[0].length - 1) : '';
        return letter;
    }

    static getLabel = (event: any): string => GenericICalUtils.getDescription(event)[0].Block;

    private static getDT(time: string, matrix: any): ScheduleTime | null {
        let i = GenericICalUtils.inMatrix(`dt${time}`, matrix);
        return i > -1 ? ScheduleTime.fromDate(new Date(matrix[i][3])) : null;
    }

    static getStartTime(matrix: any): ScheduleTime | null {
        return this.getDT('start', matrix);
    }

    static getEndTime(matrix: any): ScheduleTime | null {
        return this.getDT('end', matrix);
    }

    static getDate(matrix: any): ScheduleDate | null {
        let i = GenericICalUtils.inMatrix(`dtstart`, matrix);
        return i > -1 ? ScheduleDate.fromDate(new Date(matrix[i][3])) : null;
    }

    static getTitle(matrix: any): any {
        let i = GenericICalUtils.inMatrix('summary', matrix);
        return i > -1 ? matrix[i][3] : null;
    }
}
