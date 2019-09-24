import { ScheduleRange, ViewMode } from './rendering/scheduleRange';
import { ScheduleBuilder } from './building/scheduleBuilder';
import { ScheduleAll } from './structure/scheduleAll';
import { VeracrossICSRawBlockSource } from './veracross/veracrossICSRawBlockSource';
import ScheduleDate from './time/scheduleDate';
import { ScheduleRenderer } from './rendering/scheduleRenderer';
import { ScheduleDayType } from './structure/scheduleDay';

class ScheduleParamUtils {
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

class ScheduleCacheManager {
    public static readonly LOCAL_STORAGE_KEY = 'scheduleEvents';

    static async getSchedule(calendarUUID: string): Promise<any> {
        if (localStorage === undefined) {
            // not supported
            console.log('Local storage is not supported! Loading schedule...');
            const jsonString = await this.reloadSchedulePromise(calendarUUID);
            return JSON.parse(jsonString);
        }

        let scheduleString = localStorage.getItem(ScheduleCacheManager.LOCAL_STORAGE_KEY);
        if (scheduleString === null) {
            console.log('Schedule cache does not exist! Loading schedule...');
            const jsonString_1 = await this.reloadSchedulePromise(calendarUUID);
            return JSON.parse(jsonString_1);
        }

        let scheduleObject = JSON.parse(scheduleString);
        if (scheduleObject.versionNumber !== ScheduleAll.CURRENT_VERSION_NUMBER || scheduleObject.id !== calendarUUID) {
            console.log('Schedule cache is invalid! Loading schedule...');
            const jsonString_2 = await this.reloadSchedulePromise(calendarUUID);
            return JSON.parse(jsonString_2);
        }

        if (new Date().getTime() - scheduleObject.creationTime > 1000 * 60 * 60 * 24) {
            console.log('Schedule cache is outdated! Loading in the background...');
            this.reloadSchedulePromise(calendarUUID); // save in the background
        }

        console.log('Schedule loaded successfully from cache!');
        return Promise.resolve(scheduleObject);
    }

    private static reloadSchedulePromise(calendarUUID: string): Promise<string> {
        return ScheduleBuilder.generateScheduleFromBlockSources(
            calendarUUID,
            new VeracrossICSRawBlockSource(calendarUUID)
        ).then((schedule: ScheduleAll) => {
            let jsonString = JSON.stringify(schedule);
            localStorage.setItem('scheduleEvents', jsonString);
            console.log('Schedule reloaded from Veracross and saved to localStorage!');
            return jsonString;
        });
    }
}

const colorDict = {
    0: '#C0C0C0',
    1: '#FFCE51',
    2: '#A67FB9',
    3: '#E67326',
    4: '#00ABBD',
    5: '#AAC02C',
    6: '#EF4957',
    7: '#FF75F2',
    free: 'white'
};

let calendarUUID = ScheduleParamUtils.getCalendarUUID();
let seedDate = ScheduleParamUtils.getSeedDate();
let viewMode = ScheduleParamUtils.getViewMode();
let range = new ScheduleRange(seedDate, viewMode);

console.log('Start schedule program');
Promise.all([
    ScheduleCacheManager.getSchedule(calendarUUID),
    new Promise(resolve => {
        window.addEventListener('DOMContentLoaded', () => {
            resolve();
        });
    })
]).then((things: any) => {
    let schedule = things[0];
    console.log(schedule);
    range.getDatesForWeek().forEach((date: ScheduleDate) => {
        let rawDay = schedule.dayMap[date.toString()];

        let days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // append the header with a link to the veracross page
        $('table.sched.main > tbody > tr:nth-child(1)').append(`
                <td class="daylabel">
                  <a href="https://portals.veracross.com/catlin/student/student/daily-schedule?date=${date.toString()}">
                    <b>
                      ${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate() +
            (rawDay === undefined || !rawDay.dayMeta ? '' : ` (${rawDay.dayMeta})`)}
                    </b>
                  </a>
                </td>
                `);

        if (rawDay === undefined) {
            appendBlankSchedule('No Events', colorDict.free);
            return;
        }

        switch (rawDay.type) {
            case ScheduleDayType.TEXT:
                appendBlankSchedule('TODO', colorDict.free);
                break;
            case ScheduleDayType.INLINE:
                appendInlineSchedule(rawDay, schedule.compressionList);
                break;
            case ScheduleDayType.REGULAR:
                RegularScheduleRenderer.getInstance().appendRegularSchedule(rawDay, schedule.compressionList);
                break;
        }
    });
    $('#schedarea').show();

    ScheduleRenderer.updateLinks(calendarUUID, range);
});

function appendBlankSchedule(text: string, bgcolor: string, link: string = '') {
    // TODO: Remove jquery dependency
    return $('table.sched.main > tbody > tr:nth-child(2)').append(
        `<td rowspan="12" class="specialday" style="background: ${bgcolor};"><a ${
            link === '' ? '' : `href=${link}`
        } class="coursename">${text}</a></td>`
    );
}

function appendInlineSchedule(rawDay: any, compressionList: Array<string>) {}

class RegularScheduleRenderer {

