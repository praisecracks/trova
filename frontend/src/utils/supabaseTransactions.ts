import supabase from '../lib/supabaseClient';

export async function updateTransactionStatus(
  transactionId: string,
  newStatus: string,
  additionalFields?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('trova_transactions')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...additionalFields,
      })
      .eq('id', transactionId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown Supabase status update error',
    };
  }
}
