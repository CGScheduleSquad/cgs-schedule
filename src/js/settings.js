window.addEventListener('load', () => {
    let settings = JSON.parse(localStorage.getItem('settings')) || {};

    const openModal = () => document.getElementById('settings-modal').classList.add('is-active');

    const closeModal = () => document.getElementById('settings-modal').classList.remove('is-active');

    document.getElementById('settings').addEventListener('click', () => openModal());
    document.getElementById('save-settings').addEventListener('click', () => {
        document.documentElement.style.setProperty('--block-1', "white");
        settings = {
          theme: document.getElementById('theme').value.toLowerCase()
        };
        localStorage.setItem('settings', JSON.stringify(settings));
        closeModal();
    });
    [document.getElementsByClassName('modal-background')[0], document.getElementById('cancel-settings')].forEach(
        el => el !== null && el.addEventListener('click', () => closeModal())
    );
});
