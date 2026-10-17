/**
 * Логика страницы оформления заказа.
 * Берёт корзину из localStorage, рендерит превью,
 * собирает данные формы и выводит в консоль.
 */

const API_URL = 'https://growtask.ru/test-front/api/products';
const PROMO_CODE = 'GROWTASK2026';
const PROMO_DISCOUNT = 0.15;

let products = [];
let cart = [];

const fmt = (n) => new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₽';

async function loadProducts() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    return json.data;
  } catch (e) {
    console.warn('API недоступен, fallback:', e);
    return [
      { id: 1, name: 'Аудиокассета', price: 490, old_price: 690, image: 'http://growtask.ru/assets/img/products/cassette.png', sku: 'RT-CAS-001', quantity: 120 },
      { id: 2, name: 'Видеомагнитофон', price: 12990, old_price: 15990, image: 'http://growtask.ru/assets/img/products/multimedia.png', sku: 'RT-VCR-002', quantity: 0 },
      { id: 3, name: 'Кассетный плеер', price: 7490, old_price: null, image: 'http://growtask.ru/assets/img/products/player.png', sku: 'RT-PLR-003', quantity: 14 },
      { id: 4, name: 'Радиоприёмник', price: 3990, old_price: 4990, image: 'http://growtask.ru/assets/img/products/radio.png', sku: 'RT-RAD-004', quantity: 9 },
      { id: 5, name: 'Проигрыватель винила', price: 18990, old_price: null, image: 'http://growtask.ru/assets/img/products/record-player.png', sku: 'RT-VNL-005', quantity: 0 },
      { id: 6, name: 'Катушечный магнитофон', price: 24990, old_price: 29990, image: 'http://growtask.ru/assets/img/products/tape-recorder.png', sku: 'RT-TAP-006', quantity: 3 },
      { id: 7, name: 'Видеокамера', price: 15990, old_price: null, image: 'http://growtask.ru/assets/img/products/video-cam.png', sku: 'RT-CAM-007', quantity: 0 },
      { id: 8, name: 'Диктофон', price: 2490, old_price: 2990, image: 'http://growtask.ru/assets/img/products/voice-recorder.png', sku: 'RT-DCT-008', quantity: 27 }
    ];
  }
}

function getProduct(id) {
  return products.find(p => p.id === id);
}

function calcTotals() {
  let totalOld = 0;
  let totalCurrent = 0;
  let totalQty = 0;

  cart.forEach(item => {
    const p = getProduct(item.id);
    if (!p) return;
    const base = p.old_price || p.price;
    totalOld += base * item.qty;
    totalCurrent += p.price * item.qty;
    totalQty += item.qty;
  });

  let discount = totalOld - totalCurrent;
  if (getPromo() === PROMO_CODE) {
    discount = totalOld * PROMO_DISCOUNT;
    totalCurrent = totalOld - discount;
  }

  return { totalOld, totalCurrent, discount, totalQty };
}

function renderPreview() {
  const preview = document.getElementById('checkoutPreview');
  const totals = calcTotals();

  document.getElementById('checkoutCount').textContent = totals.totalQty + ' товаров';
  document.getElementById('summaryCount').textContent = totals.totalQty;
  document.getElementById('summaryOld').textContent = fmt(totals.totalOld);
  document.getElementById('summaryDiscount').textContent = fmt(totals.discount);
  document.getElementById('summaryTotal').textContent = fmt(totals.totalCurrent);
  document.getElementById('headerCount').textContent = totals.totalQty;
  document.getElementById('headerPrice').textContent = fmt(totals.totalCurrent);

  preview.innerHTML = cart.map(item => {
    const p = getProduct(item.id);
    if (!p) return '';
    return `
      <div class="preview-item" title="${p.name}">
        <img src="${p.image}" alt="${p.name}">
        <span class="preview-item__qty">${item.qty}</span>
      </div>
    `;
  }).join('');
}

