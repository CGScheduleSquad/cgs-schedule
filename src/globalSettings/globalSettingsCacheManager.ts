
export default class GlobalSettingsCacheManager {
    public static readonly LOCAL_STORAGE_KEY = 'globalSettings';
    private static CURRENT_VERSION_NUMBER: 1;

    static getGlobalSettings(): Promise<any> {
        if (localStorage === undefined) {
            // not supported
            console.log('Local storage is not supported! Loading global settings...');
            return this.reloadGlobalSettings().then(jsonString => JSON.parse(jsonString));
        }

        let scheduleString = localStorage.getItem(GlobalSettingsCacheManager.LOCAL_STORAGE_KEY);
        if (scheduleString === null) {
            console.log('Global settings cache does not exist! Loading global settings...');
            return this.reloadGlobalSettings().then(jsonString => JSON.parse(jsonString));
        }

        let scheduleObject = JSON.parse(scheduleString);
        if (scheduleObject.versionNumber !== GlobalSettingsCacheManager.CURRENT_VERSION_NUMBER) {
            console.log('Global settings cache is invalid! Loading global settings...');
            return this.reloadGlobalSettings().then(jsonString => JSON.parse(jsonString));
        }

        if (new Date().getTime() - scheduleObject.creationTime > 1000 * 60 * 60 * 24) {
            console.log('Global settings cache is outdated! Loading in the background...');
            this.reloadGlobalSettings(); // save in the background
        }

        console.log('Global settings loaded successfully from cache!');
        return Promise.resolve(scheduleObject);
    }

    private static reloadGlobalSettings(): Promise<string> {
        return new Promise((resolve, reject) => {
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
        }).then((jsonString: any) => {
            localStorage.setItem(GlobalSettingsCacheManager.LOCAL_STORAGE_KEY, jsonString);
            console.log('Global settings reloaded from Veracross and saved to localStorage!');
            return jsonString;
        });
    }
}
