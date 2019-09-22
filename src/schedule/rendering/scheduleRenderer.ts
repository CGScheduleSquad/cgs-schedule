import { ScheduleRange, ViewMode } from "./scheduleRange";

export class ScheduleRenderer {
  static updateLinks(caldendarUUID: string, range: ScheduleRange) {
    $("#schedarea .sched").addClass(range.viewMode === ViewMode.Week ? "week" : "today");
    // left/right arrows
    let navigationArrows = $("td.arrows a");
    navigationArrows.first().prop("href", "?date=" + range.previousDate.toString() + "&range=" + range + "&cal=" + caldendarUUID);
    navigationArrows.last().prop("href", "?date=" + range.nextDate.toString() + "&range=" + range + "&cal=" + caldendarUUID);

    // this week
    $("#today a").prop("href", "?range=day" + "&cal=" + caldendarUUID);
    $("#this-week a").prop("href", "?range=week" + "&cal=" + caldendarUUID);

    // return to portal link
    $("td.controls.links a").last().prop("href", "https://portals.veracross.com/catlin/student/student/daily-schedule?date=" + range.currentDate.toString());
  }
}