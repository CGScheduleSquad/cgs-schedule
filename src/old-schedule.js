const inMatrix = (query, matrix) => {
    let res = -1;
    matrix.forEach((el, i) => {
        if (el.includes(query)) res = i;
    });
    return res;
};

const getDescription = matrix => {
    let i = inMatrix('description', matrix);
    let description = [];
    if (i > -1) {
        let raw = matrix[i][3];
        description = raw.split('; ').map(b => {
            let kv = b.split(': ');
            if (kv.length > 2) {
                for (let i = 2; i < kv.length; i++) kv[1] += `: ${kv[i]}`;
            }
            return {[kv[0]]: kv[1]};
        });
    }
    return description;
};

const getDT = (time, matrix) => {
    let i = inMatrix(`dt${time}`, matrix);
    return i > -1 ? new Date(matrix[i][3]) : [];
};

const getLocation = matrix => {
    let i = inMatrix('location', matrix);
    return i > -1 ? matrix[i][3] : 'N/A';
};

const getSummary = matrix => {
    let i = inMatrix('summary', matrix);
    return i > -1 ? matrix[i][3].split(' - ') : ['N/A', 'N/A', 'N/A'];
};

window.addEventListener('load', () => {
    // try {
    if (new URL(window.location.href).searchParams.get("cal") !== null) {
        loadSchedule();
    } else {
        alert("Invalid URL! Please check that you have followed the instructions correctly.");
        window.location.href = "./?"
    }
});

// TODO: Get rid of html snippets

const colorDict = {
    0: '#C0C0C0',
    1: '#FFCE51',
    2: '#A67FB9',
    3: '#E67326',
    4: '#00ABBD',
    5: '#AAC02C',
    6: '#EF4957',
    7: '#FF75F2',
    'free': 'white'
};

const normalTimes = [
    new Date(0, 0, 0, 8, 0),
    new Date(0, 0, 0, 8, 45),
    new Date(0, 0, 0, 9, 20),
    new Date(0, 0, 0, 9, 30),
    new Date(0, 0, 0, 9, 45),
    new Date(0, 0, 0, 10, 35),
    new Date(0, 0, 0, 11, 20),
    new Date(0, 0, 0, 11, 55),
    new Date(0, 0, 0, 12, 30),
    new Date(0, 0, 0, 13, 10),
    new Date(0, 0, 0, 13, 40),
    new Date(0, 0, 0, 14, 30)
];

let userName = '';
let schoolEndTime = new Date(0, 0, 0, 15, 15);
let normalAllTimes = normalTimes.concat([schoolEndTime]);

