import ScheduleParamUtils from './utils/scheduleParamUtils';
import { capitalize } from '../utils/formattingUtils';
import { toast } from 'bulma-toast';
import { CookieManager } from '../cookieManager';
import { ScheduleRange, ViewMode } from './rendering/scheduleRange';
import { VeracrossICalUtils } from './veracross/veracrossICalUtils';
import GenericCacheManager from '../globalSettings/genericCacheManager';
import ScheduleDate from './time/scheduleDate';
import { Converter } from 'showdown';

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
    '--class-text',
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
        let highlightDay = new ScheduleRange(ScheduleParamUtils.getCurrentDate(), ViewMode.Day).startDate;
        $('.daylabel[date=\'' + highlightDay.toString() + '\']').addClass('day-highlight');
    }
}

export function loadAllSettings(globalSettingsObject: any) {
    if (new URL(window.location.href).hash === '#updated') {

        toast({
            message: 'Settings updated successfully. Please bookmark the new link.',
            type: 'is-info',
            duration: 5000,
            position: 'top-center',
            dismissible: true,
            pauseOnHover: true,
            animate: { in: 'fadeInDown', out: 'fadeOutUp' }
        });

        window.location.hash = '';
    }

    let themesObject = parseThemesObject(globalSettingsObject);
    let linkObject = parseLinkObject(globalSettingsObject);
    let calendarFeedObject = parseCalendarFeedObject(globalSettingsObject);
    let googleSheetObject = parseGoogleSheetsObject(globalSettingsObject);
    let haikuCalendarObject = parseHaikuCalendarObject(globalSettingsObject);

    loadSettingsModal(themesObject);

    applyThemes(themesObject);
    if (ScheduleParamUtils.getLinksEnabled()) applyClassLinks(linkObject);
    if (ScheduleParamUtils.getHighlightEnabled()) applyHighlight();
    if (ScheduleParamUtils.getCalendarEventsEnabled()) {
        applyCanvasCalendar(calendarFeedObject);
        applyGoogleSheets(googleSheetObject);
        applyHaikuCalendar(haikuCalendarObject);
        setupCalendarEventModal();
    }
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
    let calendarCheckbox = document.getElementById('calendar-events');
    // @ts-ignore
    calendarCheckbox.checked = ScheduleParamUtils.getCalendarEventsEnabled();
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
            || calendarCheckbox.checked !== ScheduleParamUtils.getCalendarEventsEnabled()
            // @ts-ignore
            || sel.value !== ScheduleParamUtils.getTheme()
        ) {
            let newUrl = new URL(window.location.href);
            // @ts-ignore
            newUrl.searchParams.set('highlight', highlightCheckbox.checked);
            // @ts-ignore
            newUrl.searchParams.set('links', linksCheckbox.checked);
            // @ts-ignore
            newUrl.searchParams.set('calendars', calendarCheckbox.checked);
            // @ts-ignore
            newUrl.searchParams.set('theme', sel.value);
            newUrl.hash = '#updated';
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
            console.log('Ignored theme entry: ');
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

var urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
var classNamePattern = /^[^<>\n\\=]+$/;
var blockNumberPattern = /^[1-7]$/;
function parseLinkObject(globalSettingsObject: any) {
    var minLength = 3;

    let linkObject = {};
    globalSettingsObject.dayLinks.forEach((linkEntry: any) => {
        if (linkEntry.length < minLength) return;
        let className = linkEntry[0];
        let blockNumber = linkEntry[1];
        let filteredLinks = linkEntry.slice(2).filter((link: string) => urlPattern.test(link));
        if (classNamePattern.test(className) && blockNumberPattern.test(blockNumber) && filteredLinks.length >= 1) {
            // @ts-ignore
            linkObject[className + blockNumber] = filteredLinks;
        } else {
            console.log('Ignored link entry: ');
            console.log(linkEntry);
        }
    });
    return linkObject;
}

function parseCalendarFeedObject(globalSettingsObject: any) {
    let length = 4;

    let allClassIds = getAllClassIds();
    let calFeedsObject = {};
    globalSettingsObject.calFeeds.forEach((thing: any) => {
        if (thing.length !== length) return;
        let className = thing[0];
        let blockNumber = thing[1];
        let canvasId = thing[2];
        let calendarUrl = thing[3];
        if (classNamePattern.test(className) && blockNumberPattern.test(blockNumber) && classNamePattern.test(canvasId) && urlPattern.test(calendarUrl)) {
            let classKey = className + blockNumber;
            if (allClassIds.has(classKey)) {
                // @ts-ignore
                calFeedsObject[classKey] = [canvasId, calendarUrl];
            }
        }
    });
    return calFeedsObject;
}

function parseGoogleSheetsObject(globalSettingsObject: any) {
    let length = 5;

    let allClassIds = getAllClassIds();
    let googleSheetsObject = {};
    globalSettingsObject.googleSheets.forEach((thing: any) => {
        if (thing.length !== length) return;
        let className = thing[0];
        let blockNumber = thing[1];
        let sheetRange = thing[2];
        let useLabels = thing[3] === 'yes';
        let sheetId = thing[4];
        if (classNamePattern.test(className) && blockNumberPattern.test(blockNumber) && classNamePattern.test(sheetRange) && /[a-zA-Z0-9-_]+/.test(sheetId)) {
            let classKey = className + blockNumber;
            if (allClassIds.has(classKey)) {
                // @ts-ignore
                googleSheetsObject[classKey] = [sheetRange, useLabels, sheetId];
            }
        }
    });
    return googleSheetsObject;
}
function parseHaikuCalendarObject(globalSettingsObject: any) {
    let length = 3;

    let allClassIds = getAllClassIds();
    let haikuCalendarObject = {};
    globalSettingsObject.haikuCal.forEach((thing: any) => {
        if (thing.length !== length) return;
        let className = thing[0];
        let blockNumber = thing[1];
        let calendarLink = thing[2];
        if (classNamePattern.test(className) && blockNumberPattern.test(blockNumber) && urlPattern.test(calendarLink)) {
            let classKey = className + blockNumber;
            if (allClassIds.has(classKey)) {
                // @ts-ignore
                haikuCalendarObject[classKey] = [calendarLink];
            }
        }
    });
    return haikuCalendarObject;
}

function forceOpenTabIfSafari(href: string) {
    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isSafari) {
        var a = document.createElement('a');
        a.setAttribute('href', href);
        a.setAttribute('target', '_blank');

        var dispatch = document.createEvent('HTMLEvents');
        dispatch.initEvent('click', true, true);
        a.dispatchEvent(dispatch);
    } else {
        window.open(href, '_blank');
    }
}

