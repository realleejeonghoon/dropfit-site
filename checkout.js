// Dropfit 결제창 (Paddle Billing, 오버레이 한 페이지)
// - Paddle.js는 가격 칸이 화면 가까이 올 때만 불러옵니다. 첫 화면은 지금처럼 가볍게 둡니다.
// - 금액은 Paddle이 돌려주는 formattedTotals만 그대로 씁니다. 계산·다시 꾸미기를 하지 않습니다.
// - 판매 중(stage 'open')일 때만 window.DropfitCheckout.open({ locale, from })을 엽니다.
// - 결제가 끝나면 document에 'dropfit:paid' 이벤트를 보냅니다. 받는 쪽이 preventDefault()하면 결제창을 닫습니다.
(function () {
  'use strict';
  var C = window.DROPFIT_PADDLE || {};
  if (!C.environment || !C.token || !C.priceId) {
    console.error('[Dropfit] paddle-config.js의 environment·token·priceId가 비어 있어 결제를 켜지 않습니다.');
    return;
  }
  if (C.environment !== 'sandbox' && C.environment !== 'production') {
    console.error('[Dropfit] paddle-config.js의 environment는 sandbox 또는 production이어야 합니다.');
    return;
  }

  var SRC = 'https://cdn.paddle.com/paddle/v2/paddle.js';
  var loading = null;

  function discountOn() {
    var end = Date.parse(C.discountEnds || '');
    return !!C.discountId && !isNaN(end) && Date.now() < end;
  }

  function load() {
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = SRC; s.async = true;
      s.onload = function () {
        try {
          if (C.environment === 'sandbox') window.Paddle.Environment.set('sandbox');
          window.Paddle.Initialize({ token: C.token, eventCallback: onEvent });
          resolve(window.Paddle);
        } catch (e) { reject(e); }
      };
      s.onerror = function () { reject(new Error('Paddle.js를 불러올 수 없습니다.')); };
      document.head.appendChild(s);
    });
    loading.catch(function (e) { console.error('[Dropfit]', e); loading = null; });
    return loading;
  }

  function items() { return [{ priceId: C.priceId, quantity: 1 }]; }

  function showPrice() {
    var req = { items: items() };
    if (discountOn()) req.discountId = C.discountId;
    return window.Paddle.PricePreview(req).then(function (r) {
      var li = r && r.data && r.data.details && r.data.details.lineItems && r.data.details.lineItems[0];
      if (!li || !li.formattedTotals) return;
      fill('pro', li.formattedTotals.total);
      if (discountOn()) fill('pro-regular', li.formattedTotals.subtotal);
      document.documentElement.setAttribute('data-price-ready', '');
    }).catch(function (e) { console.error('[Dropfit] 가격을 불러올 수 없습니다.', e); });
  }

  function fill(key, text) {
    if (!text) return;
    document.querySelectorAll('[data-price="' + key + '"]').forEach(function (el) { el.textContent = text; });
  }

  function onEvent(ev) {
    if (!ev || ev.name !== 'checkout.completed') return;
    var detail = { transactionId: ev.data && ev.data.transaction_id, email: ev.data && ev.data.customer && ev.data.customer.email };
    var e = new CustomEvent('dropfit:paid', { detail: detail, cancelable: true });
    if (!document.dispatchEvent(e)) { try { window.Paddle.Checkout.close(); } catch (x) {} }
  }

  // 가격 칸이 화면 600px 안으로 들어오면 불러옵니다.
  function watch() {
    var target = document.querySelector('[data-price]');
    if (!target) return;
    if (!('IntersectionObserver' in window)) { load().then(showPrice); return; }
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (x) { return x.isIntersecting; })) { io.disconnect(); load().then(showPrice); }
    }, { rootMargin: '600px 0px' });
    io.observe(target);
  }

  if (C.stage === 'open') {
    window.DropfitCheckout = {
      open: function (opts) {
        opts = opts || {};
        return load().then(function (P) {
          var o = {
            items: items(),
            customData: { from: String(opts.from || '').slice(0, 20) },
            settings: { displayMode: 'overlay', variant: 'one-page', locale: opts.locale || 'ko' }
          };
          if (discountOn()) o.discountId = C.discountId;
          P.Checkout.open(o);
        });
      }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
})();
