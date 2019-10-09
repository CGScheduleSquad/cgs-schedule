import { ScheduleRange } from './rendering/scheduleRange';
import ScheduleDate from './time/scheduleDate';
import { ScheduleRenderer } from './rendering/scheduleRenderer';
import { lateStartAllTimes, ScheduleDayType } from './structure/scheduleDay';
import ScheduleTime from './time/scheduleTime';
import ScheduleParamUtils from './utils/scheduleParamUtils';
import ScheduleCacheManager from './utils/scheduleCacheManager';

const getClassAsArray = (cl: string): Array<any> => Array.from(document.getElementsByClassName(cl));

const appendBlankSchedule = (text: string, bgcolor: string, link: string = ''): void => {
    let [td, a] = [document.createElement('td'), document.createElement(link === '' ? 'span' : 'a')];
    td.setAttribute('rowspan', '12');
    td.setAttribute('class', `period specialday ${bgcolor}`);
    a.setAttribute('class', 'coursename');
    if (link !== '') a.setAttribute('href', link);
    a.innerText = text;
    td.appendChild(a);
    // @ts-ignore
    document.querySelector('table.sched.main > tbody > tr:nth-child(2)').appendChild(td);
};

const format12HourTime = (date: ScheduleTime): string =>
    ((date.hours - 1) % 12) + 1 + ':' + (date.minutes < 10 ? '0' : '') + date.minutes;

// @ts-ignore
const openModal: any = (target: string) => document.getElementById(target).classList.add('is-active');

// @ts-ignore
const closeModal: any = (target: string) => document.getElementById(target).classList.remove('is-active');

const colorClasses = {
    0: 'blk-activity',
    1: 'blk-1',
    2: 'blk-2',
    3: 'blk-3',
    4: 'blk-4',
    5: 'blk-5',
    6: 'blk-6',
    7: 'blk-7',
    free: 'blk-free'
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
        let [td, a, b] = [document.createElement('td'), document.createElement('a'), document.createElement('b')];
        td.setAttribute('class', 'daylabel');
        a.setAttribute(
            'href',
            `https://portals.veracross.com/catlin/student/student/daily-schedule?date=${date.toString()}`
        );
        b.innerText = `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate() +
            (rawDay === undefined || !rawDay.dayMeta ? '' : ` (${rawDay.dayMeta})`)}`;
        a.appendChild(b);
        td.appendChild(a);
        // @ts-ignore
        document.querySelector('table.sched.main > tbody > tr:nth-child(1)').appendChild(td);

        if (rawDay === undefined) rawDay = { type: ScheduleDayType.TEXT };

        switch (rawDay.type) {
            case ScheduleDayType.TEXT:
                appendBlankSchedule('No Events', colorClasses.free);
                break;
            case ScheduleDayType.LATE_START:
                // @ts-ignore
                oneDay && getClassAsArray('times').forEach(el => el.parentNode.removeChild(el));
                LateStartScheduleRenderer.getInstance().appendSchedule(rawDay, schedule.compressionList);
                // @ts-ignore
                oneDay && getClassAsArray('times').forEach(el => (el.style.width = '39%')); // TODO: Remove this
                break;
            case ScheduleDayType.INLINE:
                // @ts-ignore
                oneDay && getClassAsArray('times').forEach(el => el.parentNode.removeChild(el));
                InlineScheduleRenderer.getInstance().appendSchedule(rawDay, schedule.compressionList);
                // @ts-ignore
                oneDay && getClassAsArray('times').forEach(el => (el.style.width = '39%')); // TODO: Remove this
                break;
            case ScheduleDayType.REGULAR:
                RegularScheduleRenderer.getInstance().appendSchedule(rawDay, schedule.compressionList);
                break;
        }
    });
    if (oneDay) {
        // @ts-ignore
        document.getElementsByClassName('mainlabel')[0].style.display = 'none';
        document.getElementsByClassName('daylabel')[0].setAttribute('colspan', '2');
    }
    // @ts-ignore
    document.getElementById('schedarea').style.display = 'block';

    ScheduleRenderer.updateLinks(calendarUUID, range);

    scheduleLinksGAPI().then(value => {
        let thing = JSON.parse(value);
        let linkObject = {};
        thing.forEach((thing: any) => {
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
    });
    // @ts-ignore
    document.getElementById('settings').addEventListener('click', () => openModal('settings-modal'));
    [
        document.getElementsByClassName('modal-background')[0],
        document.getElementById('cancel-settings'),
        document.getElementById('save-settings')
    ].forEach(
        (el: Element | null): any => el !== null && el.addEventListener('click', () => closeModal('settings-modal'))
    );
});

