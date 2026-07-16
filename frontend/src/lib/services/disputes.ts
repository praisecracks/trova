import supabase from '../supabaseClient';

export interface DisputeMessage {
  id: string;
  transactionId: string;
  senderRole: 'buyer' | 'seller' | 'admin';
  messageText: string;
  attachmentUrl?: string;
  createdAt: string;
}

export async function getDisputeMessages(transactionId: string): Promise<DisputeMessage[]> {
  const { data, error } = await supabase
    .from('dispute_messages')
    .select('*')
    .eq('transaction_id', transactionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to load dispute messages:', error.message);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    transactionId: row.transaction_id,
    senderRole: row.sender_role,
    messageText: row.message_text,
    attachmentUrl: row.attachment_url || undefined,
    createdAt: row.created_at,
  }));
}

export async function sendDisputeMessage(
  transactionId: string,
  senderRole: 'buyer' | 'seller' | 'admin',
  messageText: string,
  attachmentUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('dispute_messages')
    .insert({
      transaction_id: transactionId,
      sender_role: senderRole,
      message_text: messageText,
      attachment_url: attachmentUrl || null,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export function subscribeToDisputeMessages(
  transactionId: string,
  callback: (message: DisputeMessage) => void
) {
  const channel = supabase
    .channel(`dispute:${transactionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'dispute_messages',
        filter: `transaction_id=eq.${transactionId}`,
      },
      (payload) => {
        const row = payload.new as any;
        callback({
          id: row.id,
          transactionId: row.transaction_id,
          senderRole: row.sender_role,
          messageText: row.message_text,
          attachmentUrl: row.attachment_url || undefined,
          createdAt: row.created_at,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
