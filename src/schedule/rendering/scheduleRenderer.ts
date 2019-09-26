import { ScheduleRange, ViewMode } from './scheduleRange';

export default class ScheduleRenderer {
    static updateLinks(calendarUUID: string, range: ScheduleRange): void {
        let viewMode = range.viewMode === ViewMode.Day ? 'day' : 'week';
        // @ts-ignore
        let schedarea = document.getElementById('schedarea').firstElementChild;
        // @ts-ignore
        schedarea.setAttribute(
            'class',
            // @ts-ignore
            `${schedarea.getAttribute('class')} ${range.viewMode === ViewMode.Week ? 'week' : 'today'}`
        );
        // left/right arrows
        let navigationArrows = document.querySelectorAll('td.arrows a');
        // @ts-ignore
        navigationArrows[0].setAttribute(
            'href',
            `?date=${range.previousDate.toString()}&range=${viewMode}&cal=${calendarUUID}`
        );
        // @ts-ignore
        navigationArrows[1].setAttribute(
            'href',
            `?date=${range.nextDate.toString()}&range=${viewMode}&cal=${calendarUUID}`
        );

        // this week
        // @ts-ignore
        document.getElementById('today').firstElementChild.setAttribute('href', `?range=day&cal=${calendarUUID}`);
        // @ts-ignore
        document.getElementById('this-week').firstElementChild.setAttribute('href', `?range=week&cal=${calendarUUID}`);
        // @ts-ignore
        document
            .getElementById('my-portal')
            .setAttribute(
                'href',
                `https://portals.veracross.com/catlin/student/student/daily-schedule?date=${range.startDate.toString()}`
            );
    }
}
