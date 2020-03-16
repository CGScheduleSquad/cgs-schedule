import { CookieStorage } from 'cookie-storage';

export class CookieManager {

    private static storage: CookieStorage = new CookieStorage();

    private static trueValue: string = 'true';
    private static settingsAdDismissedKey: string = 'settings-ad-dismissed';
    private static aprilFoolsModalDismissedKey: string = 'april-fools-modal-dismissed';
    private static aprilFoolsAdDismissedKey: string = 'april-fools-ad-dismissed';

    public static isSettingsAdDismissed(): boolean {
        return this.storage.getItem(this.settingsAdDismissedKey) === this.trueValue;
    }

    public static dismissSettingsAd() {
        this.storage.setItem(this.settingsAdDismissedKey, this.trueValue);
    }

    static isAprilFoolsModalDismissed() {
        return this.storage.getItem(this.aprilFoolsModalDismissedKey) === this.trueValue;
    }

    public static dismissAprilFoolsModal() {
        this.storage.setItem(this.aprilFoolsModalDismissedKey, this.trueValue);
    }
    static isAprilFoolsAdDismissed() {
        let item = this.storage.getItem(this.aprilFoolsAdDismissedKey);
        if (item==null) item = "1";
        return parseInt(item) <= 0;
    }

    public static dismissAprilFoolsAd() {
        this.storage.setItem(this.aprilFoolsAdDismissedKey, "0");
    }

    public static decrementAprilFoolsAd() {
        let item = this.storage.getItem(this.aprilFoolsAdDismissedKey);
        if (item==null) item = "NaN";
        this.storage.setItem(this.aprilFoolsAdDismissedKey, (isNaN(parseInt(item))?5:parseInt(item))-1+"");
    }
}
