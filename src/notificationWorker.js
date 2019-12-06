/* worker.js */
self.timeouts = [];

// Receive message from main file
self.onmessage = function(e) {
    self.timeouts.forEach(timeout => {
        clearTimeout(timeout);
    });
    self.timeouts = [];

    let data = e.data;
    console.log(data);

    data.notifications.forEach(notificationData => {
        var now = new Date();
        var millisRemaining = notificationData.time.getTime() - now.getTime();
        if (millisRemaining > 0) {
            self.timeouts.push(setTimeout(function() {
                const title = notificationData.message;
                const options = {
                    body: notificationData.body
                };
                self.registration.showNotification(title, options);
            }, millisRemaining));
        }
    });
};

