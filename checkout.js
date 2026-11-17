// Dropfit 결제창 (Paddle Billing, 오버레이 한 페이지)
// - Paddle.js는 가격 칸이 화면 가까이 올 때만 불러옵니다. 첫 화면은 지금처럼 가볍게 둡니다.
// - 금액은 Paddle이 돌려주는 formattedTotals만 그대로 씁니다. 계산·다시 꾸미기를 하지 않습니다.
// - 판매 중(stage 'open')일 때만 window.DropfitCheckout.open({ locale, from })·ready()를 만들고 'dropfit:checkout' 이벤트를 보냅니다.
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

  // plan: 'pro'(기본, 1석) 또는 C.plans에 있는 팀 요금제('team5'·'team10'). 출시 기념 할인은 'pro'에만 붙습니다.
  function priceOf(plan) { return plan && plan !== 'pro' ? (C.plans || {})[plan] : C.priceId; }
  function items(plan) { return [{ priceId: priceOf(plan), quantity: 1 }]; }

  function showPrice() {
    var req = { items: items() };
    if (discountOn()) req.discountId = C.discountId;
    return window.Paddle.PricePreview(req).then(function (r) {
      var li = r && r.data && r.data.details && r.data.details.lineItems && r.data.details.lineItems[0];
      if (!li || !li.formattedTotals) return;
      fill('pro', li.formattedTotals.total);
      if (discountOn()) fill('pro-regular', li.formattedTotals.subtotal);
      document.documentElement.setAttribute('data-price-ready', '');
    }).catch(function (e) { console.error('[Dropfit] 가격을 불러올 수 없습니다.', e); })
      .then(function () {
        Object.keys(C.plans || {}).forEach(function (k) {
          if (!C.plans[k] || !document.querySelector('[data-price="' + k + '"]')) return;
          window.Paddle.PricePreview({ items: items(k) }).then(function (r) {
            var li = r && r.data && r.data.details && r.data.details.lineItems && r.data.details.lineItems[0];
            if (li && li.formattedTotals) fill(k, li.formattedTotals.total);
          }).catch(function (e) { console.error('[Dropfit] ' + k + ' 가격을 불러올 수 없습니다.', e); });
        });
      });
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
        var plan = opts.plan || 'pro';
        if (!priceOf(plan)) return Promise.reject(new Error('[Dropfit] ' + plan + ' 가격 ID가 paddle-config.js에 없습니다.'));
        return load().then(function (P) {
          var o = {
            items: items(plan),
            customData: { from: String(opts.from || '').slice(0, 20) },
            settings: { displayMode: 'overlay', variant: 'one-page', locale: opts.locale || 'ko' }
          };
          if (plan === 'pro' && discountOn()) o.discountId = C.discountId;
          P.Checkout.open(o);
        });
      },
      // Paddle.js를 불러 결제창을 열 준비가 되면 풀립니다(/pro처럼 들어오자마자 여는 페이지용)
      ready: function () { return load().then(function () {}); }
    };
    document.dispatchEvent(new CustomEvent('dropfit:checkout'));
  }

  // 구매 버튼([data-buy])에 마우스·손가락·키보드가 닿으면 바로 불러 둡니다. 누르는 순간 창이 뜨도록.
  function warm(e) {
    var t = e.target;
    if (t && t.closest && t.closest('[data-buy]')) load();
  }
  if (C.stage === 'open') {
    ['pointerover', 'touchstart', 'focusin'].forEach(function (n) { document.addEventListener(n, warm, { passive: true }); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
})();
