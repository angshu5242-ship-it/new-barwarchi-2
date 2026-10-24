import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const DISMISS_KEY = 'nb2_pwa_dismissed';

export default function PwaInstall() {
  const { t } = useLanguage();
  const [promptEvent, setPromptEvent] = useState(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone) {
      setInstalled(true);
      return undefined;
    }
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') return undefined;
    } catch {
      // Ignore storage restrictions.
    }

    const onPrompt = (event) => {
      event.preventDefault();
      setPromptEvent(event);
      setVisible(true);
    };
    const onInstalled = () => {
      setInstalled(true);
      setVisible(false);
      setPromptEvent(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed || !visible || !promptEvent) return null;

  const install = async () => {
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice?.outcome !== 'accepted') setVisible(false);
    } catch {
      setVisible(false);
    }
    setPromptEvent(null);
  };

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Ignore.
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-2xl border border-surface-200 bg-white p-2.5 shadow-medium">
      <button type="button" onClick={install} className="btn-primary px-3 py-2 text-xs">
        {t('common.install', 'Install app')}
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t('common.close', 'Close')}
        className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-surface-100"
      >
        ×
      </button>
    </div>
  );
}
