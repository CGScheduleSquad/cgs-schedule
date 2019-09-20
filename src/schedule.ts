export class Time {
    private readonly _totalMinutes: number;

    constructor(hours: number, minutes: number) {
        this._totalMinutes = hours * 60 + minutes;
    }

    get totalMinutes(): number {
        return this._totalMinutes % 60;
    }

    get minutes(): number {
        return this._totalMinutes % 60;
    }

    get hours(): number {
        return (this._totalMinutes - this._totalMinutes % 60) / 60;
    }
}

class Block {
    startTime: Time;
    endTime: Time;
    title: string;
    subtitle: string;
    location: string;
    blockTitle: string;
}

abstract class Day {
    date: Date;
}

abstract class BlockDay extends Day {
    letter: string;
    blocks: Block[];
}

class RegularDay extends BlockDay {

}

class InlineDay extends BlockDay {
    lateStart: boolean;
}

class TextDay extends Day {
    title: string;
    url: string;
}

class Utilities {
    static getUrlParam(key: string) {
        return new URL(window.location.href).searchParams.get(key)
    }
}

enum ViewMode {
    Week,
    Day,
}

class ScheduleManager {
    static getCalendarUUID(): string {
        let calendarUUID = Utilities.getUrlParam("cal");
        if (calendarUUID == null) {
            alert("Invalid URL! Please check that you have followed the instructions correctly.");
            window.location.href = "./?"; // exits the page
            return "";
        }
        return calendarUUID;
    }

    static getSeedDate(): Date {
        const dateString = Utilities.getUrlParam("date");
        if (dateString !== null) {
            let splitDate = dateString.split("-");
            return new Date(parseInt(splitDate[0]), parseInt(splitDate[1]) - 1, parseInt(splitDate[2]));
        } else {
            return new Date();
        }
    }


    static getViewMode(): ViewMode {
        let newRange = Utilities.getUrlParam("range");
        switch (newRange) {
            case "week":
                return ViewMode.Week;
            case "day":
                return ViewMode.Day;
            default:
                return ViewMode.Week; // TODO: different default for thin screens (phones)
        }
    }
}

window.addEventListener('load', () => {
    let calendarUUID = ScheduleManager.getCalendarUUID();
    let seedDate = ScheduleManager.getSeedDate();
    let viewmode = ScheduleManager.getViewMode();
});
