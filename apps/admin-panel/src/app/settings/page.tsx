'use client';

import { useState } from 'react';
import { Bell, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { Topbar } from '@/components/layout/Topbar';
import { useT } from '@/i18n/LocaleProvider';

export default function SettingsPage() {
  const t = useT();
  const [title,   setTitle]   = useState('');
  const [message, setMessage] = useState('');
  const [target,  setTarget]  = useState<'all' | 'riders' | 'drivers'>('all');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error(t('common.requiredField'));
      return;
    }
    setSending(true);
    // Simulate API call (real implementation would use admin-api mutation)
    await new Promise((r) => setTimeout(r, 1000));
    setSending(false);
    toast.success(t('settings.sentToast'));
    setTitle('');
    setMessage('');
  };

  return (
    <div>
      <Topbar title={t('settings.title')} subtitle={t('settings.subtitle')} />

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
