// TOUCH-EVENTS SINGLE-FINGER SWIPE-SENSING JAVASCRIPT
// Courtesy of PADILICIOUS.COM and MACOSXAUTOMATION.COM

// this script can be used with one or more page elements to perform actions based on them being swiped with a single finger

let triggerElementID = null; // this variable is used to identity the triggering element
let fingerCount = 0;
let startX = 0;
let startY = 0;
let curX = 0;
let curY = 0;
let deltaX = 0;
let deltaY = 0;
let horzDiff = 0;
let vertDiff = 0;
const minLength = 72; // the shortest distance the user may swipe
let swipeLength = 0;
let swipeAngle = null;
let swipeDirection = null;

window.touchStart = (event, passedName) => {
    // disable the standard ability to select the touched object
    // event.preventDefault();
    // get the total number of fingers touching the screen
    fingerCount = event.touches.length;
    // since we're looking for a swipe (single finger) and not a gesture (multiple fingers),
    // check that only one finger was used
    if (fingerCount === 1) {
        // get the coordinates of the touch
        startX = event.touches[0].pageX;
        startY = event.touches[0].pageY;
        // store the triggering element ID
        triggerElementID = passedName;
    } else {
        // more than one finger touched so cancel
        touchCancel(event);
    }
};

window.touchMove = event => {
    if ($(document).height() <= $(window).height()+30) { // if there is no scrollbar, prevent touch scrolling
        event.preventDefault();
    }
    if (event.touches.length === 1) {
        curX = event.touches[0].pageX;
        curY = event.touches[0].pageY;
    } else {
        touchCancel(event);
    }
};

window.touchEnd = event => {
    // event.preventDefault();
    // check to see if more than one finger was used and that there is an ending coordinate
    if (fingerCount === 1 && curX !== 0) {
        // use the Distance Formula to determine the length of the swipe
        swipeLength = Math.round(Math.sqrt(Math.pow(curX - startX, 2) + Math.pow(curY - startY, 2)));
        // if the user swiped more than the minimum length, perform the appropriate action
        if (swipeLength >= minLength) {
            caluculateAngle();
            determineSwipeDirection();
            processingRoutine();
            touchCancel(event); // reset the variables
        } else {
            touchCancel(event);
        }
    } else {
        touchCancel(event);
    }
};

window.touchCancel = event => {
    // reset the variables back to default values
    fingerCount = 0;
    startX = 0;
    startY = 0;
    curX = 0;
    curY = 0;
    deltaX = 0;
    deltaY = 0;
    horzDiff = 0;
    vertDiff = 0;
    swipeLength = 0;
    swipeAngle = null;
    swipeDirection = null;
    triggerElementID = null;
};

window.caluculateAngle = () => {
    const X = startX - curX;
    const Y = curY - startY;
    const r = Math.atan2(Y, X); //angle in radians (Cartesian system)
    swipeAngle = Math.round((r * 180) / Math.PI); //angle in degrees
    if (swipeAngle < 0) {
        swipeAngle = 360 - Math.abs(swipeAngle);
    }
};

window.determineSwipeDirection = () =>
    swipeDirection =
        swipeAngle <= 45 && swipeAngle >= 0
            ? 'left'
            : swipeAngle <= 360 && swipeAngle >= 315
            ? 'left'
            : swipeAngle >= 135 && swipeAngle <= 225
            ? 'right'
            : swipeAngle > 45 && swipeAngle < 135
            ? 'down'
            : 'up';

window.processingRoutine = () => {
    if (swipeDirection === 'left') {
        eventFire(document.getElementsByClassName('arrows')[1].childNodes[0], 'click');
    } else if (swipeDirection === 'right') {
        eventFire(document.getElementsByClassName('arrows')[0].childNodes[0], 'click');
    }
};

function eventFire(el, etype){
    if (el.fireEvent) {
        el.fireEvent('on' + etype);
    } else {
        var evObj = document.createEvent('Events');
        evObj.initEvent(etype, true, false);
        el.dispatchEvent(evObj);
    }
}
