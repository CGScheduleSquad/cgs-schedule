import { ScheduleTime } from '../time/scheduleTime';
import { ScheduleDate } from '../time/scheduleDate';

export class VeracrossICalUtils {
    static getVeracrossCalendarFromUUID(calendarUUID: string): Promise<any> {
        return VeracrossICalUtils.corsGetPromise(`http://api.veracross.com/catlin/subscribe/${calendarUUID}.ics`).then(icsFile => {
            // @ts-ignore
            return ICAL.parse(icsFile)[2].filter((a: any) => a[1].length === 8);
        });
    }

    private static corsGetPromise(url: string) {
        return new Promise((resolve, reject) => {
            $.get('https://cors-anywhere.herokuapp.com/' + url, httpText => {
                resolve(httpText);
            }).fail(() => {
                reject();
            });
        });
    }

    // @ts-ignore
    static inMatrix(query, matrix) {
        let res = -1;
        // @ts-ignore
        matrix.forEach((el, i) => {
            if (el.includes(query)) res = i;
        });
        return res;
    }

    // @ts-ignore
    private static getDescription(matrix) {
        let i = VeracrossICalUtils.inMatrix('description', matrix);
        let description = [];
        if (i > -1) {
            let raw = matrix[i][3];
            // @ts-ignore
            description = raw.split('; ').map(b => {
                let kv = b.split(': ');
                if (kv.length > 2) {
                    for (let i = 2; i < kv.length; i++) kv[1] += `: ${kv[i]}`;
                }
                return { [kv[0]]: kv[1] };
            });
        }
        return description;
    }

    static getLocation(event: any) {
        let location = VeracrossICalUtils.getDescription(event)[2].Room;
        let replacements = {
            'Math: ': '', 'Science Lab ': '', Library: 'Lib'
        };
        Object.entries(replacements).forEach(entry => {
            location = location.replace(entry[0], entry[1]);
        });
        return location;
    }

    static getLetter(event: any) {
        let letter = VeracrossICalUtils.getDescription(event)[1].Day.match(/US Day [A-Z]/);
        letter = letter !== null ? letter[0].charAt(letter[0].length - 1) : '';
        return letter;
    }

    static getLabel(event: any) {
        return VeracrossICalUtils.getDescription(event)[0].Block;
    }

    // @ts-ignore
    private static getDT(time, matrix) {
        let i = VeracrossICalUtils.inMatrix(`dt${time}`, matrix);
        return i > -1 ? ScheduleTime.fromDate(new Date(matrix[i][3])) : null;
    }

    // @ts-ignore
    static getStartTime(matrix) {
        return this.getDT('start', matrix);
    }

    // @ts-ignore
    static getEndTime(matrix) {
        return this.getDT('end', matrix);
    }

    // @ts-ignore
    static getDate(matrix) {
        let i = VeracrossICalUtils.inMatrix(`dtstart`, matrix);
        return i > -1 ? ScheduleDate.fromDate(new Date(matrix[i][3])) : null;
    }

    // @ts-ignore
    static getTitle(matrix) {
        let i = VeracrossICalUtils.inMatrix('summary', matrix);
        return i > -1 ? matrix[i][3].split(' - ')[0] : 'N/A';
    }
}