    public static getInstance() {
        if (this.instance === undefined) this.instance = new RegularScheduleRenderer();
        return this.instance;
    }

    private static instance: RegularScheduleRenderer;
    private static readonly NUM_REGULAR_TIMES = 11;

    private mainTimeElements = new Array<HTMLElement>();

    private constructor() {
        for (let i = 0; i <= RegularScheduleRenderer.NUM_REGULAR_TIMES; i++) {
            let elementById = document.getElementById(`time-${i}`);
            if (elementById === null) throw new Error('Error rendering schedule: Time elements not found!');
            this.mainTimeElements.push(elementById);
        }
    }

    appendRegularSchedule(rawDay: any, compressionList: Array<string>) {
        let blocks: Array<Array<any>> = rawDay.blocks;
        blocks.forEach((block: Array<any>) => {
            let title = compressionList[block[0]];
            let location = compressionList[block[1]];
            let blockLabel = block[2];
            let normalTimeIndex = block[3];
            let rowSpan = block[4];
            let mins = block[5];
            let free = block[6];

            let subtitleThings = generateBlockSubtitle(location, blockLabel);
            let subtitle = subtitleThings[0];
            let addLineBreak = subtitleThings[1];
            // let subtitle = location + (blockLabel === '' ? '' : ' - ' + (blockLabel.match(/\d(?![ Flex|X])/) !== null ? 'Blk ' : '') + blockLabel);

            let blockNumMatchAttempt = blockLabel.match(/\d(?![ Flex|X])/);
            let bgcolor = blockNumMatchAttempt !== null ? colorDict[parseInt(blockNumMatchAttempt[0].slice(-1))] : free ? colorDict.free : colorDict[0];

            let trElement = this.mainTimeElements[normalTimeIndex];
            trElement.appendChild(generateBlockElement(rowSpan, mins, bgcolor, title, subtitle, addLineBreak));
        });
    }
}

let mappings = {
    'L': '',
    'X': ' Flex'
};

function expandBlockLabel(blockLabel: string): string {
    if (blockLabel.charAt(0).match(/\d/) !== null) {
        if (blockLabel.length > 1) {
            for (let mappingsKey in mappings) {
                // @ts-ignore
                blockLabel = blockLabel.replace(mappingsKey, mappings[mappingsKey]);
            }
        }
        blockLabel = 'Blk ' + blockLabel;
    }
    return blockLabel;
}

function generateBlockSubtitle(location: string, blockLabel: string): [string, boolean] {
    blockLabel = expandBlockLabel(blockLabel);
    if (blockLabel === 'C&C') {
        return [' - ' + location, false];
    } else if (blockLabel === '') {
        return [location, true];
    } else if (location === '') {
        return [' - ' + blockLabel, false];
    }
    return [location + ' - ' + blockLabel, true];
}

function generateBlockElement(
    rowSpan: number,
    mins: string,
    bgcolor: string,
    title: string,
    subtitle: string,
    newLine: boolean
) {
    let tableData = document.createElement('td');
    tableData.setAttribute('rowspan', rowSpan);
    tableData.setAttribute('class', `period mins${mins}`);
    tableData.setAttribute('style', `background: ${bgcolor};`); // todo replace style with css class
    let titleSpan = document.createElement('span');
    titleSpan.setAttribute('class', 'coursename');
    titleSpan.appendChild(document.createTextNode(title));
    let subtitleSpan = document.createElement('subtitle');
    subtitleSpan.setAttribute('class', 'subtitle');
    subtitleSpan.appendChild(document.createTextNode(subtitle));
    tableData.appendChild(titleSpan);
    if (newLine) tableData.appendChild(document.createElement('br'));
    tableData.appendChild(subtitleSpan);
    return tableData;
}

/*
//Promise chain:
load data
    if load from cache if valid
    else download and process cal data
    save to cache
render data

//Cal data process:
new toBlock(event)
map date -> blocks
new day(blocks)

 */
