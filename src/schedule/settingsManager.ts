import ScheduleParamUtils from './utils/scheduleParamUtils';
import { capitalize } from '../utils/formattingUtils';

let themeCssVariables = [
    '--block-1',
    '--block-2',
    '--block-3',
    '--block-4',
    '--block-5',
    '--block-6',
    '--block-7',
    '--block-activity',
    '--block-free',
    '--text',
    '--link',
    '--border',
    '--divider',
    '--background-color'
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

export function loadAllSettings(globalSettingsObject: any) {

    let themesObject = parseThemesObject(globalSettingsObject);
    let linkObject = parseLinkObject(globalSettingsObject);

    loadSettingsModal(themesObject);

    applyThemes(themesObject);
    applyClassLinks(linkObject);
}

function loadSettingsModal(themesObject: {}) {
    let sel = document.getElementById('theme');
    Object.keys(themesObject).forEach((themeName: string) => {
        // @ts-ignore
        sel.appendChild(createOption(themeName));
    });
    // @ts-ignore
    sel.value = ScheduleParamUtils.getTheme();

    // @ts-ignore
    const openModal = () => document.getElementById('settings-modal').classList.add('is-active');
    // @ts-ignore
    const closeModal = () => document.getElementById('settings-modal').classList.remove('is-active');

    // @ts-ignore
    document.getElementById('settings').addEventListener('click', () => openModal());
    // @ts-ignore
    document.getElementById('save-settings').addEventListener('click', () => {
        let newUrl = new URL(window.location.href);
        // @ts-ignore
        newUrl.searchParams.set('theme', document.getElementById('theme').value);
        window.location.href = newUrl.href;
        closeModal();
    });
    [document.getElementsByClassName('modal-background')[0], document.getElementById('cancel-settings')].forEach(
        el => el !== null && el.addEventListener('click', () => closeModal())
    );
}

function parseThemesObject(globalSettingsObject: any) {
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
    return themesObject;
}

function applyThemes(themesObject: { [x: string]: any; }) {
    let urlTheme = ScheduleParamUtils.getTheme();
    let selectedTheme: string[] = getParameterCaseInsensitive(themesObject, urlTheme);
    if (selectedTheme !== undefined) {
        selectedTheme.forEach(((value, index) => {
            document.documentElement.style.setProperty(themeCssVariables[index], value);
        }));
    }
}

function parseLinkObject(globalSettingsObject: any) {
    let linkObject = {};
    globalSettingsObject.dayLinks.forEach((thing: any) => {
        if (thing.length > 1) {
            // @ts-ignore
            linkObject[thing[0]] = thing.slice(1);
        }
    });
    return linkObject;
}

function applyClassLinks(linkObject: any) {
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
