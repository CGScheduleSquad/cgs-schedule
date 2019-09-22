import { ScheduleDate } from '../time/scheduleDate';

export enum ViewMode {
    Day = 1, Week = 5
}

export class ScheduleRange {
    // calculates the week or day range for the schedule to display
    readonly startDate: ScheduleDate;
    readonly nextDate: ScheduleDate;
    readonly previousDate: ScheduleDate;
    readonly viewMode: ViewMode;

    constructor(seedDate: ScheduleDate, viewMode: ViewMode) {
        // TODO: Clean up this mess
        this.viewMode = viewMode;
        const thisMonday = ScheduleRange.getLastFriday(seedDate);
        thisMonday.setDate(thisMonday.getDate() + 3);
        if (viewMode === ViewMode.Week) {
            this.startDate = thisMonday;
            // get the previous and next monday for the arrows TODO: Dont modify the dates inside getDatesForWeek so this order doesn't matter
            const previousMonday = thisMonday.copy();
            const nextMonday = thisMonday.copy();
            previousMonday.setDate(thisMonday.getDate() - 7);
            nextMonday.setDate(thisMonday.getDate() + 7);
            this.nextDate = nextMonday;
            this.previousDate = previousMonday;
        } else if (viewMode === ViewMode.Day) {
            let isWeekend = (date: ScheduleDate) => date.getDay() === 0 || date.getDay() === 6;
            this.startDate = isWeekend(seedDate) ? thisMonday : seedDate;

            this.nextDate = this.startDate.copy();
            this.previousDate = this.startDate.copy();
            this.nextDate.setDate(this.startDate.getDate() + 1);
            if (isWeekend(this.nextDate)) this.nextDate.setDate(this.startDate.getDate() + 3);
            this.previousDate.setDate(this.startDate.getDate() - 1);
            if (isWeekend(this.previousDate)) this.previousDate.setDate(this.startDate.getDate() - 3);
        } else {
            throw new Error('Unsupported ViewMode value!');
        }
    }

    getDatesForWeek() {
        // [2019-9-16, 2019-9-17, etc...]
        let tempDate = this.startDate.copy();
        let dates = [];
        for (let i = 0; i < this.viewMode; i++) {
            dates.push(tempDate.copy());
            tempDate.setDate(tempDate.getDate() + 1);
        }
        return dates;
    }

    private static getLastFriday(date: ScheduleDate) {
        let d = date.copy();
        let day = d.getDay();
        let diff = day <= 5 ? 7 - 5 + day : day - 5;

        d.setDate(d.getDate() - diff);
        return d;
    }
}
