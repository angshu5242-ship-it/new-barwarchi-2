import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { formatINR, getPriceOptions } from '../utils/price';
import { buildWhatsAppUrl } from '../utils/whatsapp';

const STYLES = [
  { id: 'veg', key: 'catering.veg', label: 'Vegetarian', icon: '🌱' },
  { id: 'nonveg', key: 'catering.nonveg', label: 'Non-vegetarian', icon: '🍗' },
  { id: 'mixed', key: 'catering.mixed', label: 'Mixed', icon: '🍽️' },
];

function pickItem(allItems, id) {
  return allItems.find((item) => String(item.id) === String(id)) || null;
}

function largePortion(item) {
  if (!item) return null;
  const options = getPriceOptions(item);
  return options[options.length - 1] || options[0] || null;
}

export default function Catering() {
  const { t } = useLanguage();
  const { allItems, restaurantInfo } = useSiteData();
  const [guests, setGuests] = useState(50);
  const [style, setStyle] = useState('mixed');

  useEffect(() => {
    document.title = `Catering calculator | ${restaurantInfo.name}`;
    return () => {
      document.title = `${restaurantInfo.name} - Belonia's Favorite Restaurant | South Tripura`;
    };
  }, [restaurantInfo.name]);

  const plan = useMemo(() => {
    const count = Math.max(10, Math.min(500, Number(guests) || 0));
    const vegGuests = style === 'veg' ? count : style === 'mixed' ? Math.ceil(count * 0.4) : 0;
    const nonVegGuests = style === 'nonveg' ? count : style === 'mixed' ? count - vegGuests : 0;
    const lines = [];

    const add = (itemId, quantity, servesKey, serves) => {
      const item = pickItem(allItems, itemId);
      const option = largePortion(item);
      if (!item || !option || quantity <= 0) return;
      lines.push({
        id: item.id,
        name: item.name,
        portion: option.label,
        quantity,
        unitPrice: option.value,
        amount: option.value * quantity,
        servesKey,
        serves,
      });
    };

    if (vegGuests > 0) {
      add(
        18,
        Math.ceil(vegGuests / 2),
        'catering.serves.vegBiryani',
        '1 full plate per 2 vegetarian guests',
      );
      add(
        39,
        Math.ceil(vegGuests / 3),
        'catering.serves.vegGravy',
        '1 full gravy per 3 vegetarian guests',
      );
    }
    if (nonVegGuests > 0) {
      add(
        16,
        Math.ceil(nonVegGuests / 2),
        'catering.serves.nonvegBiryani',
        '1 full biryani per 2 non-veg guests',
      );
      add(
        1,
        Math.ceil(nonVegGuests / 3),
        'catering.serves.kasha',
        '1 large chicken kasha per 3 non-veg guests',
      );
    }
    add(38, Math.ceil(count / 4), 'catering.serves.momo', '1 full momo plate per 4 guests');

    return {
      count,
      vegGuests,
      nonVegGuests,
      lines,
      total: lines.reduce((sum, line) => sum + line.amount, 0),
    };
  }, [allItems, guests, style]);

  const message = useMemo(() => {
    const lines = plan.lines.map(
      (line) =>
        `• ${line.quantity} × ${line.name}${line.portion && line.portion !== 'Regular' ? ` (${line.portion})` : ''} — ${formatINR(line.amount)}`,
    );
    return [
      `Hello ${restaurantInfo.name}! I'm planning catering for about ${plan.count} guests (${STYLES.find((entry) => entry.id === style)?.label}).`,
      '',
      'Indicative plan from the website calculator:',
      ...lines,
      '',
      `Indicative food cost: ${formatINR(plan.total)}`,
      '',
      'Please confirm availability, final quantity, delivery and a firm quote. This is an estimate, not a booking.',
    ].join('\n');
  }, [plan, restaurantInfo.name, style]);

  const whatsappUrl = buildWhatsAppUrl(restaurantInfo.whatsapp, message);

  return (
    <div className="min-h-screen bg-surface-50 pb-16 pt-24 md:pt-32">
      <div className="section-container">
        <div className="mx-auto max-w-4xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
              {t('menu.title', restaurantInfo.menuTitle)} ·{' '}
              {t('nav.catering', 'Catering')}
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold text-gray-900 md:text-5xl">
              {t('catering.title', 'Catering calculator')}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              {t(
                'catering.subtitle',
                'Plan quantities and an indicative food cost for your event. Final quantities, delivery and pricing are confirmed by the kitchen.',
              )}
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-soft sm:p-6">
              <label htmlFor="catering-guests" className="label">
                {t('catering.guests', 'Number of guests')}
              </label>
              <input
                id="catering-guests"
                type="number"
                min={10}
                max={500}
                step={5}
                value={guests}
                onChange={(event) => setGuests(event.target.value)}
                className="input-field mt-1 text-lg font-semibold"
              />
              <input
                type="range"
                min={10}
                max={500}
                step={5}
                value={Math.max(10, Math.min(500, Number(guests) || 10))}
                onChange={(event) => setGuests(Number(event.target.value))}
                className="mt-3 w-full accent-brand-600"
                aria-label={t('catering.slider', 'Guest count slider')}
              />

              <p className="label mt-5">{t('catering.package', 'Menu style')}</p>
              <div className="mt-1 grid gap-2">
                {STYLES.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setStyle(entry.id)}
                    className={`flex items-center justify-between rounded-xl border-2 px-3 py-3 text-left text-sm font-semibold ${
                      style === entry.id
                        ? 'border-brand-600 bg-brand-50 text-brand-900'
                        : 'border-surface-200 bg-white text-gray-700 hover:border-brand-300'
                    }`}
                  >
                    <span>
                      <span className="mr-2" aria-hidden="true">{entry.icon}</span>
                      {t(entry.key, entry.label)}
                    </span>
                    <span className={`h-3 w-3 rounded-full ${style === entry.id ? 'bg-brand-600' : 'bg-surface-300'}`} />
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-xl bg-surface-50 p-3 text-xs leading-relaxed text-gray-600">
                <p className="font-semibold text-gray-800">
                  {t('catering.assumptionsTitle', 'Planning assumptions')}
                </p>
                <p className="mt-1">
                  {t(
                    'catering.assumptions',
                    'One full biryani per 2 guests, one full gravy per 3 guests, and one full momo plate per 4 guests. Mixed menus assume 40% vegetarian guests. These are planning estimates, not fixed package terms.',
                  )}
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-strong sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    {t('catering.estimate', 'Indicative food cost')}
                  </p>
                  <p className="mt-1 font-display text-4xl font-semibold text-gray-900">
                    {formatINR(plan.total)}
                  </p>
                </div>
                <div className="rounded-2xl bg-brand-50 px-3 py-2 text-center">
                  <p className="font-display text-2xl font-semibold text-brand-800">{plan.count}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
                    {t('catering.guestsUnit', 'guests')}
                  </p>
                </div>
              </div>

              <div className="mt-4 divide-y divide-surface-200">
                {plan.lines.map((line) => (
                  <div key={`${line.id}-${line.portion}`} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {line.quantity} × {line.name}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {line.portion !== 'Regular'
                          ? `${line.portion === 'Full' ? t('catering.full', 'Full') : line.portion === 'Half' ? t('catering.half', 'Half') : line.portion} · `
                          : ''}
                        {formatINR(line.unitPrice)} {t('catering.each', 'each')}
                      </p>
                      <p className="mt-0.5 text-[10px] text-gray-400">
                        {t(line.servesKey, line.serves)}
                      </p>
                    </div>
                    <p className="flex-shrink-0 text-sm font-semibold text-brand-800">
                      {formatINR(line.amount)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                {t(
                  'catering.disclaimer',
                  'This is a planning estimate from current menu prices, not a confirmed booking. Call or WhatsApp the kitchen for a final quote, availability and delivery.',
                )}
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1f9d55] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#178247]"
              >
                {t('catering.whatsapp', 'Send this plan on WhatsApp')}
              </a>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <a href={`tel:${restaurantInfo.phoneRaw}`} className="btn-secondary justify-center text-xs">
                  {t('catering.callKitchen', 'Call kitchen')}
                </a>
                <Link to="/menu" className="btn-secondary justify-center text-xs">
                  {t('common.viewMenu', 'View menu')}
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
