/**
 * Логика страницы корзины.
 * Загружает товары с API, рендерит, обрабатывает изменения.
 */

const API_URL = 'https://growtask.ru/test-front/api/products';
const PROMO_CODE = 'GROWTASK2026';
const PROMO_DISCOUNT = 0.15; // 15% скидка

// ===== Состояние =====
let products = [];        // товары с API
let cart = [];           // текущая корзина (id + qty)
let selected = new Set();// выбранные id для массовых действий

// ===== Утилиты =====
const fmt = (n) => new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₽';

/**
 * Загрузка товаров с API.
 * При ошибке используем fallback-данные из задания.
 */
async function loadProducts() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    return json.data;
  } catch (e) {
    console.warn('API недоступен, используем fallback:', e);
    // Fallback из условия задания
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

/**
 * Инициализация корзины: если в localStorage пусто,
 * добавляем все товары с quantity > 0 (по 1 шт).
 */
function initCart() {
  cart = getCart();
  if (cart.length === 0) {
    cart = products
      .filter(p => p.quantity > 0)
      .map(p => ({ id: p.id, qty: 1 }));
    saveCart(cart);
  }
}

/**
 * Получить объект товара по id.
 */
function getProduct(id) {
  return products.find(p => p.id === id);
}

/**
 * Подсчёт итогов.
 */
function calcTotals() {
  let totalOld = 0;   // сумма по old_price (или price, если old нет)
  let totalCurrent = 0;
  let totalQty = 0;

  cart.forEach(item => {
    const p = getProduct(item.id);
    if (!p) return;
    const basePrice = p.old_price || p.price;
    totalOld += basePrice * item.qty;
    totalCurrent += p.price * item.qty;
    totalQty += item.qty;
  });

  // Скидка от старой цены
  let discount = totalOld - totalCurrent;

  // Применяем промокод
  if (getPromo() === PROMO_CODE) {
    discount = totalOld * PROMO_DISCOUNT;
    totalCurrent = totalOld - discount;
  }

  return {
    totalOld,
    totalCurrent,
    discount,
    totalQty
  };
}

/**
 * Рендер списка товаров.
 */
function renderCart() {
  const list = document.getElementById('cartList');
  const totals = calcTotals();

  if (cart.length === 0) {
    list.innerHTML = `<p class="cart-empty">Корзина пуста</p>`;
  } else {
    list.innerHTML = cart.map(item => {
      const p = getProduct(item.id);
      if (!p) return '';
      const isChecked = selected.has(p.id);
      const canDec = item.qty > 1;
      const canInc = item.qty < p.quantity;

      return `
      <div class="product" data-id="${p.id}">
        <!-- Картинка с чекбоксом -->
        <div class="product__img-wrap">
          <div class="product__img-wrap">
            <div class="product__img">
              <img src="${p.image}" alt="${p.name}" loading="lazy">
            </div>
            <label class="product__check">
              <input type="checkbox" class="product__checkbox" ${isChecked ? 'checked' : ''}>
              <span class="checkbox__mark"></span>
            </label>
          </div>
        </div>

        <!-- Инфо -->
        <div class="product__info">
          <span class="product__sku">${p.sku}</span>
          <h3 class="product__name">${p.name}</h3>
        </div>

        <!-- Правый блок: цена (стек) + кнопки -->
        <div class="product__right">
          <div class="product__price">
            <span class="product__price-current">${fmt(p.price * item.qty)}</span>
            ${p.old_price ? `<span class="product__old">${fmt(p.old_price * item.qty)}</span>` : ''}
          </div>
          <div class="product__controls">
            <div class="qty">
              <button class="qty__btn" data-action="dec" ${!canDec ? 'disabled' : ''} aria-label="Уменьшить">
                <svg width="12" height="2" viewBox="0 0 12 2" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.6667 0C11.0349 0 11.3333 0.298477 11.3333 0.666667C11.3333 1.03486 11.0349 1.33333 10.6667 1.33333H0.666667C0.298477 1.33333 0 1.03486 0 0.666667C0 0.298477 0.298477 0 0.666667 0H10.6667Z" fill="#2B2B2B"/>
                </svg>
              </button>
              <span class="qty__value">${item.qty}</span>
              <button class="qty__btn" data-action="inc" ${!canInc ? 'disabled' : ''} aria-label="Увеличить">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5.0013 10.6667V6.33333H0.666667C0.298477 6.33333 0 6.03486 0 5.66667C4.40632e-05 5.29851 0.298504 5 0.666667 5H5.0013V0.666667C5.0013 0.298477 5.29978 3.43602e-07 5.66797 0C6.03616 0 6.33464 0.298477 6.33464 0.666667V5H10.6667C11.0348 5 11.3333 5.29851 11.3333 5.66667C11.3333 6.03486 11.0349 6.33333 10.6667 6.33333H6.33464V10.6667C6.33464 11.0349 6.03616 11.3333 5.66797 11.3333C5.29978 11.3333 5.0013 11.0349 5.0013 10.6667Z" fill="#2B2B2B"/>
                </svg>
              </button>
            </div>
            <button class="product__remove" data-action="remove" aria-label="Удалить">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 3C19.5523 3 20 3.44772 20 4C20 4.55228 19.5523 5 19 5H17.9355L17.2969 14.5859C17.2453 15.359 17.2029 15.997 17.127 16.5146C17.0492 17.0444 16.926 17.5293 16.6689 17.9805C16.2688 18.6827 15.6648 19.2471 14.9375 19.5996C14.4703 19.826 13.979 19.9166 13.4453 19.959C12.9238 20.0004 12.2845 20 11.5098 20H8.49023C7.71551 20 7.07621 20.0004 6.55469 19.959C6.02098 19.9166 5.52973 19.826 5.0625 19.5996C4.33518 19.2471 3.7312 18.6827 3.33105 17.9805C3.07401 17.5293 2.95083 17.0444 2.87305 16.5146C2.79705 15.997 2.75466 15.359 2.70312 14.5859L2.06445 5H1C0.447715 5 0 4.55228 0 4C0 3.44772 0.447715 3 1 3H19ZM4.69922 14.4531C4.75287 15.2579 4.78976 15.8037 4.85156 16.2246C4.91159 16.6334 4.98552 16.8431 5.06934 16.9902C5.26941 17.3413 5.57098 17.6236 5.93457 17.7998C6.08696 17.8736 6.30099 17.9331 6.71289 17.9658C7.13698 17.9995 7.68369 18 8.49023 18H11.5098C12.3163 18 12.863 17.9995 13.2871 17.9658C13.699 17.9331 13.913 17.8736 14.0654 17.7998C14.429 17.6236 14.7306 17.3413 14.9307 16.9902C15.0145 16.8431 15.0884 16.6334 15.1484 16.2246C15.2102 15.8037 15.2471 15.2579 15.3008 14.4531L15.9307 5H4.06934L4.69922 14.4531ZM13 0C13.5523 0 14 0.447715 14 1C14 1.55228 13.5523 2 13 2H7C6.44772 2 6 1.55228 6 1C6 0.447715 6.44772 0 7 0H13Z" fill="#2B2B2B"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      `;
    }).join('');
  }

  // Обновляем итоги
  document.getElementById('summaryCount').textContent = totals.totalQty;
  document.getElementById('summaryOld').textContent = fmt(totals.totalOld);
  document.getElementById('summaryDiscount').textContent = fmt(totals.discount);
  document.getElementById('summaryTotal').textContent = fmt(totals.totalCurrent);
  document.getElementById('cartCount').textContent = totals.totalQty + ' шт.';
  document.getElementById('headerCount').textContent = totals.totalQty;
  document.getElementById('headerPrice').textContent = fmt(totals.totalCurrent);

  renderPromo();
}

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
    promoToggle.setAttribute('aria-expanded', 'true');
    promoBody.hidden = false;
  } else {
    input.value = '';
    hint.textContent = '';
    hint.className = 'promo__hint';
    promoToggle.setAttribute('aria-expanded', 'false');
    promoBody.hidden = true;
  }
}

