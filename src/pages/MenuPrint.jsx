import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { useSiteData } from '../context/SiteDataContext';

function VegMark({ vegetarian }) {
  return (
    <span
      className={`print-veg-mark ${vegetarian ? 'print-veg' : 'print-nonveg'}`}
      aria-label={vegetarian ? 'Vegetarian' : 'Non-vegetarian'}
    >
      <span />
    </span>
  );
}

export default function MenuPrint() {
  const { category: categoryParam } = useParams();
  const navigate = useNavigate();
  const { categories, restaurantInfo } = useSiteData();
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'all');

  useEffect(() => {
    setSelectedCategory(categoryParam || 'all');
  }, [categoryParam]);

  useEffect(() => {
    document.title = `${restaurantInfo.menuTitle} · Printed Menu | ${restaurantInfo.name}`;
    return () => {
      document.title = `${restaurantInfo.name} - Belonia's Favorite Restaurant | South Tripura`;
    };
  }, [restaurantInfo.menuTitle, restaurantInfo.name]);

  const visibleCategories = useMemo(
    () =>
      selectedCategory === 'all'
        ? categories
        : categories.filter((category) => category.id === selectedCategory),
    [categories, selectedCategory],
  );

  const menuUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/menu` : 'https://newbawarchi2.com/menu';

  const totalItems = visibleCategories.reduce((sum, category) => sum + category.items.length, 0);

  const handleCategoryChange = (event) => {
    const value = event.target.value;
    setSelectedCategory(value);
    navigate(value === 'all' ? '/menu-print' : `/menu-print/${value}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#e8dfd0] print:bg-white">
      {/* Screen toolbar */}
      <div className="no-print sticky top-0 z-40 border-b border-stone-300 bg-[#fffdf8]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100"
              aria-label="Back to website"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <p className="text-sm font-semibold text-stone-900">Printed menu studio</p>
              <p className="text-xs text-stone-500">{totalItems} dishes · A4 ready</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="print-category" className="sr-only">Choose a menu section</label>
            <select
              id="print-category"
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800"
            >
              <option value="all">Full menu · all sections</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} · {category.items.length} dishes
                </option>
              ))}
            </select>
            <Link
              to="/menu"
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
            >
              Digital menu
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / Save PDF
            </button>
          </div>
        </div>
        <div className="border-t border-stone-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
          Print tip: choose <strong>A4</strong>, set margins to <strong>None</strong>, and enable <strong>Background graphics</strong> for the full look.
        </div>
      </div>

      {/* A4 sheet */}
      <div className="print-page-wrap mx-auto w-full max-w-[210mm] px-3 py-6 print:p-0">
        <div className="print-sheet relative mx-auto bg-[#fffdf8] shadow-2xl print:shadow-none">
          <div className="print-inner relative overflow-hidden border-[3px] border-stone-800 p-[7mm] sm:p-[9mm]">
            <div className="pointer-events-none absolute inset-[2.5mm] border border-brand-600/45" aria-hidden="true" />

            {/* Corner ornaments */}
            <span className="pointer-events-none absolute left-[4mm] top-[4mm] h-5 w-5 border-l-2 border-t-2 border-brand-600" aria-hidden="true" />
            <span className="pointer-events-none absolute right-[4mm] top-[4mm] h-5 w-5 border-r-2 border-t-2 border-brand-600" aria-hidden="true" />
            <span className="pointer-events-none absolute bottom-[4mm] left-[4mm] h-5 w-5 border-b-2 border-l-2 border-brand-600" aria-hidden="true" />
            <span className="pointer-events-none absolute bottom-[4mm] right-[4mm] h-5 w-5 border-b-2 border-r-2 border-brand-600" aria-hidden="true" />

            <div className="relative">
              {/* Header */}
              <header className="text-center">
                <div className="flex items-center justify-between text-[7pt] font-semibold uppercase tracking-[0.24em] text-stone-500">
                  <span>Est. {restaurantInfo.since} · Belonia</span>
                  <span className="hidden sm:inline">Dine-in · Takeaway</span>
                  <span>★ {restaurantInfo.rating} on Google</span>
                </div>

                <div className="mt-4 flex flex-col items-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-brand-700 bg-brand-50 font-display text-xl font-bold text-brand-800">
                    N2
                  </span>
                  <h1 className="mt-3 max-w-[170mm] text-center font-display text-[27pt] font-semibold uppercase leading-none tracking-[0.06em] text-stone-900">
                    {restaurantInfo.menuTitle || restaurantInfo.name}
                  </h1>
                  <p className="mt-2 text-[10pt] font-semibold uppercase tracking-[0.24em] text-brand-800">
                    {restaurantInfo.name} · Restaurant
                  </p>
                  <p className="mt-1 max-w-md text-[9pt] italic leading-snug text-stone-500">
                    {restaurantInfo.menuSubtitle || restaurantInfo.tagline}
                  </p>
                  <p className="mt-2 text-[8pt] font-medium text-stone-600">
                    {restaurantInfo.address} &nbsp;·&nbsp; {restaurantInfo.phone}
                    {restaurantInfo.phone2 ? ` / ${restaurantInfo.phone2}` : ''}
                  </p>
                </div>

                <div className="mx-auto mt-4 flex max-w-md items-center gap-3">
                  <span className="h-px flex-1 bg-stone-300" />
                  <span className="text-[8pt] text-brand-700" aria-hidden="true">◆ ◆ ◆</span>
                  <span className="h-px flex-1 bg-stone-300" />
                </div>

                <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <p className="text-left text-[7pt] font-semibold uppercase leading-relaxed tracking-[0.18em] text-stone-500">
                    Freshly made
                    <br />
                    every day
                  </p>
                  <div>
                    <h2 className="font-display text-[24pt] font-semibold leading-none tracking-[0.32em] text-brand-800">
                      MENU
                    </h2>
                    <p className="mt-1.5 text-[7pt] font-semibold uppercase tracking-[0.22em] text-stone-500">
                      {selectedCategory === 'all' ? 'The full kitchen' : visibleCategories[0]?.name}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="rounded-md border border-stone-300 bg-white p-1.5">
                      <QRCode value={menuUrl} size={54} level="M" includeMargin={false} />
                    </div>
                    <p className="mt-1 text-right text-[6.5pt] font-semibold uppercase tracking-[0.14em] text-stone-500">
                      Scan to order
                    </p>
                  </div>
                </div>
              </header>

              <div className="mt-5 border-t-2 border-stone-800 pt-1">
                <div className="border-t border-brand-600/60 pt-4">
                  {/* Menu columns */}
                  <div className="print-columns">
                    {visibleCategories.map((category, categoryIndex) => (
                      <section key={category.id} className="print-category mb-5 break-inside-avoid">
                        <div className="mb-2 flex items-end justify-between gap-2 border-b border-brand-600/50 pb-1">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-100 text-[11pt]" aria-hidden="true">
                              {category.icon || '🍽️'}
                            </span>
                            <div>
                              <h3 className="font-display text-[13pt] font-semibold uppercase leading-none tracking-[0.12em] text-stone-900">
                                {category.name}
                              </h3>
                              {category.description && (
                                <p className="mt-0.5 text-[6.5pt] leading-tight text-stone-500">
                                  {category.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-[6.5pt] font-semibold text-stone-400">
                            {String(categoryIndex + 1).padStart(2, '0')}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {category.items.map((item) => (
                            <div key={item.id} className="break-inside-avoid">
                              <div className="flex items-baseline gap-1.5">
                                <VegMark vegetarian={item.vegetarian} />
                                <span className="text-[9.5pt] font-semibold leading-tight text-stone-900">
                                  {item.name}
                                </span>
                                {item.popular && (
                                  <span className="text-[6.5pt] font-bold uppercase tracking-wide text-brand-700">
                                    ★
                                  </span>
                                )}
                                <span className="print-dots" aria-hidden="true" />
                                <span className="whitespace-nowrap text-[9pt] font-bold text-brand-800">
                                  {item.price}
                                </span>
                              </div>
                              {item.description && (
                                <p className="ml-[18px] text-[7pt] leading-snug text-stone-500">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>

                  {visibleCategories.length === 0 && (
                    <p className="py-10 text-center text-sm text-stone-500">No dishes in this section yet.</p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <footer className="mt-6 break-inside-avoid border-t-2 border-stone-800 pt-1">
                <div className="border-t border-brand-600/60 pt-3">
                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4">
                    <div className="rounded-md border border-stone-300 bg-white p-1.5">
                      <QRCode value={menuUrl} size={52} level="M" includeMargin={false} />
                    </div>
                    <div className="text-center">
                      <p className="font-display text-[12pt] font-semibold text-stone-900">
                        Thank you for eating with us.
                      </p>
                      <p className="mt-0.5 text-[7pt] uppercase tracking-[0.18em] text-stone-500">
                        Scan the QR to see the live menu & order online
                      </p>
                      <p className="mt-1.5 text-[7.5pt] text-stone-600">
                        {restaurantInfo.hours} &nbsp;·&nbsp; Cash, UPI & cards accepted
                      </p>
                    </div>
                    <div className="text-right text-[7pt] leading-relaxed text-stone-500">
                      <p className="font-semibold uppercase tracking-[0.16em] text-stone-700">Find us</p>
                      <p>{restaurantInfo.shortAddress}</p>
                      <p>Belonia, Tripura 799155</p>
                      <p className="mt-1 font-semibold text-brand-800">{restaurantInfo.phone}</p>
                      {restaurantInfo.phone2 && (
                        <p className="font-semibold text-brand-800">{restaurantInfo.phone2}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col items-center justify-between gap-1 border-t border-dashed border-stone-300 pt-2 text-[6.5pt] text-stone-400 sm:flex-row">
                    <span>Prices are in INR and inclusive of taxes. Dishes subject to availability.</span>
                    <span>Veg & non-veg preparation areas are kept separate.</span>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </div>

        <p className="no-print mt-4 text-center text-xs text-stone-500">
          Tip: use your browser’s “Save as PDF” option to email or WhatsApp this menu.
        </p>
      </div>
    </div>
  );
}