const scheduleLinksGAPI = (): Promise<string> =>
    new Promise((resolve, reject) => {
        let request = new XMLHttpRequest();
        request.open('GET', `https://cgs-schedule.herokuapp.com/`, true);
        request.onload = function() {
            if (this.status >= 200 && this.status < 400) {
                resolve(this.response);
            } else {
                reject();
            }
        };
        request.onerror = () => reject();
        request.send();
    });

class InlineScheduleRenderer {
    public static getInstance(): InlineScheduleRenderer {
        if (this.instance === undefined) this.instance = new InlineScheduleRenderer();
        return this.instance;
    }

    private static instance: InlineScheduleRenderer;

    private constructor() {}

    appendSchedule(rawDay: any, compressionList: Array<string>): void {
        let blocks: Array<Array<any>> = rawDay.blocks;
        let trElement = document.getElementById(`time-0`);
        if (trElement === null) throw new Error('Error rendering schedule: Time elements not found!');

        let tableData = document.createElement('td');
        tableData.setAttribute('rowspan', String(12));
        tableData.setAttribute('class', `period specialday`);
        let specialTable = document.createElement('table');
        specialTable.setAttribute('class', 'sched week special');
        let tbody = document.createElement('tbody');
        specialTable.appendChild(tbody);
        tableData.appendChild(specialTable);
        trElement.appendChild(tableData);

        blocks.forEach((block: Array<any>) => {
            let lateStartParseBlock = InlineParseBlock.parseRawBlock(block, compressionList);
            // @ts-ignore
            tbody.appendChild(lateStartParseBlock.generateBlockElement());
        });
    }
}

class LateStartScheduleRenderer {
    public static getInstance() {
        if (this.instance === undefined) this.instance = new LateStartScheduleRenderer();
        return this.instance;
    }

    private static instance: LateStartScheduleRenderer;

    private constructor() {}

    appendSchedule(rawDay: any, compressionList: Array<string>) {
        let blocks: Array<Array<any>> = rawDay.blocks;
        let trElement = document.getElementById(`time-0`);
        if (trElement === null) throw new Error('Error rendering schedule: Time elements not found!');

        let tableData = document.createElement('td');
        tableData.setAttribute('rowspan', String(12));
        tableData.setAttribute('class', `period specialday`);
        let specialTable = document.createElement('table');
        specialTable.setAttribute('class', 'sched week special');
        let tbody = document.createElement('tbody');
        specialTable.appendChild(tbody);
        tableData.appendChild(specialTable);
        trElement.appendChild(tableData);

        blocks.forEach((block: Array<any>) => {
            let lateStartParseBlock = LateStartParseBlock.parseRawBlock(block, compressionList);
            // @ts-ignore
            tbody.appendChild(lateStartParseBlock.generateBlockElement());
        });
    }
}

