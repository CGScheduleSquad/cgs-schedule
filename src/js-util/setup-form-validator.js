const uuidFromWebcalLink = link =>
    link.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(?=\.ics)/g);
window.addEventListener('load', () => {
    Array.from(document.getElementsByClassName('needs-validation')).forEach(form =>
        form.addEventListener(
            'submit',
            event => {
                event.preventDefault();
                event.stopPropagation();
                if (!form.checkValidity()) {
                    document.getElementById('allClassesUrl').setAttribute('class', 'input is-danger');
                    document.getElementById('invalid').style.display = '';
                } else {
                    document.getElementById('allClassesUrl').setAttribute('class', 'input is-success');
                    document.getElementById('invalid').style.display = 'none';
                    document.getElementById('disclaimerModal').setAttribute('class', 'modal is-active is-clipped');
                    Array.from(document.getElementsByClassName('close-modal')).forEach(el =>
                        el.addEventListener('click', () =>
                            document.getElementById('disclaimerModal').setAttribute('class', 'modal')
                        )
                    );
                }
                form.classList.add('was-validated');
            },
            false
        )
    );
    document.getElementsByClassName('generate-link')[0].addEventListener('click', () => {
        localStorage.removeItem('scheduleEvents');
        window.open(
            `./schedule.html?cal=${uuidFromWebcalLink(document.getElementById('allClassesUrl').value)}`,
            '_blank'
        );
    });
});
