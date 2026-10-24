import { useEffect, useState } from 'react';
import { useSiteData } from '../context/SiteDataContext';
import { useLanguage } from '../context/LanguageContext';
import { getOpenStatus } from '../utils/openStatus';

export default function OpenNowBadge({ className = '', showDetail = true }) {
  const { restaurantInfo } = useSiteData();
  const { t } = useLanguage();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const status = getOpenStatus(now, restaurantInfo);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
        status.isOpen
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-rose-200 bg-rose-50 text-rose-800'
      } ${className}`}
    >
      <span className="relative flex h-2 w-2" aria-hidden="true">
        {status.isOpen && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            status.isOpen ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        />
      </span>
      <span>{status.isOpen ? t('open.openNow', 'Open now') : t('open.closedNow', 'Closed now')}</span>
      {showDetail && (
        <span className="font-normal opacity-80">
          ·{' '}
          {status.detail === 'Closes at 10 PM'
            ? t('open.closesAt10', 'Closes at 10 PM')
            : status.detail === 'Kitchen is taking orders'
              ? t('open.takingOrders', 'Kitchen is taking orders')
              : status.detail === 'Opens at 8 AM'
                ? t('open.opensAt8', 'Opens at 8 AM')
                : status.detail === 'Opens tomorrow at 8 AM'
                  ? t('open.opensTomorrow8', 'Opens tomorrow at 8 AM')
                  : status.detail}
        </span>
      )}
    </span>
  );
}
