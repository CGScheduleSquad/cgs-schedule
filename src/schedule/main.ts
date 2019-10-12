import ScheduleParamUtils from './utils/scheduleParamUtils';
import ScheduleCacheManager from './utils/scheduleCacheManager';
import WindowUtils from '../utils/windowUtils';
import GlobalSettingsCacheManager from '../globalSettings/globalSettingsCacheManager';
import { loadAllSettings } from './settingsManager';
import { toast } from 'bulma-toast';
import ScheduleRenderer from './rendering/scheduleRenderer';

let calendarUUID = ScheduleParamUtils.getCalendarUUID();

// start loading schedule before dom content has loaded, but only draw when the dom has loaded and the schedule has also
let domContentLoaded = WindowUtils.waitForScheduleEvent('DOMContentLoaded');

domContentLoaded.then(() => {
    if (new URL(window.location.href).hash === "#new") {
        toast({
            message: "Schedule generated. Please bookmark the link and/or text it to your phone.",
            type: "is-info",
            duration: 8000,
            position: 'top-center',
            dismissible: true,
            pauseOnHover: true,
            animate: { in: "fadeInDown", out: "fadeOutUp" }
        });

        window.location.hash = '';
    }
});

let scheduleAndDomLoaded = Promise.all([
    ScheduleCacheManager.getSchedule(calendarUUID),
    domContentLoaded
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


