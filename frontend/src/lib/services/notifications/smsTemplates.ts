export interface SmsTemplate {
  subject: string;
  body: (vars: Record<string, string>) => string;
}

export const smsTemplates: Record<string, SmsTemplate> = {
  deposit_confirmed: {
    subject: 'Payment Secured',
    body: ({ buyerName, productName, amount, currencySymbol, sellerName }) =>
      `Hi ${buyerName || 'there'}, your payment of ${currencySymbol}${amount} for ${productName} has been secured in escrow. Seller: ${sellerName}. Track: {{tracking_link}}`,
  },
  shipment_dispatched: {
    subject: 'Shipment Dispatched',
    body: ({ buyerName, productName, trackingNumber, carrier }) =>
      `Hi ${buyerName || 'there'}, your order ${productName} has been shipped.${trackingNumber ? ` Tracking: ${trackingNumber}` : ''}${carrier ? ` Carrier: ${carrier}` : ''}. Track: {{tracking_link}}`,
  },
  out_for_delivery: {
    subject: 'Out for Delivery',
    body: ({ buyerName, productName, estimatedDelivery }) =>
      `Hi ${buyerName || 'there'}, your order ${productName} is out for delivery.${estimatedDelivery ? ` Expected: ${estimatedDelivery}` : ''}. Track: {{tracking_link}}`,
  },
  delivered: {
    subject: 'Delivered',
    body: ({ buyerName, productName }) =>
      `Hi ${buyerName || 'there'}, your order ${productName} has been delivered. Confirm receipt in your Trova tracking page.`,
  },
  funds_released: {
    subject: 'Funds Released',
    body: ({ buyerName, productName, amount, currencySymbol }) =>
      `Hi ${buyerName || 'there'}, funds for ${productName} (${currencySymbol}${amount}) have been released to the seller.`,
  },
  dispute_opened: {
    subject: 'Dispute Opened',
    body: ({ buyerName, productName }) =>
      `Hi ${buyerName || 'there'}, a dispute has been opened for ${productName}. Our team will review shortly.`,
  },
  dispute_resolved: {
    subject: 'Dispute Resolved',
    body: ({ buyerName, productName, resolution }) =>
      `Hi ${buyerName || 'there'}, the dispute for ${productName} has been resolved: ${resolution || 'See your account for details'}.`,
  },
};

export function getSmsTemplate(event: string): SmsTemplate | undefined {
  return smsTemplates[event];
}
