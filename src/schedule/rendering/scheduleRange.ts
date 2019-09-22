import { ScheduleDate } from "../time/scheduleDate";

export enum ViewMode {
  Day = 1,
  Week = 5,
}

export class ScheduleRange { // calculates the week or day range for the schedule to display
  readonly currentDate: ScheduleDate;
  readonly nextDate: ScheduleDate;
  readonly previousDate: ScheduleDate;
  readonly viewMode: ViewMode;

  constructor(currentDate: ScheduleDate, viewMode: ViewMode) { // TODO: Clean up this mess
    this.viewMode = viewMode;
    this.currentDate = currentDate;
    const thisMonday = ScheduleRange.getLastFriday(currentDate);
    thisMonday.setDate(thisMonday.getDate() + 3);
    if (viewMode === ViewMode.Week) {
      // get the previous and next monday for the arrows TODO: Dont modify the dates inside getDatesForWeek so this order doesn't matter
      const previousMonday = thisMonday.copy();
      const nextMonday = thisMonday.copy();
      previousMonday.setDate(thisMonday.getDate() - 7);
      nextMonday.setDate(thisMonday.getDate() + 7);
      this.nextDate = nextMonday;
      this.previousDate = previousMonday;
    } else if (viewMode === ViewMode.Day) {
      let isWeekend = (date: ScheduleDate) => date.getDay() === 0 || date.getDay() === 6;
      let startDate = isWeekend(currentDate) ? thisMonday : currentDate;

      this.nextDate = startDate.copy();
      this.previousDate = startDate.copy();
      this.nextDate.setDate(startDate.getDate() + 1);
      if (isWeekend(this.nextDate)) this.nextDate.setDate(startDate.getDate() + 3);
      this.previousDate.setDate(startDate.getDate() - 1);
      if (isWeekend(this.previousDate)) this.previousDate.setDate(startDate.getDate() - 3);
    } else {
      throw new Error("Unsupported ViewMode value!");
    }
  }

  private static getLastFriday(date: ScheduleDate) {
    let d = date.copy();
    let day = d.getDay();
    let diff = (day <= 5) ? (7 - 5 + day) : (day - 5);

    d.setDate(d.getDate() - diff);
    return d;
  }
}

