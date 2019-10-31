export default class ScheduleDate {
    static now = (): ScheduleDate => new ScheduleDate(new Date());

    static fromString(dateString: string): ScheduleDate {
        let splitDate = dateString.split('-');
        return new ScheduleDate(new Date(parseInt(splitDate[0]), parseInt(splitDate[1]) - 1, parseInt(splitDate[2])));
    }

    static fromDate = (date: Date): ScheduleDate => new ScheduleDate(date);

    private readonly date: Date;

    private constructor(date: Date) {
        this.date = date;
    }

    copy = (): ScheduleDate => new ScheduleDate(new Date(this.date));

    getDay = (): number => this.date.getDay();

    getDate = (): number => this.date.getDate();

    setDate = (date: number) => {
        this.date.setDate(date);
        return this;
    };

    getFullYear = (): number => this.date.getFullYear();

    setFullYear = (year: number) => {
        this.date.setFullYear(year);
        return this;
    };

    getMonth = (): number => this.date.getMonth();

    toString = (): string => [this.date.getFullYear(), this.date.getMonth() + 1, this.date.getDate()].join('-');

    toHRString = (): string => {
        let days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${days[this.getDay()]} ${months[this.getMonth()]} ${this.getDate()}`;
    };

    toHRStringLong = (): string => {
        let days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `${days[this.getDay()]}, ${months[this.getMonth()]} ${this.getDate()}`;
    };

    toJSON = (): string => this.toString();
}
