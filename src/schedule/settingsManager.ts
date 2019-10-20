import ScheduleParamUtils from './utils/scheduleParamUtils';
import { capitalize } from '../utils/formattingUtils';
import { toast } from 'bulma-toast';
import { CookieManager } from '../cookieManager';
import { ViewMode } from './rendering/scheduleRange';

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

function applyHighlight() {
    let viewMode = ScheduleParamUtils.getViewMode();
    if (viewMode !== ViewMode.Day) {
        let labelDay = ScheduleParamUtils.getCurrentDate();
        $('.daylabel[date=\'' + labelDay.toString() + '\']').addClass('day-highlight');
    }
}

export function loadAllSettings(globalSettingsObject: any) {
    if (new URL(window.location.href).hash === "#updated") {

        toast({
            message: "Settings updated successfully. Please bookmark the new link.",
            type: "is-info",
            duration: 5000,
            position: 'top-center',
            dismissible: true,
            pauseOnHover: true,
            animate: { in: "fadeInDown", out: "fadeOutUp" }
        });

        window.location.hash = '';
    }

    let themesObject = parseThemesObject(globalSettingsObject);
    let linkObject = parseLinkObject(globalSettingsObject);

    loadSettingsModal(themesObject);

    applyThemes(themesObject);
    if (ScheduleParamUtils.getLinksEnabled()) applyClassLinks(linkObject);
    if (ScheduleParamUtils.getHighlightEnabled()) applyHighlight();
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
    let linksCheckbox = document.getElementById('class-links');
    // @ts-ignore
    linksCheckbox.checked = ScheduleParamUtils.getLinksEnabled();
    // @ts-ignore
    let highlightCheckbox = document.getElementById('day-highlight');
    // @ts-ignore
    highlightCheckbox.checked = ScheduleParamUtils.getHighlightEnabled();

    const openModal = () => {
        let settingsAd = document.getElementById('settings-ad');
        if (settingsAd !== null) settingsAd.classList.add('hidden');
        CookieManager.dismissSettingsAd();
        // @ts-ignore
        return document.getElementById('settings-modal').classList.add('is-active');
    };
    // @ts-ignore
    const closeModal = () => document.getElementById('settings-modal').classList.remove('is-active');

    // @ts-ignore
    document.getElementById('settings').firstElementChild.addEventListener('click', () => openModal());
    // @ts-ignore
    document.getElementById('save-settings').addEventListener('click', () => {
        if (
            // @ts-ignore
            highlightCheckbox.checked !== ScheduleParamUtils.getHighlightEnabled()
            // @ts-ignore
            || linksCheckbox.checked !== ScheduleParamUtils.getLinksEnabled()
            // @ts-ignore
            || sel.value !== ScheduleParamUtils.getTheme()
        ) {
            let newUrl = new URL(window.location.href);
            // @ts-ignore
            newUrl.searchParams.set('highlight', highlightCheckbox.checked);
            // @ts-ignore
            newUrl.searchParams.set('links', linksCheckbox.checked);
            // @ts-ignore
            newUrl.searchParams.set('theme', sel.value);
            newUrl.hash = "#updated";
            window.location.href = newUrl.href;
        }
        closeModal();
    });
    [document.getElementsByClassName('modal-background')[0], document.getElementById('cancel-settings')].forEach(
        el => el !== null && el.addEventListener('click', () => closeModal())
    );
}

function parseThemesObject(globalSettingsObject: any) {
    var namePattern = /^[\w| ]+$/i;
    var colorPattern = /^#([0-9a-f]{3})([0-9a-f]{3})?$/i;
    let themesObject = {};
    globalSettingsObject.themes.forEach((theme: any) => {
        if (theme.length < themeCssVariables.length + 1) return;
        // @ts-ignore
        let textValues = theme.slice(1, themeCssVariables.length + 1);
        if (namePattern.test(theme[0]) && textValues.every((value: string) => colorPattern.test(value))) {
            // @ts-ignore
            themesObject[theme[0].toLowerCase()] = textValues;
        } else {
            console.log("Ignored theme entry: ");
            console.log(theme);
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
    var classNamePattern = /^[^<>\n\\=]+$/;
    var blockNumberPattern = /^[1-7]$/;
    var urlPattern = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
    var minLength = 3;

    let linkObject = {};
    globalSettingsObject.dayLinks.forEach((linkEntry: any) => {
        if (linkEntry.length < minLength) return;
        let className = linkEntry[0];
        let blockNumber = linkEntry[1];
        let filteredLinks = linkEntry.slice(2).filter((link: string) => urlPattern.test(link));
        if (classNamePattern.test(className) && blockNumberPattern.test(blockNumber) && filteredLinks.length >= 1) {
            // @ts-ignore
            linkObject[className+blockNumber] = filteredLinks;
        } else {
            console.log("Ignored link entry: ");
            console.log(linkEntry);
        }
    });
    return linkObject;
}

function forceOpenTabIfSafari(href: string) {
    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isSafari) {
        var a = document.createElement('a');
        a.setAttribute("href", href);
        a.setAttribute("target", "_blank");

        var dispatch = document.createEvent("HTMLEvents");
        dispatch.initEvent("click", true, true);
        a.dispatchEvent(dispatch);
    } else {
        window.open(href, "_blank")
    }
}

function applyClassLinks(linkObject: any) {

    let linkObjectKeys = Object.keys(linkObject);

    Array.from(document.getElementsByClassName('coursename')).forEach((courseName: Element): any => {
        // @ts-ignore
        let parentElement = courseName.parentElement;
        if (parentElement === null) return;
        let blocklabel = parentElement.getAttribute('blocklabel');
        if (blocklabel === undefined) return;
        // @ts-ignore
        let workingKey = courseName.innerText + blocklabel;
        let linkObjectElement = linkObject[workingKey];
        if (linkObjectElement === undefined) return;
        parentElement.classList.add('has-link');
        parentElement.classList.add('link-index-'+linkObjectKeys.indexOf(workingKey));
        parentElement.addEventListener('click', () => forceOpenTabIfSafari(linkObjectElement[0]));
    });

    linkObjectKeys.forEach((className, classNameIndex) => {
        let items: {} = {};
        linkObject[className].forEach((link: string) => {
            // @ts-ignore
            items[link] = { name: link.substring(0, 50).replace("https://", '').replace("http://", '') + (link.length > 50 ? '...' : '') }
        });
        // @ts-ignore
        $.contextMenu({
            selector: ".link-index-" + classNameIndex,
            callback: function(key: string | undefined) {
                window.open(key, '_blank');
            },
            items: items
        });
    });
}
