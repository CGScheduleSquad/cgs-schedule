export default class GenericCacheManager {

    private static DEFAULT_VERSION_NUMBER = 2;
    private static DEFAULT_EXPIRE_SECONDS = 1000 * 60 * 60 * 7;

    public static getCacheResults(localStorageKey: string,
                                  url: string,
                                  expireTime: number = GenericCacheManager.DEFAULT_EXPIRE_SECONDS,
                                  versionNumber: number = GenericCacheManager.DEFAULT_VERSION_NUMBER): Promise<any> {
        if (localStorage === undefined) {
            console.log('Local storage is not supported! Loading ' + localStorageKey + '...');
            return GenericCacheManager.reloadGlobalSettings(localStorageKey, url).then(jsonString => JSON.parse(jsonString));
        }

        let globalSettingsString = localStorage.getItem(localStorageKey);
        if (globalSettingsString === null) {
            console.log('Global settings cache does not exist! Loading ' + localStorageKey + '...');
            return GenericCacheManager.reloadGlobalSettings(localStorageKey, url).then(jsonString => JSON.parse(jsonString));
        }

        let globalSettingsObject = JSON.parse(globalSettingsString);
        if (globalSettingsObject.versionNumber === undefined || globalSettingsObject.versionNumber !== versionNumber) {
            console.log('Global settings cache is invalid! Loading ' + localStorageKey + '...');
            return GenericCacheManager.reloadGlobalSettings(localStorageKey, url).then(jsonString => JSON.parse(jsonString));
        }

        if (globalSettingsObject.creationTime === undefined || new Date().getTime() - new Date(globalSettingsObject.creationTime).getTime() > expireTime) {
            console.log('Global settings cache is outdated! Loading ' + localStorageKey + ' in the background...');
            GenericCacheManager.reloadGlobalSettings(localStorageKey, url); // save in the background
        }

        console.log('Global settings loaded successfully from cache!');
        return Promise.resolve(globalSettingsObject);
    }

    private static reloadGlobalSettings(localStorageKey: string, url: string): Promise<string> {
        return GenericCacheManager.corsGetPromise(url).then((jsonString: any) => {
            localStorage.setItem(localStorageKey, jsonString);
            console.log(localStorageKey + ' reloaded and saved to localStorage!');
            return jsonString;
        });
    }

    private static corsGetPromise(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            let request = new XMLHttpRequest();
            request.open('GET', `https://cgs-schedule-cors.herokuapp.com/${url}`, true);
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
    }
}
