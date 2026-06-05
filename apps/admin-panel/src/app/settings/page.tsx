'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Bell, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { BROADCAST_NOTIFICATION } from '@/lib/gql';
import { Topbar } from '@/components/layout/Topbar';
import { SettingsTabs } from './_SettingsTabs';
import { useT } from '@/i18n/LocaleProvider';

const TARGET_GQL: Record<'all' | 'riders' | 'drivers', string> = {
  all: 'All',
  riders: 'Riders',
  drivers: 'Drivers',
};

export default function SettingsPage() {
  const t = useT();
  const [title,   setTitle]   = useState('');
  const [message, setMessage] = useState('');
  const [target,  setTarget]  = useState<'all' | 'riders' | 'drivers'>('all');

  const [broadcast, { loading: sending }] = useMutation(BROADCAST_NOTIFICATION, {
    onCompleted: (data) => {
      const r = data?.broadcastNotification;
      toast.success(
        `${t('settings.sentToast')} — ${r?.sent ?? 0}/${r?.totalTokens ?? 0}`,
      );
      setTitle('');
      setMessage('');
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSend = () => {
    if (!title.trim() || !message.trim()) {
      toast.error(t('common.requiredField'));
      return;
    }
    broadcast({
      variables: {
        title: title.trim(),
        body: message.trim(),
        target: TARGET_GQL[target],
      },
    });
  };

  return (
    <div>
      <Topbar title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <div className="p-6 space-y-5">
        <SettingsTabs />
      </div>

      <div className="p-6 max-w-2xl">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Bell className="w-5 h-5 text-hancr-violet" />
            <h2 className="font-extrabold text-gray-900">{t('settings.sendTitle')}</h2>
          </div>

          <div className="space-y-5">
            {/* Target audience */}
            <div>
              <label className="label">{t('settings.target.label')}</label>
              <div className="flex gap-2 flex-wrap">
                {([
                  { key: 'all',     labelKey: 'settings.target.all'     },
                  { key: 'riders',  labelKey: 'settings.target.riders'  },
                  { key: 'drivers', labelKey: 'settings.target.drivers' },
                ] as const).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setTarget(opt.key)}
                    className={`btn-sm ${
                      target === opt.key ? 'btn-primary' : 'btn-outline'
                    }`}
                  >
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="label">{t('settings.titleField')}</label>
              <input
                className="input"
                placeholder={t('settings.titlePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={60}
              />
              <p className="help-text text-end">{title.length}/60</p>
            </div>

            {/* Message */}
            <div>
              <label className="label">{t('settings.bodyField')}</label>
              <textarea
                className="input h-28 resize-none"
                placeholder={t('settings.bodyPlaceholder')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={200}
              />
              <p className="help-text text-end">{message.length}/200</p>
            </div>

            {/* Live Preview */}
            {(title || message) && (
              <div>
                <p className="label">{t('settings.preview')}</p>
                <div className="bg-gradient-to-br from-hancr-navy to-hancr-purple p-4 rounded-2xl">
                  <div className="bg-white rounded-xl p-3 shadow-card">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 bg-hancr-violet rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-extrabold">H</span>
                      </div>
                      <span className="text-xs text-gray-500 font-medium">{t('settings.previewBrand')}</span>
                      <span className="text-xs text-gray-400 ms-auto">{t('settings.previewNow')}</span>
                    </div>
                    <p className="font-bold text-sm text-gray-900">
                      {title || t('settings.titleField')}
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {message || t('settings.bodyField')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              className="btn-primary w-full"
              disabled={sending || !title.trim() || !message.trim()}
              onClick={handleSend}
            >
              <Send className="w-4 h-4" />
              {sending ? t('settings.sending') : t('settings.send')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