class RegularScheduleRenderer {
    public static getInstance(): RegularScheduleRenderer {
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

    appendSchedule(rawDay: any, compressionList: Array<string>): void {
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
        L: ['', true],
        X: [' Flex', false]
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

    private generateBlockSubtitle(location: string, blockLabel: string): void {
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

    private expandBlockLabel(blockLabel: string): string {
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

        let freeNames = ['Free', 'Late Start', 'Break', 'Lunch']; // TODO: get rid of this
        if (this.free || freeNames.some(name => name === this.title)) {
            this.bgcolor = colorClasses.free;
        } else if (this.shouldBeColored) {
            let blockNumMatchAttempt = blockLabel.match(/\d/);
            this.bgcolor =
                // @ts-ignore
                blockNumMatchAttempt !== null
                    ? colorClasses[parseInt(blockNumMatchAttempt[0].slice(-1))]
                    : colorClasses[0];
        } else {
            this.bgcolor = colorClasses[0];
        }
        return blockLabel;
    }

    protected static generateBlockElement(
        rowSpan: number,
        mins: string,
        bgcolor: string,
        title: string,
        subtitle: string,
        newLine: boolean,
        specialPeriod = false
    ): any {
        // What data type is tableData?
        let tableData = document.createElement('td');
        tableData.setAttribute('rowspan', String(rowSpan));
        tableData.setAttribute('class', `period mins${mins} ${specialPeriod ? 'specialperiod' : ''} ${bgcolor}`);
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
    public static parseRawBlock(block: any, compressionList: Array<string>): RegularParseBlock {
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

    constructor(
        title: string,
        location: string,
        blockLabel: string,
        mins: string,
        free: boolean,
        normalTimeIndex: number,
        rowSpan: number
    ) {
        super(title, location, blockLabel, mins, free);
        this.normalTimeIndex = normalTimeIndex;
        this.rowSpan = rowSpan;
    }

    generateBlockElement(): any {
        return ParsedBlock.generateBlockElement(
            this.rowSpan,
            this.mins,
            this.bgcolor,
            this.title,
            this.subtitle,
            this.addLineBreak
        );
    }
}

class LateStartParseBlock extends ParsedBlock {
    public static parseRawBlock(block: any, compressionList: Array<string>) {
        let title = compressionList[block[0]];
        let location = compressionList[block[1]];
        let blockLabel = block[2];
        let normalTimeIndex = block[3];
        let rowSpan = block[4];
        let mins = block[5];
        let free = block[6];

        return new LateStartParseBlock(title, location, blockLabel, mins, free, normalTimeIndex, rowSpan);
    }

    public readonly normalTimeIndex: number;
    private readonly rowSpan: number;

    constructor(
        title: string,
        location: string,
        blockLabel: string,
        mins: string,
        free: boolean,
        normalTimeIndex: number,
        rowSpan: number
    ) {
        super(title, location, blockLabel, mins, free);
        this.normalTimeIndex = normalTimeIndex;
        this.rowSpan = rowSpan;
    }

    generateBlockElement() {
        let tableRowElement = document.createElement('tr');
        tableRowElement.setAttribute('class', `mins${this.mins}`);
        let isLateStart = this.title === 'Late Start';
        let blockElement = ParsedBlock.generateBlockElement(
            1,
            this.mins,
            this.bgcolor,
            this.title,
            this.subtitle,
            this.addLineBreak
        );
        if (!isLateStart) {
            let timeDataElement = document.createElement('td');
            timeDataElement.setAttribute('class', `times mins${this.mins}`);
            timeDataElement.appendChild(
                document.createTextNode(
                    `${format12HourTime(lateStartAllTimes[this.normalTimeIndex])}-${format12HourTime(
                        lateStartAllTimes[this.normalTimeIndex + this.rowSpan]
                    )}`
                )
            );
            tableRowElement.appendChild(timeDataElement);
        } else {
            blockElement.setAttribute('colspan', '2');
        }
        tableRowElement.appendChild(blockElement);
        return tableRowElement;
    }
}

class InlineParseBlock extends ParsedBlock {
    public static parseRawBlock(block: any, compressionList: Array<string>): InlineParseBlock {
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

    constructor(
        title: string,
        location: string,
        blockLabel: string,
        mins: string,
        free: boolean,
        startTime: ScheduleTime,
        endTime: ScheduleTime
    ) {
        super(title, location, blockLabel, mins, free);
        this.startTime = startTime;
        this.endTime = endTime;
    }

    generateBlockElement(): any {
        let tableRowElement = document.createElement('tr');
        tableRowElement.setAttribute('class', `mins${this.mins}`);
        let timeDataElement = document.createElement('td');
        timeDataElement.setAttribute('class', `times mins${this.mins}`);
        timeDataElement.appendChild(
            document.createTextNode(`${format12HourTime(this.startTime)}-${format12HourTime(this.endTime)}`)
        );
        let blockElement = ParsedBlock.generateBlockElement(
            1,
            this.mins,
            this.bgcolor,
            this.title,
            this.subtitle,
            this.addLineBreak,
            true
        );
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
