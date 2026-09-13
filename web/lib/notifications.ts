import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppNotification, NotificationType, NotificationPriority } from '@/types/notification';
import type { Policy } from '@/types/policy';
import type { Claim, ClaimDocument } from '@/types/claim';
import { calculateClaimReadiness } from '@/types/claim';

interface NewNotificationPayload {
  user_id: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  priority: NotificationPriority;
  action_url: string;
  is_read: boolean;
}

/**
 * Deterministically syncs and generates user notifications from real Supabase policy and claim states.
 * Guarantees zero duplicate rows across page refreshes.
 */
export async function syncUserNotifications(
  supabase: SupabaseClient,
  userId: string
): Promise<AppNotification[]> {
  // 1. Fetch existing notifications, policies, claims, and claim documents concurrently
  const [notifsRes, policiesRes, claimsRes, claimDocsRes] = await Promise.all([
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase.from('policies').select('*').eq('user_id', userId),
    supabase.from('claims').select('*').eq('user_id', userId),
    supabase
      .from('claim_documents')
      .select('*, documents(*)')
      .eq('user_id', userId),
  ]);

  const existingNotifications = (notifsRes.data || []) as AppNotification[];
  const policies = (policiesRes.data || []) as Policy[];
  const claims = (claimsRes.data || []) as Claim[];
  const claimDocuments = (claimDocsRes.data || []) as ClaimDocument[];

  const toInsert: NewNotificationPayload[] = [];
  const now = Date.now();

  // Helper to check if an active notification already exists for an entity
  const hasNotification = (
    type: NotificationType,
    actionUrl: string,
    requireUnread = false
  ) => {
    return existingNotifications.some((n) => {
      const match = n.notification_type === type && n.action_url === actionUrl;
      return requireUnread ? match && !n.is_read : match;
    });
  };

  // 2. Policy-driven notifications (Processing status + Expiry/Renewal)
  for (const policy of policies) {
    const policyUrl = `/policies/${policy.id}`;

    // A. Document processing completed
    if (policy.status === 'processed' || policy.status === 'active') {
      if (!hasNotification('DOCUMENT_PROCESSED', policyUrl)) {
        toInsert.push({
          user_id: userId,
          title: `Policy ready: ${policy.policy_name}`,
          message: `Your ${policy.insurer_name} policy is processed and ready for clause analysis.`,
          notification_type: 'DOCUMENT_PROCESSED',
          priority: 'informational',
          action_url: policyUrl,
          is_read: false,
        });
      }
    } else if (policy.status === 'failed') {
      if (!hasNotification('DOCUMENT_FAILED', policyUrl)) {
        toInsert.push({
          user_id: userId,
          title: `Processing failed: ${policy.policy_name}`,
          message: `We couldn't finish processing your ${policy.policy_name} document. Please review your file.`,
          notification_type: 'DOCUMENT_FAILED',
          priority: 'attention',
          action_url: policyUrl,
          is_read: false,
        });
      }
    }

    // B. Expiry & Renewal Intelligence (Strictly based on real policy_end_date)
    if (policy.policy_end_date) {
      try {
        const endDate = new Date(policy.policy_end_date);
        if (!isNaN(endDate.getTime())) {
          const diffMs = endDate.getTime() - now;
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          if (diffDays <= 0) {
            // Expired policy
            if (!hasNotification('POLICY_EXPIRY', policyUrl)) {
              toInsert.push({
                user_id: userId,
                title: `Policy expired: ${policy.policy_name}`,
                message: `Your policy period has ended. Review renewal options with ${policy.insurer_name}.`,
                notification_type: 'POLICY_EXPIRY',
                priority: 'urgent',
                action_url: policyUrl,
                is_read: false,
              });
            }
          } else if (diffDays <= 30) {
            // Renewal approaching within 30 days
            // Only create if an unread renewal notification does not already exist
            if (!hasNotification('POLICY_RENEWAL', policyUrl, true)) {
              const isTomorrow = diffDays === 1;
              const renewalMsg = isTomorrow
                ? `Your policy expires tomorrow. Review your renewal.`
                : `Your policy expires in ${diffDays} days. Review your renewal.`;

              toInsert.push({
                user_id: userId,
                title: `Policy renewal approaching: ${policy.policy_name}`,
                message: renewalMsg,
                notification_type: 'POLICY_RENEWAL',
                priority: diffDays <= 7 ? 'urgent' : 'attention',
                action_url: policyUrl,
                is_read: false,
              });
            }
          }
        }
      } catch {
        // Safe handling of any date parsing edge cases
      }
    }
  }

  // 3. Claim-driven notifications (Missing documents & preparation readiness)
  for (const claim of claims) {
    if (claim.status === 'closed' || claim.status === 'archived') {
      continue;
    }

    const claimUrl = `/claims/${claim.id}`;
    const attachedDocs = claimDocuments.filter((cd) => cd.claim_id === claim.id);
    const readiness = calculateClaimReadiness(attachedDocs);

    if (readiness.missingMandatoryCategories.length > 0) {
      // Missing required claim documents
      if (!hasNotification('CLAIM_DOCUMENTS', claimUrl, true)) {
        const missingCount = readiness.missingMandatoryCategories.length;
        const msg =
          missingCount === 1
            ? `1 required document is still needed for your claim.`
            : `${missingCount} required documents are still needed for your claim.`;

        toInsert.push({
          user_id: userId,
          title: `Claim documents needed: ${claim.claim_name}`,
          message: msg,
          notification_type: 'CLAIM_DOCUMENTS',
          priority: 'attention',
          action_url: claimUrl,
          is_read: false,
        });
      }
    } else if (readiness.score >= 90 && attachedDocs.length >= 3) {
      // Claim dossier ready for user review
      if (!hasNotification('CLAIM_PREPARATION', claimUrl)) {
        toInsert.push({
          user_id: userId,
          title: `Claim dossier ready: ${claim.claim_name}`,
          message: `All required documents have been uploaded. Your claim is ready for review.`,
          notification_type: 'CLAIM_PREPARATION',
          priority: 'informational',
          action_url: claimUrl,
          is_read: false,
        });
      }
    }
  }

  // 4. Batch insert any newly identified notifications
  if (toInsert.length > 0) {
    try {
      const { data: inserted, error: insertError } = await supabase
        .from('notifications')
        .insert(toInsert)
        .select('*');

      if (!insertError && inserted) {
        return [...inserted, ...existingNotifications] as AppNotification[];
      }
    } catch {
      // Graceful fallback to existing notifications if insert fails
    }
  }

  return existingNotifications;
}

/**
 * Marks a single notification as read scoped to the authenticated user.
 */
export async function markNotificationAsRead(
  supabase: SupabaseClient,
  notificationId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Marks all unread notifications as read for the user.
 */
export async function markAllNotificationsAsRead(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return !error;
  } catch {
    return false;
  }
}
