import { ScheduleRange, ViewMode } from './rendering/scheduleRange';
import { ScheduleBuilder } from './building/scheduleBuilder';
import { ScheduleAll } from './structure/scheduleAll';
import { VeracrossICSRawBlockSource } from './veracross/veracrossICSRawBlockSource';
import ScheduleDate from './time/scheduleDate';
import { ScheduleRenderer } from './rendering/scheduleRenderer';
import { ScheduleDayType } from './structure/scheduleDay';
import ScheduleTime from './time/scheduleTime';

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
    ScheduleCacheManager.getSchedule(calendarUUID), // start loading schedule before dom content has loaded, but only draw when the dom has loaded and the schedule has also
    new Promise(resolve => {
        window.addEventListener('DOMContentLoaded', () => {
            resolve();
        });
    })
]).then((things: any) => {
    let schedule = things[0];
    let days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let dates = range.getDatesForWeek();
    let oneDay = dates.length === 1;
    dates.forEach((date: ScheduleDate) => {
        let rawDay = schedule.dayMap[date.toString()];

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

        if (rawDay === undefined) rawDay = { type: ScheduleDayType.TEXT };

        switch (rawDay.type) {
            case ScheduleDayType.TEXT:
                appendBlankSchedule('No Events', colorDict.free);
                break;
            case ScheduleDayType.INLINE:
                if (oneDay) $('.times').hide();
                InlineScheduleRenderer.getInstance().appendSchedule(rawDay, schedule.compressionList);
                break;
            case ScheduleDayType.REGULAR:
                RegularScheduleRenderer.getInstance().appendSchedule(rawDay, schedule.compressionList);
                break;
        }
    });
    if (oneDay) {
        $('.mainlabel').hide();
        $('.daylabel')
            .first()
            .attr('colspan', 2);
    }
    $('#schedarea').show();

    ScheduleRenderer.updateLinks(calendarUUID, range);
});

function appendBlankSchedule(text: string, bgcolor: string, link: string = '') {
    // TODO: Remove jquery dependency
    return $('table.sched.main > tbody > tr:nth-child(2)').append(
        `<td rowspan="12" class="specialday" style="background: ${bgcolor}; border-bottom: 2px; border-style: solid"><a ${
            link === '' ? '' : `href=${link}`
        } class="coursename">${text}</a></td>`
    );
}

function format12HourTime(date: ScheduleTime) {
    return (((date.hours - 1) % 12) + 1 + ':' + (date.minutes < 10 ? '0' : '') + date.minutes);
}

class InlineScheduleRenderer {

    public static getInstance() {
        if (this.instance === undefined) this.instance = new InlineScheduleRenderer();
        return this.instance;
    }

    private static instance: InlineScheduleRenderer;

    private constructor() {
    }

    appendSchedule(rawDay: any, compressionList: Array<string>) {
        let blocks: Array<Array<any>> = rawDay.blocks;
        let trElement = document.getElementById(`time-0`);
        if (trElement === null) throw new Error('Error rendering schedule: Time elements not found!');

        let tableData = document.createElement('td');
        tableData.setAttribute('rowspan', String(12));
        tableData.setAttribute('class', `specialday`);
        let specialTable = document.createElement('table');
        specialTable.setAttribute('class', 'sched week special');
        let tbody = document.createElement('tbody');
        specialTable.appendChild(tbody);
        tableData.appendChild(specialTable);
        trElement.appendChild(tableData);

        blocks.forEach((block: Array<any>) => {
            let inlineParseBlock = InlineParseBlock.parseRawBlock(block, compressionList);
            // @ts-ignore
            tbody.appendChild(inlineParseBlock.generateBlockElement());
        });
    }
}

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

    appendSchedule(rawDay: any, compressionList: Array<string>) {
        let blocks: Array<Array<any>> = rawDay.blocks;
        blocks.forEach((block: Array<any>) => {
            let inlineParseBlock = RegularParseBlock.parseRawBlock(block, compressionList);
            let trElement = this.mainTimeElements[inlineParseBlock.normalTimeIndex];
            trElement.appendChild(inlineParseBlock.generateBlockElement());
        });
    }
}

abstract class ParsedBlock {
    // Maps block label content to: [replacement text, whether the block should be colored]
    private static readonly blockLabelMappings = {
        'L': ['', true],
        'X': [' Flex', false]
    };

    // calculated values
    private shouldBeColored = true;
    protected addLineBreak = true;
    protected subtitle = '';
    protected bgcolor = 'white';

    // read values
    protected readonly title: string;
    protected readonly mins: string;
    private readonly free: boolean;


    protected constructor(title: string, location: string, blockLabel: string, mins: string, free: boolean) {
        this.title = title;
        this.mins = mins;
        this.free = free;

        this.generateBlockSubtitle(location, blockLabel);
    }

