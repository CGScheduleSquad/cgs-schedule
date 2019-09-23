const uuidFromWebcalLink = link =>
    link.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(?=\.ics)/g);
window.addEventListener('load', () => {
    Array.from(document.getElementsByClassName('needs-validation')).forEach(form => {
        form.addEventListener(
            'submit',
            event => {
              event.preventDefault();
              event.stopPropagation();
                if (form.checkValidity()) $('#disclaimerModal').modal();
                form.classList.add('was-validated');
            },
            false
        );
    });
    document.getElementsByClassName('generate-link')[0].addEventListener('click', () => {
      localStorage.removeItem('scheduleEvents');
      let url = `./schedule.html?cal=${uuidFromWebcalLink(document.getElementById('allClassesUrl').value)}`;
      window.open(url, '_blank');
    });
});
