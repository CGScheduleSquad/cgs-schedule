
export default class WindowUtils {

    static waitForScheduleEvent(listenerName: string) {
        return new Promise(resolve => {
            window.addEventListener(listenerName, () => {
                resolve();
            });
        });
    }
}