function doTheStuffWithTheEvents(allEvents, thisMonday, numDays) {
    let weekDates = getDatesForWeek(new Date(thisMonday), numDays);
    let dayBlocks = [];
    weekDates.forEach(date => dayBlocks.push({date, blocks: []}));
    allEvents.forEach(a => {
        let dtstart = getDT('start', a[1]);
        let index = weekDates.findIndex(date => {
            return compareDates(dtstart, date);
        });
        if (index !== -1) {
            let description = getDescription(a[1]);
            let dtstart = getDT('start', a[1]);
            let dtend = getDT('end', a[1]);
            let location = getLocation(a[1]);
            let summary = getSummary(a[1]);


            let room = description[2].Room;
            let replacements = {
                "Math: ": "",
                "Science Lab ": "",
                "Library": "Lib",
            };
            Object.entries(replacements).forEach(entry => {
                room = room.replace(entry[0], entry[1]);
            });

            let letter = description[1].Day.match(/US Day [A-Z]/);
            let block = {
                letter: letter !== null ? letter[0].charAt(letter[0].length - 1) : "",
                date: dtstart,
                startTime: new Date(0, 0, 0, dtstart.getHours(), dtstart.getMinutes()),
                endTime: new Date(0, 0, 0, dtend.getHours(), dtend.getMinutes()),
                title: summary.join(" - "),
                subtitle: !description[0].hasOwnProperty("Block") ? "" : `Teacher • US ${description[0].Block.charAt(0) + (description[0].Block.charAt(1) === "L" ? " Long" : "") + (description[0].Block.charAt(1) === "X" ? " Flex" : "")} • ${room}`,
                rowSpan: 1
            };
            if (block.title.match(/Morning Choir/) !== null) return; // TODO: Remove custom rules
            dayBlocks[index].blocks.push(block);
        }
    });

    $.getJSON('blocks.json', function (data) {

        weekDates.forEach((date, index) => {
            let unparsedDay = data[dateToVeracrossDate(date)];
            if (unparsedDay !== undefined) {
                unparsedDay.forEach(block => {
                    dayBlocks[index].blocks.push({
                        letter: "",
                        date: date,
                        startTime: parseVeracrossTime(block.startTime),
                        title: block.title,
                        subtitle: "",
                        rowSpan: 1,
                    })
                });
            }
        });
        //data is the JSON string

        dayBlocks.forEach(day => {
            day.blocks.forEach(block => {

                if (["Lunch", "Break"].some(text => text === block.title)) { // TODO: hmm
                    block.free = true;
                }

                if (block.startTime.getHours() === 11 && block.startTime.getMinutes() === 25) { // TODO: bruhh
                    block.startTime.setMinutes(20);
                }
            });
            day.blocks.sort(function (b, a) {
                a = new Date(a.startTime);
                b = new Date(b.startTime);
                return a > b ? -1 : a < b ? 1 : 0;
            });
        });

        $(".times").hide();
        dayBlocks.map(httpRequestScheduleForDate).forEach(appendDay);
        if (numDays === 1) {
            $(".mainlabel").hide();
            $(".daylabel").first().attr('colspan', 2);
        } else {
            $(".times").show();
        }
        $('.mainlabel b').text(userName);
        $('#schedule').show();
    });
}

const currentCacheVersion = 3;

function loadSchedule() {
    let calParameterValue = new URL(window.location.href).searchParams.get("cal");

    // get the date from the search parameters, if there isn't a date, use the current date
    const date = new URL(window.location.href).searchParams.get("date");
    let seedDate = new Date();
    if (date !== null) {
        let splitDate = date.split("-");
        seedDate = new Date(parseInt(splitDate[0]), parseInt(splitDate[1]) - 1, parseInt(splitDate[2]));
    }

    let newRange = new URL(window.location.href).searchParams.get("range");
    if (newRange === null) newRange = "week"; // TODO: different default for thin screens (phones)
    const isWeekView = newRange !== "day";

    // TS is up to here

    $("#schedarea .sched").addClass(isWeekView ? "week" : "today");

    let startDate;
    let nextDate;
    let previousDate;
    let numDays;

    // get the the monday previous to the seed date
    const thisMonday = getLastFriday(seedDate);
    thisMonday.setDate(thisMonday.getDate() + 3);
    if (isWeekView) {
        startDate = thisMonday;

        // get the previous and next monday for the arrows TODO: Dont modify the dates inside getDatesForWeek so this order doesn't matter
        const previousMonday = new Date(thisMonday);
        const nextMonday = new Date(thisMonday);
        previousMonday.setDate(thisMonday.getDate() - 7);
        nextMonday.setDate(thisMonday.getDate() + 7);
        nextDate = nextMonday;
        previousDate = previousMonday;
        numDays = 5;
    } else {
        let isWeekend = date => date.getDay() === 0 || date.getDay() === 6;
        startDate = isWeekend(seedDate) ? thisMonday : seedDate;

        nextDate = new Date(startDate);
        previousDate = new Date(startDate);
        nextDate.setDate(startDate.getDate() + 1);
        if (isWeekend(nextDate)) nextDate.setDate(startDate.getDate() + 3);
        previousDate.setDate(startDate.getDate() - 1);
        if (isWeekend(previousDate)) previousDate.setDate(startDate.getDate() - 3);
        numDays = 1;
    }

    if (typeof (Storage) !== "undefined") {
        // temporary disable cache:
        // localStorage.removeItem("scheduleEvents");

        // Code for localStorage/sessionStorage.
        let storageObject = JSON.parse(localStorage.getItem("scheduleEvents"));
        if (storageObject !== null && currentCacheVersion === storageObject.version && storageObject.uuid === calParameterValue) {
            if (new Date().getTime() - storageObject.lastSaved < 1000 * 60 * 60 * 24) { // only timed out
                console.log("Loaded, ms since saved: " + (new Date().getTime() - storageObject.lastSaved));
                doTheStuffWithTheEvents(storageObject.allEvents, startDate, numDays)
            } else {
                console.log("Loaded but outdated, ms since saved: " + (new Date().getTime() - storageObject.lastSaved));
                doTheStuffWithTheEvents(storageObject.allEvents, startDate, numDays);
                getEvents(startDate, true, numDays, true)
            }
        } else {
            console.log("Invalid cache, loading schedule");
            getEvents(startDate, true, numDays)
        }
    } else {
        // Sorry! No Web Storage support..
        console.log("No web storage support, loading schedule");
        getEvents(startDate, false, numDays)
    }


    // left/right arrows
    let navigationArrows = $('td.arrows a');
    navigationArrows.first().prop('href', '?date=' + dateToVeracrossDate(previousDate) + "&range=" + newRange + "&cal=" + calParameterValue);
    navigationArrows.last().prop('href', '?date=' + dateToVeracrossDate(nextDate) + "&range=" + newRange + "&cal=" + calParameterValue);

    // this week
    $('#today a').prop('href', "?range=day" + "&cal=" + calParameterValue);
    $('#this-week a').prop('href', "?range=week" + "&cal=" + calParameterValue);

    // return to portal link
    $('td.controls.links a').last().prop('href', 'https://portals.veracross.com/catlin/student/student/daily-schedule?date=' + dateToVeracrossDate(seedDate));
}

