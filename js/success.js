// Читаем заказ из localStorage (сохранён на checkout.html)
const lastOrder = localStorage.getItem('growtask_last_order');

if (lastOrder) {
try {
    const order = JSON.parse(lastOrder);

    // Выводим в консоль — проверяющий увидит это в F12
    console.log('%c📦 Данные заказа:', 'color: #A61029; font-weight: bold; font-size: 14px;', order);

    console.group('Детали заказа');
    console.log('Номер заказа:', localStorage.getItem('growtask_order_number') || '—');
    console.log('Покупатель:', order.customer);
    console.log('Способ оплаты:', order.payment);
    console.log('Промокод:', order.promo || 'не применён');
    console.log('Сумма без скидки:', order.totals.totalOld, '₽');
    console.log('Скидка:', order.totals.discount, '₽');
    console.log('Итого:', order.totals.totalCurrent, '₽');
    console.groupEnd();

    console.table(order.items);
} catch (e) {
    console.error('Не удалось прочитать заказ:', e);
}
} else {
console.warn('Данные заказа не найдены в localStorage');
}

// Номер заказа в заголовке
document.getElementById('orderNumber').textContent =
localStorage.getItem('growtask_order_number') || '001';

// Очищаем корзину и промокод после успешного заказа
localStorage.removeItem('growtask_cart');
localStorage.removeItem('growtask_promo');