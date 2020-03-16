import ScheduleParamUtils from './schedule/utils/scheduleParamUtils';
import ScheduleCacheManager from './schedule/utils/scheduleCacheManager';
import WindowUtils from './utils/windowUtils';
import GlobalSettingsCacheManager from './globalSettings/globalSettingsCacheManager';
import { loadAllSettings } from './schedule/settingsManager';
import { toast } from 'bulma-toast';
import ScheduleRenderer from './schedule/rendering/scheduleRenderer';
import { CookieManager } from './cookieManager';

// start loading schedule before dom content has loaded, but only draw when the dom has loaded and the schedule has also
let scheduleAndDomLoaded = new Promise<string>((resolve) => resolve(ScheduleParamUtils.getCalendarUUID()))
    .then((calendarUUID: string) => Promise.all([
        ScheduleCacheManager.getSchedule(calendarUUID),
        WindowUtils.waitForScheduleEvent('DOMContentLoaded')
    ]))
    .then((schedule: any) => schedule[0])
    .catch((reason: any) => {
        console.error(reason);
        alert(reason);
        window.location.href = './index.html'; // exits the page
    });

let scheduleRendered = scheduleAndDomLoaded.then((schedule: any) => {
    ScheduleRenderer.render(schedule);
    return schedule;
});

scheduleRendered.then((schedule: any) => {
    if (new URL(window.location.href).hash === '#new') {
        toast({
            message: 'Schedule generated. Please bookmark the link and/or text it to your phone.',
            type: 'is-info',
            duration: 8000,
            position: 'top-center',
            dismissible: true,
            pauseOnHover: true,
            animate: { in: 'fadeInDown', out: 'fadeOutUp' }
        });

        window.location.hash = '';
    }
    return schedule;
});

let scheduleAndGlobalSettingsLoaded = Promise.all([
    GlobalSettingsCacheManager.getGlobalSettings(),
    scheduleRendered
]);

scheduleAndGlobalSettingsLoaded.then((globalSettingsAndSchedule => {
    loadAllSettings(globalSettingsAndSchedule[0], globalSettingsAndSchedule[1]);
    if (CookieManager.isSettingsAdDismissed() || ScheduleParamUtils.areSettingsSet()) {
        let settingsAd = document.getElementById('settings-ad');
        if (settingsAd !== null) settingsAd.classList.add('hidden');
    }

    let hasSenseOfHumor = ScheduleParamUtils.getSchoolDivision() == 'us' && (!/FOP/.test(localStorage.scheduleEvents) || /Comp Sci II/.test(localStorage.scheduleEvents)) && !ScheduleParamUtils.isMobile();
    let isAprilFoolsWeek = new Date('2020-3-29') < new Date() && new Date('2020-4-3') > new Date();
    if (hasSenseOfHumor && isAprilFoolsWeek) {
        if (!CookieManager.isAprilFoolsModalDismissed()) {
            // @ts-ignore
            document.getElementById('aprilFoolsModal').classList.add('is-active');
            const hideAfModal = (price: string) => {
                if (price !== undefined) {
                    alert('The recurring amount of $' + price + ' has been charged to your barn account.\nThank you for your purchase!');
                    setTimeout(() => {
                        alert('just kidding, april fools!');
                    }, 5000);
                } else {
                    if (!confirm(`Are you sure you don't want to remove ads by purchasing a premium cgs-schedule subscription?`)) {
                        return;
                    }
                }
                // @ts-ignore
                document.getElementById('aprilFoolsModal').classList.remove('is-active');
                CookieManager.dismissAprilFoolsModal();
            };
            // @ts-ignore
            document.getElementById('af-free').addEventListener('click', () => hideAfModal());
            // @ts-ignore
            document.getElementById('af-basic').addEventListener('click', () => hideAfModal('2.99'));
            // @ts-ignore
            document.getElementById('af-standard').addEventListener('click', () => hideAfModal('5.99'));
            // @ts-ignore
            document.getElementById('af-enterprise').addEventListener('click', () => hideAfModal('12.99'));
        }
        if (!CookieManager.isAprilFoolsAdDismissed()) {
            if (CookieManager.isAprilFoolsModalDismissed()) {
                CookieManager.decrementAprilFoolsAd();
            }
            Array.from(document.getElementsByClassName('april-fools')).forEach(ad => {
                ad.setAttribute('style', ad.getAttribute('style') + ';display:block');
                let listener = () => {
                    CookieManager.dismissAprilFoolsAd();
                    return window.location.href = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
                };
                ad.addEventListener('click', listener);
                let myTimeout: any;
                ad.addEventListener('mouseover', () => {
                    myTimeout = setTimeout(listener, 2000);
                });
                ad.addEventListener('mouseleave', () => {
                    clearTimeout(myTimeout);
                });
            });
        }
    }
}));