function applyClassLinks(linkObject: any) {

    let linkObjectKeys = Object.keys(linkObject);

    Array.from(document.getElementsByClassName('coursename')).forEach((courseName: Element): any => {
        // @ts-ignore
        let parentElement = courseName.parentElement;
        if (parentElement === null) return;
        let blocklabel = parentElement.getAttribute('blocklabel');
        // @ts-ignore
        let workingKey = courseName.innerText + blocklabel;
        let linkObjectElement = linkObject[workingKey];
        // @ts-ignore // TODO: Remove
        if (courseName.innerText === 'Lunch') linkObjectElement = ['https://www.sagedining.com/menus/catlingabelschool/'];
        if (linkObjectElement === undefined) return;
        parentElement.classList.add('has-link');
        parentElement.classList.add('link-index-' + linkObjectKeys.indexOf(workingKey));
        $(parentElement).on('click.links', () => forceOpenTabIfSafari(linkObjectElement[0]));
    });

    linkObjectKeys.forEach((className, classNameIndex) => {
        let items: {} = {};
        linkObject[className].forEach((link: string) => {
            // @ts-ignore
            items[link] = { name: link.substring(0, 50).replace('https://', '').replace('http://', '') + (link.length > 50 ? '...' : '') };
        });
        // @ts-ignore
        $.contextMenu({
            selector: '.link-index-' + classNameIndex,
            callback: function(key: string | undefined) {
                window.open(key, '_blank');
            },
            items: items
        });
    });
}

function getAllClassIds() {
    let listOfClasses = new Set();
    Array.from(document.getElementsByClassName('coursename')).forEach((courseName: Element): any => {
        // @ts-ignore
        let parentElement = courseName.parentElement;
        if (parentElement === null) return;
        let blocklabel = parentElement.getAttribute('blocklabel');
        // @ts-ignore
        let workingKey = courseName.innerText + blocklabel;
        listOfClasses.add(workingKey);
    });
    return listOfClasses;
}

