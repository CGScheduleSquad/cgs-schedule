import { ScheduleRenderer } from './rendering/scheduleRenderer';
import ScheduleParamUtils from './utils/scheduleParamUtils';
import ScheduleCacheManager from './utils/scheduleCacheManager';
import WindowUtils from '../utils/windowUtils';
import GlobalSettingsCacheManager from '../globalSettings/globalSettingsCacheManager';
import { loadAllSettings } from './settingsManager';

let calendarUUID = ScheduleParamUtils.getCalendarUUID();

// start loading schedule before dom content has loaded, but only draw when the dom has loaded and the schedule has also
let scheduleAndDomLoaded = Promise.all([
    ScheduleCacheManager.getSchedule(calendarUUID),
    WindowUtils.waitForScheduleEvent('DOMContentLoaded')
]).then((schedule: any) => schedule[0]);

let scheduleRendered = scheduleAndDomLoaded.then((schedule: any) => {
    ScheduleRenderer.render(schedule);
});

let scheduleAndGlobalSettingsLoaded = Promise.all([
    GlobalSettingsCacheManager.getGlobalSettings(),
    scheduleRendered
]).then((globalSettings: any) => globalSettings[0]);

scheduleAndGlobalSettingsLoaded.then((globalSettingsObject => {
    loadAllSettings(globalSettingsObject);
}));


