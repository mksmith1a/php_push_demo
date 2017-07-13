'use strict';
if(!window.top.aspkey){
	throw new Error('missing a public key');
}
const applicationServerPublicKey = window.top.aspkey;

const pushButton = document.querySelector('.pushtoglbtn');

let isSubscribed = false;
let swRegistration = null;

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

if ('serviceWorker' in navigator && 'PushManager' in window) {
  console.log('Service Worker and Push is supported');
  //mysw.js has the push method and payload, mysw.js also has the eventhandler fr when the notification is clicked
  navigator.serviceWorker.register('mysw.js') //this MUST be in the same directory as index.php
  .then(function(swReg) {
    console.log('Service Worker is registered', swReg);

    swRegistration = swReg;
    initialiseUI();

  })
  .catch(function(error) {
    console.error('Service Worker Error', error);
  });
} else {
  console.warn('Push messaging is not supported');
  pushButton.textContent = 'Push Not Supported';
}

function subscribeUser() {
  const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
  swRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey
  })
  .then(function(subscription) {
    console.log('User is subscribed.');

    updateSubscriptionOnServer(subscription);

    isSubscribed = true;

    updateBtn();
  })
  .catch(function(err) {
    console.log('Failed to subscribe the user: ', err);
    updateBtn();
  });
}

function initialiseUI() {
  pushButton.addEventListener('click', function() {
    pushButton.disabled = true;
    if (isSubscribed) {
      unsubscribeUser();
    } else {
      subscribeUser();
    }
  });
// Set the initial subscription value
  swRegistration.pushManager.getSubscription()
  .then(function(subscription) {
    isSubscribed = !(subscription === null);

    if (isSubscribed) {
      console.log('User IS subscribed.');
    } else {
      console.log('User is NOT subscribed.');
    }

    updateBtn();
  });
}

function updateBtn() {
  if (Notification.permission === 'denied') {
    pushButton.textContent = 'Push Messaging Blocked.';
    pushButton.disabled = true;
    updateSubscriptionOnServer(null);
    return;
  }

  if (isSubscribed) {
    pushButton.textContent = 'Disable Push Messaging';
  } else {
    pushButton.textContent = 'Enable Push Messaging';
  }

  pushButton.disabled = false;

}

function updateSubscriptionOnServer(subscription) {
  // TODO: Send subscription to application server
  if (subscription) {
    const key = subscription.getKey('p256dh');
    const token = subscription.getKey('auth');

    fetch('index.php', {
  		method: 'post',
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
  		body: JSON.stringify({
        endpoint: subscription.endpoint,
        key: key ? btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))) : null,
        token: token ? btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth')))) : null,
        axn: 'subscribe'
      })
  	}).then(function(response) {
  		return response.text();
  	}).then(function(response) {
  		console.log(response);
  	}).catch(function(err) {
  		// Error :(
  		console.log('error');
  	});
  } else {
    //subscriptionDetails.classList.add('is-invisible');
  }
}

function unsubscribeUser() {
  swRegistration.pushManager.getSubscription()
  .then(function(subscription) {
    if (subscription) {
      const key = subscription.getKey('p256dh');
      const token = subscription.getKey('auth');
      fetch('index.php', {
          method: 'post',
          headers: new Headers({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            key: key ? btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))) : null,
            token: token ? btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth')))) : null,
            axn: 'unsubscribe'
          })
      }).then(function(response) {
        return response.text();
      }).then(function(response) {
        console.log(response);
      }).catch(function(err) {
        // Error :(
        console.log('error removing from db');
        throw new error('error removing from db');
      });
      //return;
      return subscription.unsubscribe();
    }
  }).catch(function(error) {
    console.log('Error unsubscribing', error);
  }).then(function() {
    updateSubscriptionOnServer(null);

    console.log('User is unsubscribed.');
    isSubscribed = false;

    updateBtn();
  });
}

const sendPushButton = document.querySelector('.sendpushbtn');
if (!sendPushButton) {
    throw new error();
}

sendPushButton.addEventListener('click', () =>
  navigator.serviceWorker.ready
  .then(serviceWorkerRegistration => serviceWorkerRegistration.pushManager.getSubscription())
  .then(subscription => {
      if (!subscription) {
          alert('Please enable push notifications');
          return;
      }

      const key = subscription.getKey('p256dh');
      const token = subscription.getKey('auth');
      console.log('here');
      fetch('send_push_notification.php', {
          method: 'POST',
          body: JSON.stringify({
              endpoint: subscription.endpoint,
              key: key ? btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))) : null,
              token: token ? btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth')))) : null
          })
      })
  })
);