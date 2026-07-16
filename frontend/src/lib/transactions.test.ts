import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapCreatedTransactionToEscrowLink,
  normalizeCreateEscrowTransactionInput,
  validateCreateEscrowTransactionInput
} from './transactions.validation';

test('normalizeCreateEscrowTransactionInput normalizes NGN physical transactions', () => {
  const normalized = normalizeCreateEscrowTransactionInput({
    productName: '  Nike Air Max  ',
    amount: 85000,
    shippingFee: 3500,
    buyerPhone: ' +234 812 345 6789 ',
    description: '  Test order  ',
    transactionType: 'physical',
    currencyCode: 'NGN'
  });

  assert.equal(normalized.productName, 'Nike Air Max');
  assert.equal(normalized.buyerPhone, '+234 812 345 6789');
  assert.equal(normalized.description, 'Test order');
  assert.equal(normalized.transactionType, 'physical');
  assert.equal(normalized.currencyCode, 'NGN');
  assert.equal(normalized.currencySymbol, '₦');
});

test('normalizeCreateEscrowTransactionInput normalizes USD service transactions', () => {
  const normalized = normalizeCreateEscrowTransactionInput({
    productName: 'Website build',
    amount: 120,
    shippingFee: 0,
    buyerPhone: '+2348123456789',
    description: '',
    transactionType: 'service',
    currencyCode: 'USD'
  });

  assert.equal(normalized.transactionType, 'service');
  assert.equal(normalized.currencyCode, 'USD');
  assert.equal(normalized.currencySymbol, '$');
});

test('validateCreateEscrowTransactionInput rejects invalid input', () => {
  assert.equal(validateCreateEscrowTransactionInput({
    productName: '',
    amount: 1000,
    shippingFee: 0,
    buyerPhone: '+2348123456789',
    description: ''
  }), 'Product name is required');

  assert.equal(validateCreateEscrowTransactionInput({
    productName: 'Nike Air Max',
    amount: -1,
    shippingFee: 0,
    buyerPhone: '+2348123456789',
    description: ''
  }), 'Amount must be greater than zero');

  assert.equal(validateCreateEscrowTransactionInput({
    productName: 'Nike Air Max',
    amount: 1000,
    shippingFee: 0,
    buyerPhone: '+2348123456789',
    description: '',
    currencyCode: 'EUR' as any
  }), 'Unsupported currency');
});

test('mapCreatedTransactionToEscrowLink maps database transaction to dashboard shape', () => {
  const mapped = mapCreatedTransactionToEscrowLink({
    id: 'TL-1234',
    sellerId: 'seller-1',
    buyerPhone: '+2348123456789',
    productName: 'Nike Air Max',
    amount: 85000,
    shippingFee: 3500,
    currencyCode: 'NGN',
    currencySymbol: '₦',
    status: 'pending_deposit',
    description: 'Test order',
    transactionType: 'physical',
    createdAt: '2026-06-14T07:00:00.000Z',
    updatedAt: '2026-06-14T07:00:00.000Z',
    expiresAt: '2026-06-17T07:00:00.000Z'
  });

  assert.equal(mapped.id, 'TL-1234');
  assert.equal(mapped.productName, 'Nike Air Max');
  assert.equal(mapped.status, 'pending_deposit');
  assert.equal(mapped.currencySymbol, '₦');
  assert.equal(mapped.expires_at, '2026-06-17T07:00:00.000Z');
});
