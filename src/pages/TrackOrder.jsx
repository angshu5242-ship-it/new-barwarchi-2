import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCart } from '../components/Header';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { getOrderTracking } from '../utils/orderApi';
import { formatINR, getPriceOptions } from '../utils/price';

function formatWhen(value, language = 'en') {
  if (!value) return '';
  return new Date(value).toLocaleString(language === 'bn' ? 'bn-IN' : 'en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function TrackOrder() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { allItems, isSoldOut } = useSiteData();
  const { addManyToCart } = useCart();
  const [query, setQuery] = useState(orderId || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [error, setError] = useState('');
  const [lastChecked, setLastChecked] = useState(null);

  const load = useCallback(async (id = orderId, silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    const result = await getOrderTracking(id);
    if (!silent) setLoading(false);
    if (!result.ok) {
      setError(result.status === 404 ? t('track.notFound', 'We could not find that order number.') : result.error);
      setOrder(null);
      return;
    }
    setError('');
    setOrder(result.data?.order || null);
    setLastChecked(new Date());
  }, [orderId, t]);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setOrder(null);
      return undefined;
    }
    load(orderId);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') load(orderId, true);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [orderId, load]);

  useEffect(() => {
    document.title = order?.id ? `Track ${order.id} | New Bawarchi 2` : 'Track order | New Bawarchi 2';
  }, [order?.id]);

  const currentStep = useMemo(
    () => order?.timeline?.find((step) => step.current) || null,
    [order],
  );

  const reorder = () => {
    if (!order?.items?.length) return;
    const entries = [];
    order.items.forEach((line) => {
      const item =
        allItems.find((candidate) => String(candidate.id) === String(line.id)) ||
        allItems.find((candidate) => candidate.name === line.name);
      if (!item || isSoldOut(item.id)) return;
      const options = getPriceOptions(item);
      const chosen = options.find((option) => option.label === line.portion) || options[0];
      entries.push({
        item: {
          ...item,
          price: chosen?.display || item.price,
          portion: options.length > 1 ? chosen?.label || '' : '',
          cartKey: `${item.id}-${chosen?.label || 'Regular'}`,
        },
        quantity: Number(line.quantity) || 1,
      });
    });
    if (entries.length) addManyToCart(entries);
  };

  const submitLookup = (event) => {
    event.preventDefault();
    const clean = query.trim().toUpperCase();
    if (clean) navigate(`/track/${encodeURIComponent(clean)}`);
  };

  return (
    <div className="min-h-screen bg-surface-50 pb-16 pt-24 md:pt-32">
      <div className="section-container">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
              {t('track.orderTracking', 'Order tracking')}
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold text-gray-900 md:text-5xl">
              {t('track.title', 'Track your order')}
            </h1>
            <p className="mt-3 text-base text-gray-600">
              {t('track.subtitle', 'Live updates from the New Bawarchi 2 kitchen.')}
            </p>
          </div>

          <form onSubmit={submitLookup} className="mx-auto mt-6 flex max-w-xl gap-2">
            <label htmlFor="track-order-id" className="sr-only">
              {t('track.order', 'Order number')}
            </label>
            <input
              id="track-order-id"
              value={query}
              onChange={(event) => setQuery(event.target.value.toUpperCase())}
              placeholder="NB2-261023-ABC123"
              className="input-field flex-1 font-mono uppercase"
            />
            <button type="submit" className="btn-primary px-5">
              {t('track.refresh', 'Track')}
            </button>
          </form>

          {loading && (
            <div className="mt-8 rounded-3xl border border-surface-200 bg-white p-10 text-center text-sm text-gray-500 shadow-soft">
              {t('common.loading', 'Loading…')}
            </div>
          )}

          {!loading && error && (
            <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center shadow-soft">
              <p className="text-lg font-semibold text-amber-950">{error}</p>
              <p className="mt-2 text-sm text-amber-800">
                {t(
                  'track.notFoundHelp',
                  'Check the order number from your confirmation, or call the kitchen and we will help.',
                )}
              </p>
              <Link to="/order" className="btn-primary mt-4">
                {t('nav.order', 'Order online')}
              </Link>
            </div>
          )}

          {!loading && order && (
            <div className="mt-8 overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-strong">
              <div className="border-b border-surface-200 bg-gradient-to-r from-brand-50 to-amber-50 p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      {t('track.order', 'Order number')}
                    </p>
                    <p className="mt-0.5 font-mono text-xl font-bold text-gray-900">{order.id}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {t('track.placed', 'Placed')} {formatWhen(order.createdAt, language)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        order.cancelled
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {order.cancelled
                        ? t('track.cancelledStatus', 'Cancelled')
                        : currentStep
                          ? t(`track.step.${currentStep.id}`, currentStep.label)
                          : String(order.status).replace(/-/g, ' ')}
                    </span>
                    <p className="mt-2 text-xs text-gray-500">
                      {t('track.auto', 'Updates automatically every 15 seconds.')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-7">
                {order.cancelled && (
                  <p className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
                    {t('track.cancelled', 'This order was cancelled. Please call the kitchen if you need help.')}
                  </p>
                )}

                <ol className="space-y-1">
                  {order.timeline?.map((step, index) => (
                    <li key={step.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${
                            step.done
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : step.current
                                ? 'border-brand-600 bg-brand-100 text-brand-800'
                                : 'border-surface-300 bg-white text-gray-400'
                          }`}
                        >
                          {step.done ? '✓' : index + 1}
                        </span>
                        {index < order.timeline.length - 1 && (
                          <span
                            className={`my-1 h-6 w-0.5 ${
                              step.done ? 'bg-emerald-300' : 'bg-surface-200'
                            }`}
                          />
                        )}
                      </div>
                      <div className="pb-2 pt-1">
                        <p
                          className={`text-sm font-semibold ${
                            step.current ? 'text-brand-800' : step.done ? 'text-gray-900' : 'text-gray-400'
                          }`}
                        >
                          {t(`track.step.${step.id}`, step.label)}
                        </p>
                        {step.current && !order.cancelled && order.status !== 'completed' && (
                          <p className="text-[11px] text-brand-700">
                            {t('track.happening', 'Happening now')}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="mt-5 grid gap-3 rounded-2xl bg-surface-50 p-4 sm:grid-cols-2">
                  {(order.scheduledFor || order.readyAt) && (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        {order.scheduledFor
                          ? t('track.scheduledFor', 'Scheduled for')
                          : t('track.ready', 'Expected ready')}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-gray-900">
                        {formatWhen(order.scheduledFor || order.readyAt, language)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      {order.orderType === 'delivery'
                        ? t('track.delivery', 'Delivery')
                        : t('track.pickup', 'Pickup')}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-900">
                      {order.orderType === 'delivery'
                        ? order.deliveryZone || 'Belonia'
                        : 'College Square, Belonia'}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      {t('track.items', 'Items')}
                    </p>
                    <ul className="mt-1 space-y-1">
                      {order.items?.map((item, index) => (
                        <li key={`${item.name}-${index}`} className="flex justify-between gap-3 text-sm text-gray-700">
                          <span>
                            {item.quantity} × {item.name}
                            {item.portion ? ` (${item.portion})` : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 border-t border-surface-200 pt-4 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>{t('common.subtotal', 'Subtotal')}</span>
                    <span>{formatINR(order.subtotal || 0)}</span>
                  </div>
                  {Number(order.deliveryFee) > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>{t('common.deliveryFee', 'Delivery fee')}</span>
                      <span>{formatINR(order.deliveryFee)}</span>
                    </div>
                  )}
                  {Number(order.discount) > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>{t('common.discount', 'Loyalty reward')}</span>
                      <span>−{formatINR(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-dashed border-surface-300 pt-2 text-base font-bold text-gray-900">
                    <span>{t('track.total', 'Order total')}</span>
                    <span>{formatINR(order.total || 0)}</span>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <button type="button" onClick={() => load(order.id)} className="btn-secondary flex-1">
                    {t('track.refresh', 'Refresh status')}
                  </button>
                  <button type="button" onClick={reorder} className="btn-primary flex-1">
                    {t('track.reorder', 'Order again')}
                  </button>
                </div>
                <p className="mt-3 text-center text-[11px] text-gray-400">
                  {lastChecked
                    ? `${t('track.lastChecked', 'Last checked')} ${lastChecked.toLocaleTimeString(
                        language === 'bn' ? 'bn-IN' : 'en-IN',
                        { timeZone: 'Asia/Kolkata' },
                      )}`
                    : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
