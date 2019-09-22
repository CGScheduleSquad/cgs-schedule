export class ScheduleDate {
    static now(): ScheduleDate {
        return new ScheduleDate(new Date());
    }

    static fromString(dateString: string): ScheduleDate {
        let splitDate = dateString.split('-');
        return new ScheduleDate(
            new Date(
                parseInt(splitDate[0]),
                parseInt(splitDate[1]) - 1,
                parseInt(splitDate[2])
            )
        );
    }

    static fromDate(date: Date): ScheduleDate {
        return new ScheduleDate(date);
    }

    private readonly date: Date;

    private constructor(date: Date) {
        this.date = date;
    }

    copy(): ScheduleDate {
        return new ScheduleDate(new Date(this.date));
    }

    getDay() {
        return this.date.getDay();
    }

    getDate() {
        return this.date.getDate();
    }

    setDate(date: number) {
        this.date.setDate(date);
    }

    getFullYear() {
        return this.date.getFullYear();
    }

    getMonth() {
        return this.date.getMonth();
    }

    toString() {
        return [
            this.date.getFullYear(),
            this.date.getMonth() + 1,
            this.date.getDate()
        ].join('-');
    }

    toJSON() {
        return this.toString();
    }
}