function getEvents(thisMonday, saveIntoStorage, numDays, background = false) {

    if (!background) $("#loading").show();
    let calUUID = new URL(window.location.href).searchParams.get("cal");
    const classUrl = "http://api.veracross.com/catlin/subscribe/" + calUUID + ".ics";
    Promise.all([corsGetPromise(classUrl)]).then(rawCals => { // temporary disable  // TODO: Do blocks need to be sorted? if so, sort them!!!
        // Promise.all([corsGetPromise(classUrl), corsGetPromise(calUrl)]).then(rawCals => {
        let allEvents = rawCals.map(rawCal => {
            let ical = ICAL.parse(rawCal);
            let events = ical[2];
            return events.filter(a => a[1].length === 8);
        }).flat();

        if (saveIntoStorage) {
            console.log("Saving into storage");
            localStorage.setItem("scheduleEvents", JSON.stringify({
                version: currentCacheVersion,
                uuid: calUUID,
                lastSaved: new Date().getTime(),
                allEvents
            }))
        }
        if (!background) {
            $("#loading").hide();
            doTheStuffWithTheEvents(allEvents, thisMonday, numDays)
        } else {
            console.log("finished loading in the background")
        }
    }).catch(any => {
        if (!background) {
            alert("The request to load your calendar failed! Please check that you pasted the correct URL.");
            window.location.href = "./?"
        }
        console.log("could not get ics file!")
    });
}

function corsGetPromise(url) {
    return new Promise((resolve, reject) => {
        $.get("https://cors-anywhere.herokuapp.com/" + url, function (raw) {
            resolve(raw)
        }).fail(function () {
            reject();
        });
    })
}

function getDatesForWeek(mondayDate, numDays) { // [2019-9-16, 2019-9-17, etc...]
    let dates = [];
    for (let i = 0; i < numDays; i++) {
        dates.push(new Date(mondayDate));
        mondayDate.setDate(mondayDate.getDate() + 1);
    }
    return dates;
}

function httpRequestScheduleForDate(day) { // http request to veracross for the schedule blocks
    let letter = day.blocks.length !== 0 && day.blocks[0].letter !== undefined ? day.blocks[0].letter : "";
    // if (userName === '') { // if the username hasn't been set, get the username
    //     userName = data.match(/full_name: "[A-z ]+(?=",)/)[0].split('"')[1];
    // }
    return {date: day.date, letter, blocks: day.blocks};
}

