import { sendSms, isSmsConfigured } from './sms';
import { getSmsTemplate } from './smsTemplates';

export interface NotificationTrigger {
  transactionId: string;
  event: string;
  recipientPhone: string;
  vars?: Record<string, string>;
}

export async function sendSmsNotification(trigger: NotificationTrigger): Promise<{ sent: boolean; error?: string }> {
  if (!isSmsConfigured()) {
    return { sent: false, error: 'SMS service not configured' };
  }

  const template = getSmsTemplate(trigger.event);
  if (!template) {
    return { sent: false, error: `Unknown SMS event: ${trigger.event}` };
  }

  const message = template.body(trigger.vars || {});

  const result = await sendSms({
    to: trigger.recipientPhone,
    message,
  });

  if (result.success) {
    console.log(`[sms] Sent ${trigger.event} notification for transaction ${trigger.transactionId}`);
    return { sent: true };
  }

  console.error(`[sms] Failed to send ${trigger.event} for transaction ${trigger.transactionId}:`, result.error);
  return { sent: false, error: result.error };
}

export function shouldSendSms(event: string, status: string): boolean {
  const smsEvents: Record<string, string[]> = {
    deposit_confirmed: ['pending_deposit', 'payment_received'],
    shipment_dispatched: ['shipped'],
    out_for_delivery: ['delivered'],
    delivered: ['delivered'],
    funds_released: ['funds_released'],
    dispute_opened: ['disputed'],
    dispute_resolved: ['disputed', 'refunded'],
  };

  return smsEvents[event]?.includes(status) || false;
}
