import { ScheduleRenderer } from './rendering/scheduleRenderer';
import ScheduleParamUtils from './utils/scheduleParamUtils';
import ScheduleCacheManager from './utils/scheduleCacheManager';
import WindowUtils from '../utils/windowUtils';
import GlobalSettingsCacheManager from '../globalSettings/globalSettingsCacheManager';

let calendarUUID = ScheduleParamUtils.getCalendarUUID();

// start loading schedule before dom content has loaded, but only draw when the dom has loaded and the schedule has also
let scheduleAndDomLoaded = Promise.all([
    ScheduleCacheManager.getSchedule(calendarUUID),
    WindowUtils.waitForScheduleEvent('DOMContentLoaded')
]).then((schedule: any) => schedule[0]);

scheduleAndDomLoaded.then((schedule: any) => {
    ScheduleRenderer.render(schedule, calendarUUID);
});

let scheduleAndDomAndGlobalSettingsLoaded = Promise.all([
    GlobalSettingsCacheManager.getGlobalSettings(),
    scheduleAndDomLoaded
])
    .then((globalSettings: any) => globalSettings[0]);

scheduleAndDomAndGlobalSettingsLoaded.then((globalSettingsObject => {
    applyClassLinks(globalSettingsObject);
}));

function applyClassLinks(globalSettingsObject: any) {
    let linkObject = {};
    globalSettingsObject.dayLinks.forEach((thing: any) => {
        if (thing.length > 1) {
            // @ts-ignore
            linkObject[thing[0]] = thing.slice(1);
        }
    });
    Array.from(document.getElementsByClassName('coursename')).forEach((el: any): any => {
        // @ts-ignore
        if (linkObject[el.innerText] !== undefined) {
            let htmlElement = el.parentElement;
            htmlElement.classList.add('has-link');
            // @ts-ignore
            htmlElement.addEventListener('click', () => window.open(linkObject[el.innerText][0], '_blank'));
        }
    });
}


