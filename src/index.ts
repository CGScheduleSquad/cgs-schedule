let possibleEvents = new Set([
  'input',
  'onpropertychange',
  'keyup',
  'change',
  'paste'
]);

window.onload = () => {
  let ticksInput = document.getElementById('ticks') as HTMLInputElement;
  possibleEvents.forEach((eventName: string) => {
    ticksInput.addEventListener(eventName, (ev: Event) => {
      let inputElement = ev.target as HTMLInputElement;
      let handler = new TickInputHandler();
      handler.showResult(inputElement);
    });
  });
};

class TickInputHandler {
  // Ticks value for date 01-01-1970
  static epochTicks: number = 621355968000000000;
  static ticksPerMillisecond: number = 10000;
  // http://ecma-international.org/ecma-262/5.1/#sec-15.9.1.1
  static maxDateMilliseconds: number = 8640000000000000;

  public showResult(inputElement: HTMLInputElement) {
    // Get value from the input and try to convert it to type Number
    let valueStr = inputElement.value;
    let ticks = Number(valueStr);

    let dateString = String();
    // If we were not able to parse input as a Number - show empty DateTimeString
    if (isNaN(ticks)) {
      dateString = '____-__-__T__:__:__.____Z';
    }

    // convert the ticks into something typescript understands
    let ticksSinceEpoch = ticks - TickInputHandler.epochTicks;
    let millisecondsSinceEpoch =
      ticksSinceEpoch / TickInputHandler.ticksPerMillisecond;
    // If the value of the input is more than max value - show special DateTime string for this case
    if (millisecondsSinceEpoch > TickInputHandler.maxDateMilliseconds) {
      dateString = '9999-99-99T99:99:99:9999Z';
    }

    // output the result in something the human understands
    let date = new Date(millisecondsSinceEpoch);
    dateString = date.toISOString();
    let dateTimeOutput = document.getElementById('datetime');
    if (dateTimeOutput != null) {
      dateTimeOutput.innerHTML = dateString;
    }
  }
}
