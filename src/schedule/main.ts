import { ScheduleRenderer } from './rendering/scheduleRenderer';
import ScheduleParamUtils from './utils/scheduleParamUtils';
import ScheduleCacheManager from './utils/scheduleCacheManager';
import WindowUtils from '../utils/windowUtils';
import GlobalSettingsCacheManager from '../globalSettings/globalSettingsCacheManager';
import { capitalize } from '../utils/formattingUtils';

let calendarUUID = ScheduleParamUtils.getCalendarUUID();

// start loading schedule before dom content has loaded, but only draw when the dom has loaded and the schedule has also
let scheduleAndDomLoaded = Promise.all([
    ScheduleCacheManager.getSchedule(calendarUUID),
    WindowUtils.waitForScheduleEvent('DOMContentLoaded')
]).then((schedule: any) => schedule[0]);

let scheduleRendered = scheduleAndDomLoaded.then((schedule: any) => {
    ScheduleRenderer.render(schedule, calendarUUID);
});

let scheduleAndGlobalSettingsLoaded = Promise.all([
    GlobalSettingsCacheManager.getGlobalSettings(),
    scheduleRendered
]).then((globalSettings: any) => globalSettings[0]);

scheduleAndGlobalSettingsLoaded.then((globalSettingsObject => {
    loadSettingsModal(globalSettingsObject);
    applyClassLinks(globalSettingsObject);
}));

let themeCssVariables = [
"--block-1",
"--block-2",
"--block-3",
"--block-4",
"--block-5",
"--block-6",
"--block-7",
"--block-activity",
"--block-free",
"--text",
"--link",
"--border",
"--divider",
"--background-color"
];

function createOption(text: string) {
    var opt = document.createElement('option');
    opt.appendChild(document.createTextNode(capitalize(text)));
    opt.value = text;
    return opt;
}

function getParameterCaseInsensitive(object: { [x: string]: any; }, key: string) {
    // @ts-ignore
    return object[Object.keys(object)
        .find(k => k.toLowerCase() === key.toLowerCase())
        ];
}

function loadSettingsModal(globalSettingsObject: any) {

    var colorPattern = /^#([0-9a-f]{3})([0-9a-f]{3})?$/i;

    let themesObject = {};
    globalSettingsObject.themes.forEach((themeArray: any) => {
        if (themeArray.length == themeCssVariables.length + 1 && themeArray[0].length >= 1) {
            // @ts-ignore
            let textValues = themeArray.slice(1);
            if (textValues.every((value: string) => colorPattern.test(value))) {
                // @ts-ignore
                themesObject[themeArray[0].toLowerCase()] = textValues;
            }
        }
    });

    let sel = document.getElementById('theme');
    Object.keys(themesObject).forEach((themeName: string) => {
        // @ts-ignore
        sel.appendChild(createOption(themeName));
    });

    let urlTheme = ScheduleParamUtils.getTheme();
    let selectedTheme: string[] = getParameterCaseInsensitive(themesObject, urlTheme);
    if (selectedTheme !== undefined) {
        selectedTheme.forEach(((value, index) => {
            document.documentElement.style.setProperty(themeCssVariables[index], value);
        }));
        // @ts-ignore
        sel.value = urlTheme;
    }

    // @ts-ignore
    const openModal = () => document.getElementById('settings-modal').classList.add('is-active');
    // @ts-ignore
    const closeModal = () => document.getElementById('settings-modal').classList.remove('is-active');

    // @ts-ignore
    document.getElementById('settings').addEventListener('click', () => openModal());
    // @ts-ignore
    document.getElementById('save-settings').addEventListener('click', () => {
        let newUrl = new URL(window.location.href);
        newUrl.searchParams.set('theme', document.getElementById('theme').value);
        window.location.href = newUrl.href;
        closeModal();
    });
    [document.getElementsByClassName('modal-background')[0], document.getElementById('cancel-settings')].forEach(
        el => el !== null && el.addEventListener('click', () => closeModal())
    );
}

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


