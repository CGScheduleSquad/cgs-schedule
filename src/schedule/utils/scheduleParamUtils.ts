import ScheduleDate from '../time/scheduleDate';
import { ViewMode } from '../rendering/scheduleRange';

export default class ScheduleParamUtils {
    static getCalendarUUID(): string {
        let calendarUUID = ScheduleParamUtils.getUrlParam('cal');
        if (calendarUUID == null) {
            alert('Invalid URL! Please check that you have followed the instructions correctly.');
            window.location.href = './?'; // exits the page
            return '';
        }
        return calendarUUID;
    }

    static getSeedDate(): ScheduleDate {
        const dateString = ScheduleParamUtils.getUrlParam('date');
        return dateString !== null ? ScheduleDate.fromString(dateString) : ScheduleDate.now();
    }

    static getViewMode(): ViewMode {
        let newRange = ScheduleParamUtils.getUrlParam('range');
        switch (newRange) {
            case 'week':
                return ViewMode.Week;
            case 'day':
                return ViewMode.Day;
            default:
                return ViewMode.Week; // TODO: different default for thin screens (phones)
        }
    }

    private static getUrlParam = (key: string) => new URL(window.location.href).searchParams.get(key);
}