showRegularTimes = false;

function appendDay(daySchedule) {
    let days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // append the header with a link to the veracross page
    $('table.sched.main > tbody > tr:nth-child(1)').append(`
    <td class="daylabel">
      <a href="https://portals.veracross.com/catlin/student/student/daily-schedule?date=${dateToVeracrossDate(daySchedule.date)}">
        <b>
          ${days[daySchedule.date.getDay()]} ${months[daySchedule.date.getMonth()]} ${daySchedule.date.getDate() + (!daySchedule.letter ? '' : ` (${daySchedule.letter})`)}
        </b>
      </a>
    </td>
    `);
    if (isEmptyDay(daySchedule)) { // append the day blocks
        appendBlankSchedule('No Events', colorDict.free);
    } else if (isNormalDay(daySchedule)) {
        appendRegularSchedule(applyCustomBlockRules(filterBlocks(daySchedule)));
        if (!showRegularTimes) {
            $(".mainlabel, .times").show();
        }
    } else {
        appendInlineSchedule(applyCustomBlockRules(filterBlocks(daySchedule)));
    }
}

function filterBlocks(daySchedule) { // removes blocks not between 12 and 3 and duplicates
    daySchedule.blocks = daySchedule.blocks.filter(block => {
        let startHours = block.startTime.getHours();
        if (isNaN(startHours) || startHours < 8 || startHours >= 12 + 3) return false;
        return !daySchedule.blocks.some((otherBlock) => { // keep longer description one (TODO: show conflict)
            let sameTime = block.startTime.getTime() === otherBlock.startTime.getTime();
            return sameTime && (block.title.length < otherBlock.title.length || block.subtitle.length < otherBlock.subtitle.length);
        });
    });
    return daySchedule;
}

//<editor-fold desc="Schedule appenders">
function appendBlankSchedule(text, bgcolor, link = '') {
    return $('table.sched.main > tbody > tr:nth-child(2)').append(`<td rowspan="12" class="specialday" style="background: ${bgcolor};"><a ${(link === '' ? '' : `href=${link}`)} class="coursename">${text}</a></td>`);
}

function appendRegularSchedule(daySchedule) {
    daySchedule = prepRegularSchedule(daySchedule);
    daySchedule.blocks.forEach(block => {
        let normalTimeIndex = 1;
        normalTimes.some(time => {
            normalTimeIndex++;
            return block.startTime.getHours() === time.getHours() && block.startTime.getMinutes() === time.getMinutes();
        });
        let smallBlock = block.title === block.subtitle || block.subtitle === '' || block.title === 'US C&C';
        let blockNumMatchAttempt = block.subtitle.match(/US \d(?! Flex)/);
        let bgcolor = blockNumMatchAttempt !== null ? colorDict[parseInt(blockNumMatchAttempt[0].slice(-1))] : block.free || block.subtitle.match(/Break/) != null || block.subtitle.match(/Lunch/) != null ? colorDict.free : colorDict[0];
        if (!block.free) {
            block.title = block.title.split(' - ')[0];
            block.subtitle = block.subtitle.split(' • ').slice(-2).reverse().join(' - ').replace('US ', 'Blk ').replace(' Long', '');
        }
        $(`table.sched.main > tbody > tr:nth-child(${normalTimeIndex})`).append(`<td rowspan="${block.rowSpan}" class="period mins${block.mins}" style="background: ${bgcolor};"><span class="coursename">${block.title}</span>${(smallBlock ? '' : '<br>')}<span class="subtitle">${(smallBlock ? '' : block.subtitle)}</span><br></td>`);
    });
}

function compareDates(first, second) {
    return first.getFullYear() === second.getFullYear() &&
        first.getMonth() === second.getMonth() &&
        first.getDate() === second.getDate();
}

function compareTimes(first, second) {
    return first.getHours() === second.getHours() &&
        first.getMinutes() === second.getMinutes();
}


