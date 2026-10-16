/**
 * Модуль для работы с localStorage.
 * Хранит состояние корзины между страницами.
 */

const CART_KEY = 'growtask_cart';
const PROMO_KEY = 'growtask_promo';

/**
 * Получить корзину из localStorage
 * @returns {Array} массив товаров
 */
function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Ошибка чтения корзины:', e);
    return [];
  }
}

/**
 * Сохранить корзину в localStorage
 * @param {Array} cart
 */
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/**
 * Получить применённый промокод
 */
function getPromo() {
  return localStorage.getItem(PROMO_KEY) || '';
}

/**
 * Сохранить промокод
 */
function savePromo(code) {
  localStorage.setItem(PROMO_KEY, code);
}

/**
 * Очистить промокод
 */
function clearPromo() {
  localStorage.removeItem(PROMO_KEY);
}