/**
 * Обновляет UI промокода: поле, подсказку, открытие/закрытие блока.
 * Вызывается при загрузке страницы и после действий с промокодом.
 */
function renderPromo() {
  const input = document.getElementById('promoInput');
  const hint = document.getElementById('promoHint');
  const promoToggle = document.getElementById('promoToggle');
  const promoBody = document.getElementById('promoBody');
  const promo = getPromo();

  if (promo === PROMO_CODE) {
    input.value = PROMO_CODE;
    hint.textContent = `Промокод применён: скидка ${PROMO_DISCOUNT * 100}%`;
    hint.className = 'promo__hint promo__hint--ok';
    // Открываем блок, если промокод применён
    promoToggle.setAttribute('aria-expanded', 'true');
    promoBody.hidden = false;
  } else {
    input.value = '';
    hint.textContent = '';
    hint.className = 'promo__hint';
    // По умолчанию — закрыт (по макету)
    promoToggle.setAttribute('aria-expanded', 'false');
    promoBody.hidden = true;
  }
}

/**
 * Собирает данные формы в объект заказа.
 */
function collectOrder() {
  const form = document.getElementById('checkoutForm');
  const payment = document.querySelector('input[name="payment"]:checked').value;

  const order = {
    customer: {
      firstName: form.firstName.value.trim(),
      lastName: form.lastName.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      comment: form.comment.value.trim()
    },
    payment: payment,
    promo: getPromo() || null,
    items: cart.map(item => {
      const p = getProduct(item.id);
      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        price: p.price,
        old_price: p.old_price,
        quantity: item.qty,
        sum: p.price * item.qty
      };
    }),
    totals: calcTotals(),
    createdAt: new Date().toISOString()
  };

  return order;
}

function bindEvents() {
  // === Промокод: аккордеон ===
  const promoToggle = document.getElementById('promoToggle');
  const promoBody = document.getElementById('promoBody');
  promoToggle.addEventListener('click', () => {
    const expanded = promoToggle.getAttribute('aria-expanded') === 'true';
    promoToggle.setAttribute('aria-expanded', String(!expanded));
    promoBody.hidden = expanded;
  });

  // === Промокод: применить ===
  document.getElementById('applyPromo').addEventListener('click', () => {
    const input = document.getElementById('promoInput');
    const code = input.value.trim().toUpperCase();
    const hint = document.getElementById('promoHint');

    if (code === PROMO_CODE) {
      savePromo(code);
      renderPromo();    // обновляет поле + подсказку + состояние
      renderPreview();  // пересчитывает итоги заказа
    } else {
      hint.textContent = 'Неверный промокод';
      hint.className = 'promo__hint promo__hint--error';
    }
  });

  // === Промокод: очистить (крестик) ===
  document.getElementById('promoClear').addEventListener('click', () => {
    clearPromo();      // удаляем промокод из localStorage
    renderPromo();     // сбрасываем UI
    renderPreview();   // пересчитываем итоги
  });

  // Оформление заказа
  const submit = () => {
    const form = document.getElementById('checkoutForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const order = collectOrder();

    const orderNumber = Math.floor(Math.random() * 900 + 100);
    localStorage.setItem('growtask_order_number', orderNumber);
    localStorage.setItem('growtask_last_order', JSON.stringify(order));

    window.location.href = 'success.html';
  };
  
  const submitOrder = document.getElementById('submitOrder');
  if (submitOrder) submitOrder.addEventListener('click', submit);

  const submitOrderSide = document.getElementById('submitOrderSide');
  if (submitOrderSide) submitOrderSide.addEventListener('click', submit);
}

(async function init() {
  products = await loadProducts();
  cart = getCart();

  if (cart.length === 0) {
    document.querySelector('.checkout-main').innerHTML =
      '<p class="cart-empty">Корзина пуста. <a href="index.html">Вернуться в корзину</a></p>';
    return;
  }

  renderPreview();   // товары + итоги
  renderPromo();     // ← промокод: поле + подсказка + состояние блока
  bindEvents();
})();