function prepRegularSchedule(daySchedule) {
    let newBlocks = [];
    normalTimes.forEach(time => { // for each normal start time, push null to newBlocks if no blocks begin at the start time and push the block into newBlocks if it begins at the start time
        let blockWithTime = daySchedule.blocks.find(block => compareTimes(block.startTime, time));
        newBlocks.push(blockWithTime === undefined ? null : blockWithTime);
    });

    for (let i = 0; i < newBlocks.length; i++) { // Replace empty blocks with free blocks and extend long blocks into the next period
        if (newBlocks[i] === null) {
            let title = 'Free';
            switch (i) {
                // case 3:
                //     title = 'Break';
                //     break;
                case 6:
                    title = 'Free<span class="subtitle"> - AM Flex</span>';
                    break;
                case 7:
                    title = 'Co-Curric';
                    break;
                // case 8:
                //     title = 'Lunch';
                //     break;
                case 9:
                    title = 'Free<span class="subtitle"> - PM Flex</span>';
                    break;
            }
            newBlocks[i] = {'startTime': normalTimes[i], 'title': title, 'subtitle': '', 'rowSpan': 1, 'free': true};
        }
        if (i < newBlocks.length - 1 && (newBlocks[i].subtitle.match(/Long /) != null || newBlocks[i].title === 'Free' || newBlocks[i].title === 'Assembly') && newBlocks[i + 1] == null) {
            newBlocks[i].rowSpan++;
            newBlocks[i + 1] = 'remove';
            i++;
        }
    }
    newBlocks = newBlocks.filter(block => block !== 'remove');

    let timeIndex = 0;
    newBlocks.forEach(block => { // calculate the duration of the block from the number of rows (time blocks) it spans
        block.mins = Math.min(Math.max(new Date(normalAllTimes[timeIndex + block.rowSpan].getTime() - normalAllTimes[timeIndex].getTime()).getTime() / 1000 / 60, 5), 90);
        timeIndex = timeIndex + block.rowSpan;
    });

    daySchedule.blocks = newBlocks;
    return daySchedule;
}

function appendInlineSchedule(daySchedule) {
    $('table.sched.main > tbody > tr:nth-child(2)').append(`<td rowspan="12" class="specialday" style="border-top-style: solid; border-right-style: solid; border-bottom: 0px; border-left-style: solid;"><table class="sched week special"><tbody>`);

    if (daySchedule.blocks[0].startTime.getTime() !== normalTimes[0].getTime()) {
        daySchedule.blocks.unshift({
            'startTime': normalTimes[0],
            'endTime': daySchedule.blocks[0].startTime,
            'title': 'Free',
            'subtitle': '',
            'rowSpan': 1,
            'lateStart': true
        });
    }
    daySchedule.blocks.forEach((block, index) => {
        if (block.endTime === undefined) {
            block.endTime = index === daySchedule.blocks.length - 1 ? schoolEndTime : daySchedule.blocks[index + 1].startTime;
        }
    });

    let newBlocks = [];
    daySchedule.blocks.forEach((block, index) => {
        newBlocks.push(block);
        let nextTime = index === daySchedule.blocks.length - 1 ? schoolEndTime : daySchedule.blocks[index + 1].startTime;
        if (nextTime.getTime() - block.endTime.getTime() > 1000 * 60 * 10) {
            newBlocks.push({
                'startTime': block.endTime,
                'endTime': nextTime,
                'title': 'Free',
                'subtitle': '',
                'rowSpan': 1,
                'free': true
            });
        }
    });
    daySchedule.blocks = newBlocks;

    daySchedule.blocks.forEach((block) => {
        block.mins = Math.min(Math.max(new Date(block.endTime.getTime() - block.startTime.getTime()).getTime() / 1000 / 60, 5), 90);
    });

    daySchedule.blocks.forEach(block => {
        let minsClass = `mins${block.mins}`;

        if (block.lateStart) {
            $('.special tbody').last().append(`<tr class="${minsClass}"><td colspan="2" class="period ${minsClass} specialperiod" style="background: ${colorDict.free};"><span class="coursename">${block.title}</span><br></td></tr>`);
            return;
        }

        let timeRange = `${format12HourTime(block.startTime)}-${format12HourTime(block.endTime)}`;

        // start duplicate
        let smallBlock = block.title === block.subtitle || block.subtitle === '' || block.title === 'US C&C';
        let blockNumMatchAttempt = block.subtitle.match(/US \d(?! Flex)/);
        let bgcolor = blockNumMatchAttempt !== null ? colorDict[parseInt(blockNumMatchAttempt[0].slice(-1))] : block.free || block.subtitle.match(/Break/) != null || block.subtitle.match(/Lunch/) != null ? colorDict.free : colorDict[0];
        if (!block.free) {
            block.title = block.title.split(' - ')[0];
            block.subtitle = block.subtitle.split(' • ').slice(-2).reverse().join(' - ').replace('US ', 'Blk ').replace(' Long', '');
        }
        // end duplicate

        $('.special tbody').last().append(`<tr class="${minsClass}"><td class="times ${minsClass}">${timeRange}</td><td rowspan="1" class="period ${minsClass} specialperiod" style="background: ${bgcolor};"><span class="coursename">${block.title}</span>${(smallBlock ? '' : '<br>')}<span class="subtitle">${(smallBlock ? '' : block.subtitle)}</span><br></td></tr>`);
    });
}

