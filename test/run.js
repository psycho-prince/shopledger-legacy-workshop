'use strict';

var assert = require('assert');
var inventory = require('../lib/inventory');
var ledger = require('../lib/ledger');
var pricing = require('../lib/pricing');
var invoice = require('../lib/invoice');

(function inventoryAllowsExactAvailableQuantity() {
  var products = [{ id: 1, name: 'Rice', stock: 5, reserved: 0 }];
  assert.deepStrictEqual(inventory.check(products, [{ id: 1, qty: 5 }]), { ok: true });
  assert.strictEqual(inventory.check(products, [{ id: 1, qty: 6 }]).ok, false);
})();

(function cancellationRestoresPhysicalStock() {
  var products = [{ id: 1, stock: 3, reserved: 2 }];
  inventory.release(products, [{ id: 1, qty: 4 }]);
  assert.strictEqual(products[0].stock, 7);
  assert.strictEqual(products[0].reserved, 2);
})();

(function settlementUsesNumericArithmeticForStringAmounts() {
  var db = {
    customers: [{ id: 7, name: 'Test Customer', openingBalance: 0, totalBilled: 100, totalSettled: 10 }],
    settlements: [],
    nextSettlementId: 501
  };
  var result = ledger.recordSettlement(db, 7, '25.50', 'upi', 'test');
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.customer.totalSettled, 35.5);
  assert.strictEqual(result.customer.balance, 64.5);
  assert.strictEqual(result.settlement.amount, 25.5);
  assert.strictEqual(ledger.recordSettlement(db, 7, 'not-a-number', 'upi').ok, false);
})();

(function invoiceMatchesOrderPricingForHsnAndCoupon() {
  var items = [
    { id: 1, name: 'Rice', sku: 'R1', hsn: '1006', price: 100, qty: 2 },
    { id: 2, name: 'Tea', sku: 'T1', hsn: '0902', price: 50, qty: 1 }
  ];
  var totals = pricing.computeTotals(items, 'WELCOME');
  var figures = invoice.computeInvoiceFigures({
    items: items,
    coupon: 'WELCOME',
    subtotal: totals.subtotal,
    discount: totals.discount,
    tax: totals.tax,
    total: totals.total
  });
  assert.strictEqual(figures.subtotal, totals.subtotal);
  assert.strictEqual(figures.discount, totals.discount);
  assert.strictEqual(figures.tax, totals.tax);
  assert.strictEqual(figures.total, totals.total);
})();

console.log('All ShopLedger tests passed.');
