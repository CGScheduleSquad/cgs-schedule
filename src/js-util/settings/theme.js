// window.addEventListener('load', () => {
//     let css = document.createElement('link');
//     const loadCSS = url => {
//         css.setAttribute('rel', 'stylesheet');
//         css.setAttribute('type', 'text/css');
//         css.setAttribute('href', url);
//     };
//     let settings = JSON.parse(localStorage.getItem('settings')) || {};
//     switch (settings.theme) {
//         case 'classic':
//             loadCSS('../src/scss/classic.scss');
//             break;
//         case 'dark':
//             loadCSS('../src/scss/dark.scss');
//         	break;
//     }
//     console.log(css);
//     document.getElementsByTagName('head')[0].appendChild(css);
// });