/**
 * Обработчики событий.
 */
function bindEvents() {
  // Делегирование кликов по товарам
  document.getElementById('cartList').addEventListener('click', (e) => {
    // Ищем ближайшую кнопку с data-action (поднимаемся по DOM)
    const btn = e.target.closest('[data-action]');
    if (!btn) return;                        // клик мимо кнопки — игнорируем

    const productEl = btn.closest('.product');
    if (!productEl) return;

    const id = Number(productEl.dataset.id);
    const action = btn.dataset.action;       // ← теперь всегда определён
    const item = cart.find(i => i.id === id);
    const p = getProduct(id);
    if (!item || !p) return;

    if (action === 'inc' && item.qty < p.quantity) {
      item.qty++;
      saveCart(cart);
      renderCart();
    } else if (action === 'dec' && item.qty > 1) {
      item.qty--;
      saveCart(cart);
      renderCart();
    } else if (action === 'remove') {
      cart = cart.filter(i => i.id !== id);
      selected.delete(id);
      saveCart(cart);
      renderCart();
    }
  });

  // Чекбоксы товаров
  document.getElementById('cartList').addEventListener('change', (e) => {
    if (!e.target.classList.contains('product__checkbox')) return;
    const productEl = e.target.closest('.product');
    const id = Number(productEl.dataset.id);
    if (e.target.checked) {
      selected.add(id);
    } else {
      selected.delete(id);
    }
  });

  // Выбрать все
  document.getElementById('selectAll').addEventListener('change', (e) => {
    if (e.target.checked) {
      cart.forEach(i => selected.add(i.id));
    } else {
      selected.clear();
    }
    renderCart();
  });

  // Очистить корзину
  document.getElementById('clearCart').addEventListener('click', () => {
    if (!confirm('Очистить корзину?')) return;
    cart = [];
    selected.clear();
    saveCart(cart);
    renderCart();
  });

  // === Промокод: аккордеон ===
  const promoToggle = document.getElementById('promoToggle');
  const promoBody = document.getElementById('promoBody');
  promoToggle.addEventListener('click', () => {
    const expanded = promoToggle.getAttribute('aria-expanded') === 'true';
    promoToggle.setAttribute('aria-expanded', String(!expanded));
    promoBody.hidden = expanded;    // было открыто → скрыть, и наоборот
  });

  // === Промокод: применить ===
  document.getElementById('applyPromo').addEventListener('click', () => {
    const input = document.getElementById('promoInput');
    const code = input.value.trim().toUpperCase();
    const hint = document.getElementById('promoHint');

    if (code === PROMO_CODE) {
      savePromo(code);
      renderCart();
    } else {
      hint.textContent = 'Неверный промокод';
      hint.className = 'promo__hint promo__hint--error';
    }
  });

  // === Промокод: очистить (крестик) ===
  document.getElementById('promoClear').addEventListener('click', () => {
    // Очищаем поле
    document.getElementById('promoInput').value = '';
    // Убираем применённый промокод из localStorage
    clearPromo();                   // функция из storage.js
    // Сбрасываем подсказку
    const hint = document.getElementById('promoHint');
    hint.textContent = '';
    hint.className = 'promo__hint';
    // Пересчитываем корзину (скидка исчезнет)
    renderCart();
  });

  // К оформлению
  document.getElementById('checkoutBtn').addEventListener('click', () => {
    if (cart.length === 0) {
      alert('Корзина пуста');
      return;
    }
    // Сохраняем выбранные товары для массового удаления
    if (selected.size > 0) {
      // Если выбраны товары — удаляем только их? Нет, переходим к оформлению.
      // По ТЗ: просто переходим к оформлению.
    }
    window.location.href = 'checkout.html';
  });
}

/**
 * Точка входа.
 */
(async function init() {
  products = await loadProducts();
  initCart();
  renderCart();
  bindEvents();
})();