    private generateBlockSubtitle(location: string, blockLabel: string) {
        blockLabel = this.expandBlockLabel(blockLabel);
        if (blockLabel === 'C&C') {
            this.subtitle = ' - ' + location;
            this.addLineBreak = false;
        } else if (blockLabel === '') {
            this.subtitle = location;
            this.addLineBreak = true;
        } else if (location === '') {
            this.subtitle = ' - ' + blockLabel;
            this.addLineBreak = false;
        } else {
            this.subtitle = location + ' - ' + blockLabel;
        }
    }

    private expandBlockLabel(blockLabel: string) {
        if (blockLabel.charAt(0).match(/\d/) !== null) {
            if (blockLabel.length > 1) {
                for (let mappingsKey in ParsedBlock.blockLabelMappings) {
                    if (blockLabel.indexOf(mappingsKey) !== -1) {
                        // @ts-ignore
                        blockLabel = blockLabel.replace(mappingsKey, ParsedBlock.blockLabelMappings[mappingsKey][0]);
                        // @ts-ignore
                        this.shouldBeColored = this.shouldBeColored && ParsedBlock.blockLabelMappings[mappingsKey][1];
                    }
                }
            }
            blockLabel = 'Blk ' + blockLabel;
        }

        if (this.free || this.title === 'Free' || this.title === 'Late Start') {
            this.bgcolor = colorDict.free;
        } else if (this.shouldBeColored) {
            let blockNumMatchAttempt = blockLabel.match(/\d/);
            // @ts-ignore
            this.bgcolor = blockNumMatchAttempt !== null ? colorDict[parseInt(blockNumMatchAttempt[0].slice(-1))] : colorDict[0];
        } else {
            this.bgcolor = colorDict[0];
        }
        return blockLabel;
    }

    protected static generateBlockElement(
        rowSpan: number,
        mins: string,
        bgcolor: string,
        title: string,
        subtitle: string,
        newLine: boolean, specialPeriod = false
    ) {
        let tableData = document.createElement('td');
        tableData.setAttribute('rowspan', String(rowSpan));
        tableData.setAttribute('class', `period mins${mins} ${specialPeriod ? 'specialperiod' : ''}`);
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
}

class RegularParseBlock extends ParsedBlock {

    public static parseRawBlock(block: any, compressionList: Array<string>) {
        let title = compressionList[block[0]];
        let location = compressionList[block[1]];
        let blockLabel = block[2];
        let normalTimeIndex = block[3];
        let rowSpan = block[4];
        let mins = block[5];
        let free = block[6];

        return new RegularParseBlock(title, location, blockLabel, mins, free, normalTimeIndex, rowSpan);
    }

    public readonly normalTimeIndex: number;
    private readonly rowSpan: number;

    constructor(title: string, location: string, blockLabel: string, mins: string, free: boolean, normalTimeIndex: number, rowSpan: number) {
        super(title, location, blockLabel, mins, free);
        this.normalTimeIndex = normalTimeIndex;
        this.rowSpan = rowSpan;
    }

    generateBlockElement() {
        return ParsedBlock.generateBlockElement(this.rowSpan, this.mins, this.bgcolor, this.title, this.subtitle, this.addLineBreak);
    }
}

class InlineParseBlock extends ParsedBlock {

    public static parseRawBlock(block: any, compressionList: Array<string>) {
        let title = compressionList[block[0]];
        let location = compressionList[block[1]];
        let blockLabel = block[2];
        let startTime = new ScheduleTime(0, block[3]);
        let endTime = new ScheduleTime(0, block[4]);
        let mins = block[5];
        let free = block[6];
        return new InlineParseBlock(title, location, blockLabel, mins, free, startTime, endTime);
    }

    private readonly startTime: ScheduleTime;
    private readonly endTime: ScheduleTime;

    constructor(title: string, location: string, blockLabel: string, mins: string, free: boolean, startTime: ScheduleTime, endTime: ScheduleTime) {
        super(title, location, blockLabel, mins, free);
        this.startTime = startTime;
        this.endTime = endTime;
    }

    generateBlockElement() {
        let tableRowElement = document.createElement('tr');
        tableRowElement.setAttribute('class', `mins${this.mins}`);
        let timeDataElement = document.createElement('td');
        timeDataElement.setAttribute('class', `times mins${this.mins}`);
        timeDataElement.appendChild(document.createTextNode(`${format12HourTime(this.startTime)}-${format12HourTime(this.endTime)}`));
        let blockElement = ParsedBlock.generateBlockElement(1, this.mins, this.bgcolor, this.title, this.subtitle, this.addLineBreak, true);
        tableRowElement.appendChild(timeDataElement);
        tableRowElement.appendChild(blockElement);
        return tableRowElement;
    }
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
