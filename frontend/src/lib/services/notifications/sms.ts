export type SmsProvider = 'termii' | 'twilio';

export interface SmsConfig {
  provider: SmsProvider;
  apiKey: string;
  senderId?: string;
  baseUrl?: string;
}

export interface SmsMessage {
  to: string;
  message: string;
  senderId?: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const DEFAULT_TERMII_BASE_URL = 'https://api.ng.termii.com/api';
const DEFAULT_TWILIO_BASE_URL = 'https://api.twilio.com/2010-04-01';

function getConfig(): SmsConfig | null {
  const provider = (import.meta.env.VITE_SMS_PROVIDER as SmsProvider) || 'termii';
  const apiKey = import.meta.env.VITE_SMS_API_KEY;
  const senderId = import.meta.env.VITE_SMS_SENDER_ID;

  if (!apiKey) {
    console.warn('[sms] No SMS API key configured. Set VITE_SMS_API_KEY in .env');
    return null;
  }

  return {
    provider,
    apiKey,
    senderId: senderId || 'Trova',
    baseUrl: provider === 'termii' ? DEFAULT_TERMII_BASE_URL : DEFAULT_TWILIO_BASE_URL,
  };
}

function normalizePhone(phone: string): string {
  const trimmed = phone.trim();

  // E.164 with leading +
  if (trimmed.startsWith('+')) {
    return trimmed.replace(/\D/g, '');
  }

  // International prefix 00
  if (trimmed.startsWith('00')) {
    return trimmed.replace(/\D/g, '').substring(2);
  }

  // Local formats (e.g. 08012345678, 2125551234)
  // Without a selected country code we cannot safely guess the destination.
  // Return digits as-is; the SMS provider may still deliver or reject based on its own rules.
  return trimmed.replace(/\D/g, '');
}

export async function sendSmsViaTermii(config: SmsConfig, message: SmsMessage): Promise<SmsResult> {
  const url = `${config.baseUrl}/sms/send`;
  const payload = {
    api_key: config.apiKey,
    to: normalizePhone(message.to),
    from: message.senderId || config.senderId || 'Trova',
    sms: message.message,
    type: 'plain',
    channel: 'generic',
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.code === 'ok' || data.status === 'success') {
      return {
        success: true,
        messageId: data.message_id || data.data?.message_id,
      };
    }

    return {
      success: false,
      error: data.message || data.error || 'Unknown Termii error',
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error sending SMS',
    };
  }
}

export async function sendSmsViaTwilio(config: SmsConfig, message: SmsMessage): Promise<SmsResult> {
  const [accountSid, authToken] = config.apiKey.split(':');
  if (!accountSid || !authToken) {
    return {
      success: false,
      error: 'Invalid Twilio API key format. Expected ACCOUNT_SID:AUTH_TOKEN',
    };
  }

  const url = `${DEFAULT_TWILIO_BASE_URL}/${accountSid}/Messages.json`;
  const formData = new URLSearchParams();
  formData.append('To', normalizePhone(message.to));
  formData.append('From', message.senderId || config.senderId || 'Trova');
  formData.append('Body', message.message);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (data.sid) {
      return {
        success: true,
        messageId: data.sid,
      };
    }

    return {
      success: false,
      error: data.message || data.error_message || 'Unknown Twilio error',
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network error sending SMS',
    };
  }
}

export async function sendSms(message: SmsMessage): Promise<SmsResult> {
  const config = getConfig();

  if (!config) {
    return {
      success: false,
      error: 'SMS service not configured',
    };
  }

  switch (config.provider) {
    case 'termii':
      return sendSmsViaTermii(config, message);
    case 'twilio':
      return sendSmsViaTwilio(config, message);
    default:
      return {
        success: false,
        error: `Unsupported SMS provider: ${config.provider}`,
      };
  }
}

export function isSmsConfigured(): boolean {
  return !!import.meta.env.VITE_SMS_API_KEY;
}
