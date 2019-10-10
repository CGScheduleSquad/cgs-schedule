window.addEventListener('load', () => {
    let settings = localStorage.getItem('settings') || {};

    const openModal = () => document.getElementById('settings-modal').classList.add('is-active');

    const closeModal = () => document.getElementById('settings-modal').classList.remove('is-active');

    document.getElementById('settings').addEventListener('click', () => openModal());
    document.getElementById('save-settings').addEventListener('click', () => {
        settings = {
          theme: document.getElementById('theme').value.toLowerCase()
        };
        localStorage.setItem('settings', settings);
        closeModal();
    });
    [document.getElementsByClassName('modal-background')[0], document.getElementById('cancel-settings')].forEach(
        el => el !== null && el.addEventListener('click', () => closeModal())
    );
});
