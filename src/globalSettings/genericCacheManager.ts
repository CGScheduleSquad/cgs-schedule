export default class GenericCacheManager {

    private static DEFAULT_VERSION_NUMBER = 2;
    private static DEFAULT_EXPIRE_SECONDS = 1000 * 60 * 60 * 2;

    public static getCacheResults(localStorageKey: string,
                                  url: string,
                                  expireTime: number = GenericCacheManager.DEFAULT_EXPIRE_SECONDS,
                                  versionNumber: number = GenericCacheManager.DEFAULT_VERSION_NUMBER): Promise<any> {
        if (localStorage === undefined) {
            console.warn('Local storage is not supported! Loading ' + localStorageKey + '...');
            return GenericCacheManager.reloadGenericCache(localStorageKey, url, versionNumber);
        }

        let globalSettingsString = localStorage.getItem(localStorageKey);
        if (globalSettingsString === null) {
            console.log(localStorageKey + ' cache does not exist! Loading ' + localStorageKey + '...');
            return GenericCacheManager.reloadGenericCache(localStorageKey, url, versionNumber);
        }

        let globalSettingsObject;
        try {
             globalSettingsObject = JSON.parse(globalSettingsString);
        } catch (e) {
            globalSettingsObject = undefined;
        }
        if (globalSettingsObject === undefined || globalSettingsObject.versionNumber === undefined || globalSettingsObject.versionNumber !== versionNumber) {
            console.log(localStorageKey + ' cache is invalid! Loading ' + localStorageKey + '...');
            return GenericCacheManager.reloadGenericCache(localStorageKey, url, versionNumber);
        }

        if (globalSettingsObject.creationTime === undefined || new Date().getTime() - new Date(globalSettingsObject.creationTime).getTime() > expireTime) {
            console.log(localStorageKey + ' cache is outdated! Loading ' + localStorageKey + ' in the background...');
            GenericCacheManager.reloadGenericCache(localStorageKey, url, versionNumber); // save in the background
        }

        console.log(localStorageKey + ' loaded successfully from cache!');
        return Promise.resolve(globalSettingsObject.content);
    }

    private static reloadGenericCache(localStorageKey: string, url: string, versionNumber: number): Promise<string> {
        return GenericCacheManager.corsGetPromise(url).then((cacheResultsString: any) => {
            let storageJson = {content: cacheResultsString, versionNumber: versionNumber, creationTime: new Date().getTime()};
            localStorage.setItem(localStorageKey, JSON.stringify(storageJson));
            console.log(localStorageKey + ' reloaded and saved to localStorage!');
            return cacheResultsString;
        });
    }

    private static corsGetPromise(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            let request = new XMLHttpRequest();
            request.open('GET', url, true);
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
