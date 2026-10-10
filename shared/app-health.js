// App Health browser logs. Public, origin-pinned key; nothing here is secret.
// Logs form submits, clicks on [data-log] elements, and client errors to the
// Logs tab at health.sassmaker.com. window.appHealthLog(event, options) is
// available for custom events. Source: app-health/examples/dropin-log-client.
(function () {
  var KEY = 'ahk_pub_0fcf93e0eab1d266f134011550f56667a2f0afd34862222ffda2a02333fb21aa',
    ENV = 'production',
    URL = 'https://ingest.sassmaker.com/v1/logs';
  // No-op until a browser public key (ahk_pub_...) is provisioned above.
  if (KEY.indexOf('ahk_pub_') !== 0) return;
  if (location.hostname !== 'music.significanthobbies.com') return;
  var tracker = document.createElement('script');
  tracker.src = 'https://health.sassmaker.com/tracker.js';
  tracker.dataset.key = KEY;
  tracker.dataset.project = 'app-import-12e69de5371e3b69b20174b184e66655c7edd664689b4cb755533d9a8e2dc80b';
  tracker.dataset.identity = 'session';
  document.head.append(tracker);

  function id() {
    return crypto.randomUUID();
  }
  function send(event, o) {
    o = o || {};
    var props = {},
      src = o.props || {};
    for (var k in src)
      if (src[k] !== undefined)
        props[k] = typeof src[k] === 'string' ? src[k].slice(0, 500) : src[k];
    var body = JSON.stringify({
      public_key: KEY,
      batch_id: id(),
      schema_version: 'v1',
      environment: ENV,
      logs: [
        {
          log_id: id(),
          timestamp: Date.now(),
          event: event,
          level: o.level || 'info',
          title: o.title,
          description: o.description,
          icon: o.icon,
          props: props,
        },
      ],
    });
    if (document.visibilityState === 'hidden' && navigator.sendBeacon) {
      navigator.sendBeacon(URL, new Blob([body], { type: 'text/plain' }));
      return;
    }
    fetch(URL, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: body,
      keepalive: true,
    }).catch(function () {});
  }
  window.appHealthLog = send;
  document.addEventListener(
    'submit',
    function (e) {
      var f = e.target;
      if (!f || f.tagName !== 'FORM') return;
      send('form.submitted', {
        title: f.id || f.getAttribute('name') || f.getAttribute('action') || 'form',
        props: { page: location.pathname },
      });
    },
    true,
  );
  document.addEventListener(
    'click',
    function (e) {
      if (e.target.closest && e.target.closest('a.door, #lostResults a[href^="/"]')) {
        window.appHealth?.track('song_world_opened');
      }
      var t = e.target && e.target.closest ? e.target.closest('[data-log]') : null;
      var name = t && t.getAttribute('data-log');
      if (name)
        send(name, {
          title: (t.textContent || '').trim().slice(0, 120) || name,
          props: { page: location.pathname },
        });
    },
    true,
  );
  window.addEventListener('error', function (e) {
    send('client.error', {
      level: 'error',
      title: String(e.message || 'error').slice(0, 200),
      props: { page: location.pathname },
    });
  });
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason && e.reason.message ? e.reason.message : String(e.reason);
    send('client.error', {
      level: 'error',
      title: r.slice(0, 200),
      props: { page: location.pathname, kind: 'rejection' },
    });
  });
})();
