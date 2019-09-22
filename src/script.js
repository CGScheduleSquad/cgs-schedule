const uuidFromWebcalLink = link => {
  return link.match(
    /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(?=\.ics)/g
  );
};
window.addEventListener('load', () => {
  let forms = document.getElementsByClassName('needs-validation');
  Array.from(forms).forEach(form => {
    form.addEventListener(
      'submit',
      event => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        } else {
          event.preventDefault();
          event.stopPropagation();
          $('#disclaimerModal').modal();
        }
        form.classList.add('was-validated');
      },
      false
    );
  });
  $('.generate-link').click(() => {
    localStorage.removeItem('scheduleEvents');
    let url = `./schedule.html?cal=${ uuidFromWebcalLink(
      $('#allClassesUrl').val()
    ) }`;
    window.open(url, '_blank');
  });
});
let test = "test test test test asdfjkl test test test test test test test test test" // Prettier test