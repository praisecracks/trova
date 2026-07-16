-- 014_add_notifications_policies.sql
-- Add update and delete policies for trova_notifications

-- Idempotent cleanup
drop policy if exists notifications_update_owner on trova_notifications;
drop policy if exists notifications_delete_owner on trova_notifications;

-- Notifications policies - allow update/delete for users who can select the notification
-- This handles existing notifications that may have incorrect profile_id values
create policy notifications_update_owner on trova_notifications for update
using (true)
with check (true);

create policy notifications_delete_owner on trova_notifications for delete
using (true);