let maxSheetItemLength = 30;
function applyCanvasCalendar(calendarFeedObject: any) {
    var converter = new Converter();
    let feedKeyToCalendar = (key: string) => GenericCacheManager.getCacheResults(key, 'https://cgs-schedule-cors.herokuapp.com/' + calendarFeedObject[key][1]).then(icsString => {
        // @ts-ignore
        let parsedPath = ICAL.parse(icsString);
        return parsedPath[2];
    }).then(calendarEvents => {
        return calendarEvents
            .map((event: any) => {
                try {
                    let date = VeracrossICalUtils.getDate(event[1]);
                    let splitTitle = VeracrossICalUtils.getSummary(event[1]).split(' [');
                    let title = splitTitle[0];
                    let canvasId = splitTitle[1].slice(0, -1);
                    let description = '<h4>' + title + '</h4> ' + converter.makeHtml(VeracrossICalUtils.getDescriptionAsText(event[1]));

                    if (date === null || canvasId !== calendarFeedObject[key][0])
                        return null;

                    let courseName = key.slice(0, -1);
                    let courseLabel = key.slice(-1);
                    return new ClassHomeworkEvent(date, courseName, courseLabel, title, description);
                } catch (e) {
                    return null;
                }
            })
            .filter((rawBlock: any) => rawBlock !== null);
    }).catch((e: Error) => {
        console.warn(e);
        console.warn('Calendar link returned 404!');
        return null;
    });

    let allCalPromises = Object.keys(calendarFeedObject).map(feedKeyToCalendar);
    Promise.all(allCalPromises).then((calendars: Array<any>) => {
        calendars.filter((value => value !== undefined && value !== null)).forEach((calendarEvents: Array<ClassHomeworkEvent>) => {
            calendarEvents.forEach((value: ClassHomeworkEvent) => {
                value.apply();
            })
        });
    });
}

function applyGoogleSheets(googleSheetsObject: any) {
    let feedKeyToCalendar = (key: string) => GenericCacheManager.getCacheResults(key + 'sheet', `https://cgs-schedule.herokuapp.com/get-sheet?sheetid=${googleSheetsObject[key][2]}&range=${googleSheetsObject[key][0]}`).then(icsString => {
        return JSON.parse(icsString);
    }).then(calendarEvents => {
        let labels = calendarEvents[0];
        return calendarEvents.map((event: any) => {
            if (event.length < 1) {
                return null;
            }
            let dateMatcher = /\b(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])\b/;
            let dates = event.map((cell: string) => dateMatcher.exec(cell));
            let indexOfDate = dates.findIndex((date: any) => date !== null && date !== undefined);
            let eventDescription = event[indexOfDate + 1];
            if (indexOfDate === -1 || eventDescription === undefined || eventDescription.trim().length <= 2) {
                return null;
            }

            let currentDate = new Date();
            let currentMonth = currentDate.getMonth();
            let startYear = currentMonth > 7 ? currentDate.getFullYear() : currentDate.getFullYear() - 1;

            let date = ScheduleDate.fromDate(new Date(dates[indexOfDate][0]));
            if (date.getMonth() > 7) {
                date.setFullYear(startYear);
            } else {
                date.setFullYear(startYear + 1);
            }
            let trimChars = function(string: string, c: string) {
                var re = new RegExp('^[' + c + ']+|[' + c + ']+$', 'g');
                return string.replace(re, '');
            };

            let charsToReplace = ':-';
            let title = trimChars(eventDescription, charsToReplace);

            let matchedLabels = labels.slice(indexOfDate + 1).map((string: string) => trimChars(string, charsToReplace));
            let description = event.slice(indexOfDate + 1).map((string: string) => trimChars(string, charsToReplace)).map((contents: string, i: number) => {
                if (contents.trim() === '') return '';
                let label = matchedLabels[i];
                if (googleSheetsObject[key][1] && label !== undefined && label !== '') {
                    return '<b>' + label + ':</b> ' + contents;
                } else {
                    return contents;
                }
            }).filter((string: string) => string !== '').join('<br>');
            let courseName = key.slice(0, -1);
            let courseLabel = key.slice(-1);
            return new ClassHomeworkEvent(date, courseName, courseLabel, title, description);
        })
            .filter((rawBlock: any) => rawBlock !== null);
    }).catch((e: Error) => {
        console.warn(e);
        console.warn('Calendar link returned 404!');
        return null;
    });

    let allCalPromises = Object.keys(googleSheetsObject).map(feedKeyToCalendar);
    Promise.all(allCalPromises).then((calendars: Array<any>) => {
        calendars.filter((value => value !== undefined && value !== null)).forEach((calendarEvents: Array<ClassHomeworkEvent>) => {
            calendarEvents.forEach((value: ClassHomeworkEvent) => {
                value.apply();
            });
        });
    });
}

