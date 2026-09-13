export type NotificationType =
  | 'POLICY_RENEWAL'
  | 'POLICY_EXPIRY'
  | 'CLAIM_DOCUMENTS'
  | 'CLAIM_PREPARATION'
  | 'DOCUMENT_PROCESSED'
  | 'DOCUMENT_FAILED'
  | 'GENERAL';

export type NotificationPriority = 'informational' | 'attention' | 'urgent';

export type NotificationFilter =
  | 'all'
  | 'unread'
  | 'policies'
  | 'claims'
  | 'documents';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  is_read: boolean;
  priority: NotificationPriority;
  action_url: string | null;
  created_at: string;
}
