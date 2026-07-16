import supabase from '../supabaseClient';

export interface Notification {
  id: string;
  profile_id: string;
  text_payload: string;
  read: boolean;
  created_at: string;
}

export async function getNotificationsForProfile(profileId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('trova_notifications')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data as Notification[];
}

export async function createNotification(profileId: string, textPayload: string): Promise<Notification | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('trova_notifications')
    .insert({ profile_id: profileId, text_payload: textPayload })
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
  }

  // Also sync to localStorage for real-time UI updates
  try {
    const savedNotifications = localStorage.getItem('trustlink_notifications');
    let notifications: any[] = [];
    if (savedNotifications) {
      notifications = JSON.parse(savedNotifications);
    }
    const mapped = {
      id: data?.id || `notif-${crypto.randomUUID()}`,
      profile_id: profileId,
      text_payload: textPayload,
      textPayload: textPayload,
      read: false,
      created_at: now,
      loggingTime: now,
      date: now
    };
    notifications.unshift(mapped);
    localStorage.setItem('trustlink_notifications', JSON.stringify(notifications));
    window.dispatchEvent(new CustomEvent('trustlink_notifications_update'));
  } catch (e) {
    console.warn('Could not sync notification to localStorage:', e);
  }

  return data as Notification;
}

export async function markNotificationRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('trova_notifications')
    .update({ read: true })
    .eq('id', notificationId);
  if (error) {
    console.error('Error marking notification read:', error);
    return false;
  }

  // Sync to localStorage
  try {
    const saved = localStorage.getItem('trustlink_notifications');
    if (saved) {
      const notifications = JSON.parse(saved);
      const idx = notifications.findIndex((n: any) => n.id === notificationId);
      if (idx >= 0) {
        notifications[idx].read = true;
        localStorage.setItem('trustlink_notifications', JSON.stringify(notifications));
        window.dispatchEvent(new CustomEvent('trustlink_notifications_update'));
      }
    }
  } catch (e) {}

  return true;
}

export async function markNotificationUnread(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('trova_notifications')
    .update({ read: false })
    .eq('id', notificationId);
  if (error) {
    console.error('Error marking notification unread:', error);
    return false;
  }

  // Sync to localStorage
  try {
    const saved = localStorage.getItem('trustlink_notifications');
    if (saved) {
      const notifications = JSON.parse(saved);
      const idx = notifications.findIndex((n: any) => n.id === notificationId);
      if (idx >= 0) {
        notifications[idx].read = false;
        localStorage.setItem('trustlink_notifications', JSON.stringify(notifications));
        window.dispatchEvent(new CustomEvent('trustlink_notifications_update'));
      }
    }
  } catch (e) {}

  return true;
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('trova_notifications')
    .delete()
    .eq('id', notificationId);
  if (error) {
    console.error('Error deleting notification:', error);
    return false;
  }

  // Sync to localStorage
  try {
    const saved = localStorage.getItem('trustlink_notifications');
    if (saved) {
      let notifications = JSON.parse(saved);
      notifications = notifications.filter((n: any) => n.id !== notificationId);
      localStorage.setItem('trustlink_notifications', JSON.stringify(notifications));
      window.dispatchEvent(new CustomEvent('trustlink_notifications_update'));
    }
  } catch (e) {}

  return true;
}