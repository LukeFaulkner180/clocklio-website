import test from 'node:test';
import assert from 'node:assert/strict';
import { checkoutQuote, monthlyPricePence } from '../public/pricing.js';

test('Clockx monthly and yearly options use server-compatible tier prices', () => {
  for (const [employees, yearly, monthly, seats] of [
    [1, 14999, 1499, 5], [5, 14999, 1499, 5],
    [6, 21999, 2199, 10], [10, 21999, 2199, 10],
    [11, 36999, 3699, 20], [20, 36999, 3699, 20],
  ]) {
    const annual = checkoutQuote('clocking', employees, 'year');
    const month = checkoutQuote('clocking', employees, 'month');
    assert.equal(annual.recurringPence, yearly);
    assert.equal(month.recurringPence, monthly);
    assert.equal(month.employeeLimit, seats);
    assert.equal(month.twelveMonthCostPence, monthly * 12);
    assert.equal(annual.annualSavingPence, monthly * 12 - yearly);
  }
});

test('Full Workspace monthly premium applies across all existing tiers', () => {
  for (const [count, annual, monthly] of [
    [5, 29999, 2999], [6, 34499, 3449], [7, 38999, 3899],
    [8, 43499, 4349], [9, 47999, 4799], [10, 64999, 6499],
    [15, 64999, 6499], [16, 114999, 11499], [30, 114999, 11499],
    [31, 189999, 18999], [50, 189999, 18999],
  ]) {
    const quote = checkoutQuote('full', count, 'month');
    assert.equal(quote.recurringPence, monthly);
    assert.equal(quote.annualPence, annual);
    assert.ok(monthly * 12 > annual);
  }
});

test('Invalid package, size and billing interval cannot produce a quote', () => {
  assert.equal(checkoutQuote('unknown', 5), null);
  assert.equal(checkoutQuote('full', 0), null);
  assert.equal(checkoutQuote('full', 51), null);
  assert.equal(checkoutQuote('clocking', 21), null);
  assert.equal(checkoutQuote('full', 6.5), null);
  assert.equal(checkoutQuote('full', 5, 'weekly'), null);
  assert.equal(monthlyPricePence(-10), null);
});
