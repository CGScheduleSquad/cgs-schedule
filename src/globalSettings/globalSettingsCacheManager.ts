import ScheduleParamUtils from '../schedule/utils/scheduleParamUtils';

export default class GlobalSettingsCacheManager {
    public static readonly LOCAL_STORAGE_KEY = 'globalSettings';
    private static CURRENT_VERSION_NUMBER = 5;

    static getGlobalSettings(): Promise<any> {
        if (localStorage === undefined) {
            // not supported
            console.log('Local storage is not supported! Loading global settings...');
            return this.reloadGlobalSettings().then(jsonString => JSON.parse(jsonString));
        }

        let globalSettingsString = localStorage.getItem(GlobalSettingsCacheManager.LOCAL_STORAGE_KEY);
        if (globalSettingsString === null) {
            console.log('Global settings cache does not exist! Loading global settings...');
            return this.reloadGlobalSettings().then(jsonString => JSON.parse(jsonString));
        }

        let globalSettingsObject = JSON.parse(globalSettingsString);
        if (globalSettingsObject.versionNumber === undefined || globalSettingsObject.versionNumber !== GlobalSettingsCacheManager.CURRENT_VERSION_NUMBER) {
            console.log('Global settings cache is invalid! Loading global settings...');
            return this.reloadGlobalSettings().then(jsonString => JSON.parse(jsonString));
        }

        if (globalSettingsObject.creationTime === undefined || new Date().getTime() - new Date(globalSettingsObject.creationTime).getTime() > 1000 * 60 * 60 * 10) {
            console.log('Global settings cache is outdated! Loading in the background...');
            this.reloadGlobalSettings(); // save in the background
        }

        console.log('Global settings loaded successfully from cache!');
        return Promise.resolve(globalSettingsObject);
    }

    private static reloadGlobalSettings(): Promise<string> {
        return new Promise((resolve, reject) => {
            let request = new XMLHttpRequest();
            let calendarUUID = ScheduleParamUtils.getCalendarUUID();
            let substr = calendarUUID === null ? "00000" : calendarUUID.substr(0, 5);
            // @ts-ignore
            let id = md5(substr);
            request.open('GET', `https://cgs-schedule.herokuapp.com/gs/` + id + ';' + ScheduleParamUtils.getTheme(), true);
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
            console.log('Global settings reloaded and saved to localStorage!');
            return jsonString;
        });
    }
}
