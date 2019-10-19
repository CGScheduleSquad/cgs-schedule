import { CookieStorage } from 'cookie-storage';

export class CookieManager {

    private static storage: CookieStorage = new CookieStorage();

    private static trueValue: string = 'true';
    private static settingsAdDismissedKey: string = 'settings-ad-dismissed';

    public static isSettingsAdDismissed(): boolean {
        return this.storage.getItem(this.settingsAdDismissedKey) === this.trueValue;
    }

    public static dismissSettingsAd() {
        this.storage.setItem(this.settingsAdDismissedKey, this.trueValue);
    }

}