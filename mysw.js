//this code was lifted from : https://developers.google.com/web/fundamentals/getting-started/codelabs/push-notifications/
//add i believe it belongs to GOOGLE
'use strict';

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: `);
  console.log(JSON.parse(event.data.text()));//modified from tutorial to make it more dynamic
  const notificationObject = JSON.parse(event.data.text());//modified from tutorial to make it more dynamic

  const title = notificationObject.title;//modified from tutorial to make it more dynamic
  const options = {
    body: notificationObject.msg,
    icon: notificationObject.icon,
    badge: notificationObject.badge
  };
  self.notificationURL = notificationObject.url;//modified from tutorial to make it more dynamic
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');
  //console.log(self.notificationURL);
  event.notification.close();

  event.waitUntil(
    clients.openWindow(self.notificationURL)//modified from tutorial to make it more dynamic
  );
});