import ScheduleTime from '../time/scheduleTime';
import ScheduleDate from '../time/scheduleDate';

export class VeracrossICalUtils {
    static getVeracrossCalendarFromUUID = (calendarUUID: string): Promise<any> =>
        VeracrossICalUtils.corsGetPromise(`http://api.veracross.com/catlin/subscribe/${calendarUUID}.ics`).then(
            icsFile => {
                // @ts-ignore
                return ICAL.parse(icsFile)[2].filter((a: any) => a[1].length === 8);
            }
        );

    public static corsGetPromise(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            let request = new XMLHttpRequest();
            request.open('GET', `https://cgs-schedule-cors.herokuapp.com/${url}`, true);
            request.onload = function() {
                if (this.status >= 200 && this.status < 400) {
                    resolve(this.response);
                } else {
                    reject();
                }
            };
            request.onerror = () => reject();
            request.send();
        });
    }

    private static inMatrix(query: any, matrix: [[]]): number {
        let res = -1;
        matrix.forEach((el: any, i: number) => {
            if (el.includes(query)) res = i;
        });
        return res;
    }

    private static getDescription(matrix: any): any {
        let i = VeracrossICalUtils.inMatrix('description', matrix);
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
        let location = VeracrossICalUtils.getDescription(event)[2].Room;
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
        let letter = VeracrossICalUtils.getDescription(event)[1].Day.match(/US Day [A-Z]/);
        letter = letter !== null ? letter[0].charAt(letter[0].length - 1) : '';
        return letter;
    }

    static getLabel = (event: any): string => VeracrossICalUtils.getDescription(event)[0].Block;

    private static getDT(time: string, matrix: any): ScheduleTime | null {
        let i = VeracrossICalUtils.inMatrix(`dt${time}`, matrix);
        return i > -1 ? ScheduleTime.fromDate(new Date(matrix[i][3])) : null;
    }

    static getStartTime(matrix: any): ScheduleTime | null {
        return this.getDT('start', matrix);
    }

    static getEndTime(matrix: any): ScheduleTime | null {
        return this.getDT('end', matrix);
    }

    static getDate(matrix: any): ScheduleDate | null {
        let i = VeracrossICalUtils.inMatrix(`dtstart`, matrix);
        let dateString = matrix[i][3];
        if (/^\d\d\d\d-\d\d-\d\d$/.test(dateString)) dateString = dateString.concat("T00:00");
        return i > -1 ? ScheduleDate.fromDate(new Date(dateString)) : null;
    }

    static getSummary(matrix: any): any {
        let i = VeracrossICalUtils.inMatrix('summary', matrix);
        return i > -1 ? matrix[i][3].split(' - ')[0] : 'N/A';
    }

    static getDescriptionAsText(matrix: any): any {
        let i = VeracrossICalUtils.inMatrix('description', matrix);
        return i > -1 ? matrix[i][3] : 'N/A';
    }
}