function applyHaikuCalendar(calendarFeedObject: any) {
    let feedKeyToCalendar = (key: string) => GenericCacheManager.getCacheResults(key + 'sheet', 'https://cgs-schedule-cors.herokuapp.com/' + calendarFeedObject[key][0]).then(icsString => {
        // @ts-ignore
        let parsedPath = ICAL.parse(icsString);
        return parsedPath[2];
    }).then((calendarEvents: Array<ClassHomeworkEvent>) => {
        return calendarEvents
            .map((event: any) => {
                try {
                    let date = VeracrossICalUtils.getDate(event[1]);
                    let title = VeracrossICalUtils.getSummary(event[1]);
                    let description = VeracrossICalUtils.getDescriptionAsText(event[1]);

                    if (date === null)
                        return null;

                    let courseName = key.slice(0, -1);
                    let courseLabel = key.slice(-1);

                    return new ClassHomeworkEvent(date, courseName, courseLabel, title, description);
                } catch (e) {
                    return null;
                }
            })
            .filter((rawBlock: any) => rawBlock !== null);
    }).catch((e: Error) => {
        console.warn(e);
        console.warn('Calendar link returned 404!');
        return null;
    });

    let allCalPromises = Object.keys(calendarFeedObject).map(feedKeyToCalendar);

    Promise.all(allCalPromises).then((calendars: Array<any>) => {
        calendars.filter((value => value !== undefined && value !== null)).forEach((calendarEvents: Array<ClassHomeworkEvent>) => {
            calendarEvents.forEach((value: ClassHomeworkEvent) => {
                value.apply();
            })
        });
    });
}

function openCalendarEventModal(value: ClassHomeworkEvent) {
    $('#calendar-event-header').html(value.courseName + ' - Block ' + value.courseLabel + ' - ' + value.date.toHRStringLong());
    $('#calendar-event-body').html(value.description);
    $('#calendar-event-footer').html(value.courseName);
    $('#calendar-event-modal').addClass('is-active');
}

function setupCalendarEventModal() {

    // @ts-ignore
    const closeModal = () => document.getElementById('calendar-event-modal').classList.remove('is-active');

    [document.getElementById('calendar-event-background')].forEach(
        el => el !== null && el.addEventListener('click', () => closeModal())
    );
}

class ClassHomeworkEvent {
    private readonly _date: ScheduleDate;
    private readonly _courseName: string;
    private readonly _courseLabel: string;
    private readonly _title: string;
    private readonly _description: string;

    constructor(date: ScheduleDate, courseName: string, courseLabel: string, title: string, description: string) {
        this._date = date;
        this._courseName = courseName;
        this._courseLabel = courseLabel;
        this._title = title;
        this._description = description;
    }

    get date(): ScheduleDate {
        return this._date;
    }

    get courseName(): string {
        return this._courseName;
    }

    get courseLabel(): string {
        return this._courseLabel;
    }

    get title(): string {
        return this._title;
    }

    get shortTitle(): string {
        return this._title.trim().substring(0, maxSheetItemLength)
            + (this._title.length > maxSheetItemLength ? '...' : '');
    }

    get description(): string {
        return this._description;
    }

    apply() {
        let htmlElements = $(`td[blocklabel="${this.courseLabel}"][classtitle="${this.courseName}"][date="${this.date}"]`);
        htmlElements.children('.subtitle').text(this.shortTitle).addClass('calendar-feed-subtitle');
        htmlElements.addClass('has-link');
        htmlElements.off('click.links');
        htmlElements.on('click',() => openCalendarEventModal(this));
    }
}