//</editor-fold>

//<editor-fold desc="Custom rules">
const roboticsManagers = ['Tristan Peng', 'Liam Wang', 'Dylan Smith', 'Avery Pritchard', 'Kristin Cohrs', 'Zachary Robinson', 'Tiffany Toh', 'Eric Wang', 'Mick Leungpathomaram', 'Annika Holliday', 'Audrey Daniels', 'Jeffrey Burt']; // TODO: temporary
function applyCustomBlockRules(daySchedule) {
    if (roboticsManagers.includes(userName)) {
        daySchedule.blocks.forEach(block => {
            if (block.title === 'Co-Curric' && daySchedule.letter === 'B') {
                block.title = 'Robotics Meeting';
                block.subtitle = 'Gerlinger';
                block.free = false;
            } else if (block.title === 'Co-Curric' && daySchedule.letter === 'F') {
                block.title = 'Robotics Manager\'s Meeting';
                block.subtitle = 'Lib 4';
                block.free = false;
            }
        });
    }
    return daySchedule;
}

//</editor-fold>

//<editor-fold desc="Schedule conditions">
function isNormalDay(daySchedule) {
    return daySchedule.blocks.every(block => {
        let startHours = block.startTime.getHours();
        let startMinutes = block.startTime.getMinutes();
        if (isNaN(startHours) || startHours < 8 || startHours >= 12 + 3) return true;
        return normalTimes.some(time => startHours === time.getHours() && startMinutes === time.getMinutes());
    });
}

function isEmptyDay(daySchedule) {
    return daySchedule.blocks.length === 0;
}

//</editor-fold>

//<editor-fold desc="Static date utilities">
function parseVeracrossTime(timeString) {
    let isPm = false;
    if (timeString.includes('am')) {
        timeString = timeString.replace(' am', '');
    }
    if (timeString.includes('pm')) {
        timeString = timeString.replace(' pm', '');
        isPm = true;
    }
    let splitString = timeString.split(':');
    return new Date(0, 0, 0, parseInt(splitString[0]) + (isPm && parseInt(splitString[0]) !== 12 ? 12 : 0), parseInt(splitString[1]));
}

function dateToVeracrossDate(date) {
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
}

function format12HourTime(date) {
    return ((date.getHours() - 1) % 12 + 1) + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
}

function getLastFriday(date) {
    let d = new Date(date);
    let day = d.getDay();
    let diff = (day <= 5) ? (7 - 5 + day) : (day - 5);

    d.setDate(d.getDate() - diff);
    d.setHours(0);
    d.setMinutes(0);
    d.setSeconds(0);

    return d;
}

//</editor-fold>
