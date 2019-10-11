import ScheduleDate from '../time/scheduleDate';
import { ViewMode } from '../rendering/scheduleRange';
import ScheduleTime from '../time/scheduleTime';

export default class ScheduleParamUtils {
    static getCalendarUUID(): string {
        let calendarUUID = ScheduleParamUtils.getUrlParam('cal');
        if (calendarUUID == null) {
            alert('Invalid URL! Please check that you have followed the instructions correctly.');
            window.location.href = './index.html'; // exits the page
            return '';
        }
        return calendarUUID;
    }

    static getSeedDate(): ScheduleDate {
        const dateString = ScheduleParamUtils.getUrlParam('date');
        return dateString !== null && dateString !== "" ? ScheduleDate.fromString(dateString) : (ScheduleTime.now().hours < 3 ? ScheduleDate.now() : ScheduleDate.now().setDate(ScheduleDate.now().getDate()+1));
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

    static getTheme(): string {
        let themeString = ScheduleParamUtils.getUrlParam('theme');
        return themeString == null ? 'classic' : themeString;
    }

    private static getUrlParam(key: string) {
        return new URL(window.location.href).searchParams.get(key);
    }
}
