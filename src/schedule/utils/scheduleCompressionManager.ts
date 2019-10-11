export default class ScheduleCompressionManager { // TODO: Should not be static
    static compressionList: Array<string>;

    static processCompressString(inString: string): number {
        let index = this.compressionList.indexOf(inString);
        if (index !== -1) {
            return index;
        } else {
            this.compressionList.push(inString);
            return this.compressionList.length - 1;
        }
    }

    static resetCompressionList() {
        this.compressionList = new Array<string>();
    }
}
