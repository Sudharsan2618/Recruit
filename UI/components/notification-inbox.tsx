'use client';

import { Inbox } from '@novu/nextjs';
import { useAuth } from '@/lib/auth-context';

export default function NotificationInbox() {
  const { user } = useAuth();
  const applicationIdentifier = process.env.NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER!;
  const subscriberId = user?.user_id?.toString() || '6995a72f502262ff00222ddf';

  return (
    <Inbox
      applicationIdentifier={applicationIdentifier}
      subscriberId={subscriberId}
      appearance={{
        variables: {
          colorBackground: '#ffffff',
          colorForeground: '#0a0a0a',
          colorPrimary: '#171717',
          colorPrimaryForeground: '#fafafa',
          colorSecondary: '#f5f5f5',
          colorSecondaryForeground: '#171717',
          colorCounter: '#ef4444',
          colorCounterForeground: '#fafafa',
          colorNeutral: '#e5e5e5',
          colorShadow: 'rgba(0, 0, 0, 0.08)',
          colorRing: '#0a0a0a',
          fontSize: '14px',
          borderRadius: '0.5rem',
        },
        elements: {
          bellIcon: {
            width: '20px',
            height: '20px',
            color: '#0a0a0a',
          },
        },
      }}
    />
  );
}
