// loading.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("Loading.js is running!");
    if (typeof NProgress !== 'undefined') {
        NProgress.configure({
            parent: 'body',
            showSpinner: false,
            // minimum: 0.8  <-- REMOVE THIS LINE.  Let NProgress use its default.
        });
        NProgress.start();
    } else {
        console.error("NProgress is not loaded!");
    }
});

window.setPageReady = function() {
    console.log("setPageReady called!");
    if (typeof NProgress !== 'undefined') {
        NProgress.done();
    } else {
        console.error("NProgress is not loaded!");
    }
    document.getElementById('loading-screen').style.opacity = 0;

    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
    }, 500); // Keep this delay; it matches the CSS transition.
};