export type TransactionType = 'physical' | 'service';
export type EscrowTransactionStatus = 'pending_deposit' | 'deposited' | 'shipped' | 'delivered' | 'funds_released' | 'disputed' | 'expired';

export interface CreateEscrowTransactionInput {
  productName: string;
  amount: number;
  shippingFee: number;
  buyerPhone: string;
  buyerEmail?: string | null;
  buyerName?: string | null;
  claimedByBuyer?: boolean;
  description: string;
  transactionType?: TransactionType;
  currencyCode?: string;
  currencySymbol?: string;
  idempotencyKey?: string;
  sellerId?: string;
  vendorName?: string;
}

export interface CreatedEscrowTransaction {
  id: string;
  sellerId: string;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  buyerName?: string | null;
  claimedByBuyer?: boolean;
  productName: string;
  amount: number;
  shippingFee: number;
  currencyCode: string;
  currencySymbol: string;
  status: EscrowTransactionStatus;
  description: string;
  transactionType: TransactionType;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string | null;
  vendorName?: string | null;
}

export interface PublicEscrowTransaction {
  id: string;
  sellerName?: string | null;
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  buyerName?: string | null;
  claimedByBuyer?: boolean;
  productName: string;
  amount: number;
  shippingFee: number;
  currencyCode: string;
  currencySymbol: string;
  status: EscrowTransactionStatus;
  description: string;
  transactionType: TransactionType;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string | null;
}

export function validateCreateEscrowTransactionInput(input: CreateEscrowTransactionInput): string | null {
  if (!input.productName?.trim()) {
    return 'Product name is required';
  }

  if (!input.buyerPhone?.trim()) {
    return 'Buyer phone number is required';
  }

  if (!Number.isFinite(Number(input.amount)) || Number(input.amount) <= 0) {
    return 'Amount must be greater than zero';
  }

  if (!Number.isFinite(Number(input.shippingFee || 0)) || Number(input.shippingFee || 0) < 0) {
    return 'Shipping fee cannot be negative';
  }

  if (input.currencyCode && input.currencyCode !== 'USD' && input.currencyCode !== 'NGN' && input.currencyCode !== 'GHS' && input.currencyCode !== 'INR') {
    return 'Unsupported currency';
  }

  if (input.transactionType && input.transactionType !== 'physical' && input.transactionType !== 'service') {
    return 'Unsupported transaction type';
  }

  return null;
}

export function validateBuyerContactInput(fullName: string, email: string, phone: string): string | null {
  if (!fullName?.trim()) {
    return 'Buyer full name is required';
  }

  if (!email?.trim()) {
    return 'Buyer email address is required';
  }

  if (!phone?.trim()) {
    return 'Buyer phone number is required';
  }

  return null;
}

export function normalizeCreateEscrowTransactionInput(input: CreateEscrowTransactionInput): CreateEscrowTransactionInput {
  const validationError = validateCreateEscrowTransactionInput(input);
  if (validationError) {
    throw new Error(validationError);
  }

  const currencyCode = input.currencyCode || 'USD';
  const transactionType = input.transactionType === 'service' ? 'service' : 'physical';

  const getCurrencySymbol = (code: string): '$' | '₦' | '₵' | '₹' => {
    switch (code) {
      case 'USD': return '$';
      case 'NGN': return '₦';
      case 'GHS': return '₵';
      case 'INR': return '₹';
      default: return '$';
    }
  };

  return {
    ...input,
    productName: input.productName.trim(),
    buyerPhone: input.buyerPhone.trim(),
    buyerEmail: input.buyerEmail?.trim() || undefined,
    buyerName: input.buyerName?.trim() || undefined,
    claimedByBuyer: input.claimedByBuyer,
    description: input.description?.trim() || '',
    amount: Number(input.amount),
    shippingFee: Number(input.shippingFee || 0),
    transactionType,
    currencyCode,
    currencySymbol: input.currencySymbol || getCurrencySymbol(currencyCode),
    sellerId: input.sellerId,
    vendorName: input.vendorName
  };
}

export function mapCreatedTransactionToEscrowLink(transaction: CreatedEscrowTransaction) {
  return {
    id: transaction.id,
    productName: transaction.productName,
    amount: transaction.amount,
    shippingFee: transaction.shippingFee,
    buyerPhone: transaction.buyerPhone || '',
    buyerEmail: transaction.buyerEmail || null,
    buyerName: transaction.buyerName || null,
    claimedByBuyer: transaction.claimedByBuyer || false,
    description: transaction.description,
    createdAt: transaction.createdAt,
    created_at: transaction.createdAt,
    updatedAt: transaction.updatedAt,
    updated_at: transaction.updatedAt,
    expiresAt: transaction.expiresAt || undefined,
    expires_at: transaction.expiresAt || undefined,
    status: transaction.status,
    vendorName: transaction.vendorName || transaction.sellerId,
    transactionType: transaction.transactionType,
    currencyCode: transaction.currencyCode,
    currencySymbol: transaction.currencySymbol
  };
}