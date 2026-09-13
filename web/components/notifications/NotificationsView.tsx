'use client';

import React, { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type {
  AppNotification,
  NotificationFilter,
  NotificationPriority,
  NotificationType,
} from '@/types/notification';
import {
  IconBell,
  IconCalendar,
  IconClock,
  IconAlertTriangle,
  IconFileText,
  IconClipboardCheck,
  IconCheckCircle,
  IconCircleX,
  IconInfo,
  IconCheck,
  IconArrowRight,
} from '@/components/ui/icons';

interface NotificationsViewProps {
  initialNotifications: AppNotification[];
  userId: string;
}

function getNotificationIcon(type: NotificationType, priority: NotificationPriority, size = 20) {
  switch (type) {
    case 'POLICY_RENEWAL':
      return <IconCalendar size={size} />;
    case 'POLICY_EXPIRY':
      return <IconAlertTriangle size={size} />;
    case 'CLAIM_DOCUMENTS':
      return <IconFileText size={size} />;
    case 'CLAIM_PREPARATION':
      return <IconClipboardCheck size={size} />;
    case 'DOCUMENT_PROCESSED':
      return <IconCheckCircle size={size} />;
    case 'DOCUMENT_FAILED':
      return <IconCircleX size={size} />;
    default:
      return priority === 'urgent' ? (
        <IconAlertTriangle size={size} />
      ) : (
        <IconBell size={size} />
      );
  }
}

function getPriorityBadge(priority: NotificationPriority) {
  switch (priority) {
    case 'urgent':
      return {
        label: 'Urgent',
        classes:
          'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/50',
      };
    case 'attention':
      return {
        label: 'Attention',
        classes:
          'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/50',
      };
    case 'informational':
    default:
      return {
        label: 'Info',
        classes:
          'bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] border-blue-200/60 dark:border-blue-900/50',
      };
  }
}

function getActionLabel(type: NotificationType) {
  switch (type) {
    case 'POLICY_RENEWAL':
    case 'POLICY_EXPIRY':
      return 'Review Policy';
    case 'CLAIM_DOCUMENTS':
    case 'CLAIM_PREPARATION':
      return 'Open Claim';
    case 'DOCUMENT_PROCESSED':
    case 'DOCUMENT_FAILED':
      return 'View Policy';
    default:
      return 'View Details';
  }
}

function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)}d ago`;

    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return 'Recently';
  }
}

export function NotificationsView({
  initialNotifications,
  userId,
}: NotificationsViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  const [notifications, setNotifications] = useState<AppNotification[]>(
    initialNotifications
  );
  const [filter, setFilter] = useState<NotificationFilter>('all');

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  // Counts by filter
  const filterCounts = useMemo(() => {
    return {
      all: notifications.length,
      unread: notifications.filter((n) => !n.is_read).length,
      policies: notifications.filter(
        (n) =>
          n.notification_type === 'POLICY_RENEWAL' ||
          n.notification_type === 'POLICY_EXPIRY'
      ).length,
      claims: notifications.filter(
        (n) =>
          n.notification_type === 'CLAIM_DOCUMENTS' ||
          n.notification_type === 'CLAIM_PREPARATION'
      ).length,
      documents: notifications.filter(
        (n) =>
          n.notification_type === 'DOCUMENT_PROCESSED' ||
          n.notification_type === 'DOCUMENT_FAILED'
      ).length,
    };
  }, [notifications]);

  // Filtered list
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === 'unread') return !n.is_read;
      if (filter === 'policies') {
        return (
          n.notification_type === 'POLICY_RENEWAL' ||
          n.notification_type === 'POLICY_EXPIRY'
        );
      }
      if (filter === 'claims') {
        return (
          n.notification_type === 'CLAIM_DOCUMENTS' ||
          n.notification_type === 'CLAIM_PREPARATION'
        );
      }
      if (filter === 'documents') {
        return (
          n.notification_type === 'DOCUMENT_PROCESSED' ||
          n.notification_type === 'DOCUMENT_FAILED'
        );
      }
      return true;
    });
  }, [notifications, filter]);

  // Mark a single notification as read
  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', userId);
      startTransition(() => {
        router.refresh();
      });
    } catch {
      // Revert if error
      setNotifications(initialNotifications);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setNotifications(initialNotifications);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] text-xs font-semibold uppercase tracking-wider mb-2 border border-blue-200/50 dark:border-blue-900/50">
            Page 17 · Notifications
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1220] dark:text-[#F6F8FB] tracking-tight">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#4F8CFF] text-white">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-[#667085] dark:text-slate-400 max-w-2xl">
            Proactive alerts for approaching policy renewals, required claim documents, and document processing milestones.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={isPending}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl text-[#0B1220] dark:text-white bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <IconCheck size={14} />
              <span>Mark all as read</span>
            </button>
          )}
          <Link
            href="/dashboard"
            className="px-3.5 py-2 text-xs font-medium rounded-xl text-slate-700 dark:text-slate-300 bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors shadow-xs"
          >
            ← Dashboard
          </Link>
        </div>
      </div>

      {/* 2. Filter Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            filter === 'all'
              ? 'bg-[#0B1220] dark:bg-[#4F8CFF] text-white shadow-xs'
              : 'bg-white dark:bg-[#0E1726] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
          }`}
        >
          All ({filterCounts.all})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            filter === 'unread'
              ? 'bg-[#0B1220] dark:bg-[#4F8CFF] text-white shadow-xs'
              : 'bg-white dark:bg-[#0E1726] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
          }`}
        >
          Unread ({filterCounts.unread})
        </button>
        <button
          type="button"
          onClick={() => setFilter('policies')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            filter === 'policies'
              ? 'bg-[#0B1220] dark:bg-[#4F8CFF] text-white shadow-xs'
              : 'bg-white dark:bg-[#0E1726] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
          }`}
        >
          Policies ({filterCounts.policies})
        </button>
        <button
          type="button"
          onClick={() => setFilter('claims')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            filter === 'claims'
              ? 'bg-[#0B1220] dark:bg-[#4F8CFF] text-white shadow-xs'
              : 'bg-white dark:bg-[#0E1726] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
          }`}
        >
          Claims ({filterCounts.claims})
        </button>
        <button
          type="button"
          onClick={() => setFilter('documents')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
            filter === 'documents'
              ? 'bg-[#0B1220] dark:bg-[#4F8CFF] text-white shadow-xs'
              : 'bg-white dark:bg-[#0E1726] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
          }`}
        >
          Documents ({filterCounts.documents})
        </button>
      </div>

      {/* 3. Notification Cards List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#4F8CFF] mb-4 border border-blue-200/50 dark:border-blue-900/50">
              <IconBell size={26} />
            </div>
            <h3 className="text-base font-bold text-[#0B1220] dark:text-[#F6F8FB]">
              You&apos;re all caught up.
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-[#667085] dark:text-slate-400 max-w-sm mx-auto">
              Important policy renewals, missing claim documents, and processing milestones will appear here.
            </p>
            {filter !== 'all' && (
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl text-[#4F8CFF] bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 transition"
              >
                View all notifications
              </button>
            )}
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const priorityBadge = getPriorityBadge(notif.priority);
            const actionLabel = getActionLabel(notif.notification_type);

            return (
              <div
                key={notif.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  notif.is_read
                    ? 'bg-white dark:bg-[#0E1726] border-slate-200/80 dark:border-slate-800'
                    : 'bg-white dark:bg-[#131f33] border-[#4F8CFF]/40 dark:border-[#4F8CFF]/50 ring-1 ring-[#4F8CFF]/20 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Icon */}
                  <div
                    className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      notif.priority === 'urgent'
                        ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                        : notif.priority === 'attention'
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                        : 'bg-blue-50 dark:bg-blue-950/50 text-[#4F8CFF]'
                    }`}
                  >
                    {getNotificationIcon(notif.notification_type, notif.priority, 20)}
                  </div>

                  {/* Text & Meta */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#4F8CFF] shrink-0" />
                      )}
                      <h4
                        className={`text-sm font-bold ${
                          notif.is_read
                            ? 'text-slate-800 dark:text-slate-200'
                            : 'text-[#0B1220] dark:text-[#F6F8FB]'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${priorityBadge.classes}`}
                      >
                        {priorityBadge.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <IconClock size={12} />
                        {formatRelativeTime(notif.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Area */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {notif.action_url && (
                    <Link
                      href={notif.action_url}
                      onClick={() => {
                        if (!notif.is_read) handleMarkAsRead(notif.id);
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#0B1220] hover:bg-[#162A46] dark:bg-[#4F8CFF] dark:hover:bg-[#3d7ae8] transition-colors shadow-xs inline-flex items-center gap-1.5"
                    >
                      <span>{actionLabel}</span>
                      <IconArrowRight size={13} />
                    </Link>
                  )}

                  {!notif.is_read ? (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                      title="Mark as read"
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      <IconCheck size={14} />
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 px-2 py-1">
                      Read
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Informational Security & Safety Notice */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0E1726] border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-3 shadow-xs">
        <IconInfo size={18} className="text-[#4F8CFF] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-[#0B1220] dark:text-[#F6F8FB]">
            Proactive Policy &amp; Claim Decision Support
          </p>
          <p className="leading-relaxed">
            PRISM alerts reflect real schedule dates and document readiness indicators. Notifications are informational and do not predict claim approval or constitute automatic policy renewal.
          </p>
        </div>
      </div>
    </div>
  );
}
