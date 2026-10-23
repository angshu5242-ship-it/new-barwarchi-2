import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSiteData } from '../context/SiteDataContext';
import { useCart } from '../components/Header';
import FoodImage from '../components/FoodImage';
import OpenNowBadge from '../components/OpenNowBadge';
import { menuStyleVars } from '../data/menuStyles';
import { formatINR, getPriceOptions, parsePrice } from '../utils/price';
import { buildWhatsAppUrl } from '../utils/whatsapp';

const dietOptions = [
  { id: 'all', label: 'Everything', icon: '🍽️' },
  { id: 'vegetarian', label: 'Veg', icon: '🌱' },
  { id: 'non-veg', label: 'Non-veg', icon: '🍗' },
  { id: 'popular', label: 'Popular', icon: '⭐' },
  { id: 'spicy', label: 'Spicy', icon: '🌶️' },
];

const sortOptions = [
  { id: 'default', label: 'Recommended' },
  { id: 'price-low', label: 'Price: low to high' },
  { id: 'price-high', label: 'Price: high to low' },
  { id: 'name', label: 'Name A–Z' },
];

function VegMark({ vegetarian }) {
  return (
    <span
      className={`flex h-7 w-7 items-center justify-center rounded-lg border-2 bg-white ${
        vegetarian ? 'border-emerald-600' : 'border-rose-600'
      }`}
      title={vegetarian ? 'Vegetarian' : 'Non-vegetarian'}
      aria-label={vegetarian ? 'Vegetarian' : 'Non-vegetarian'}
    >
      <span
        className={`h-3 w-3 rounded-full ${vegetarian ? 'bg-emerald-600' : 'bg-rose-600'}`}
      />
    </span>
  );
}

export default function Menu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories, popularItems, restaurantInfo, menuStyle } = useSiteData();
  const { addToCart } = useCart();

  const [activeCategory, setActiveCategory] = useState(() => searchParams.get('category') || 'all');
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [activeDiet, setActiveDiet] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [quickView, setQuickView] = useState(null);
  const [selectedOption, setSelectedOption] = useState(0);
  const [toast, setToast] = useState('');

  const allItems = useMemo(
    () =>
      categories.flatMap((category) =>
        category.items.map((item) => ({
          ...item,
          categoryId: category.id,
          categoryName: category.name,
          categoryImage: category.image,
          categoryIcon: category.icon,
        })),
      ),
    [categories],
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isFiltered = Boolean(normalizedQuery) || activeDiet !== 'all' || sortBy !== 'default';

  const visibleItems = useMemo(() => {
    let list =
      activeCategory === 'all'
        ? [...allItems]
        : allItems.filter((item) => item.categoryId === activeCategory);

    if (normalizedQuery) {
      list = list.filter((item) =>
        [item.name, item.description, item.categoryName]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery),
      );
    }

    if (activeDiet === 'vegetarian') list = list.filter((item) => item.vegetarian);
    if (activeDiet === 'non-veg') list = list.filter((item) => !item.vegetarian);
    if (activeDiet === 'popular') list = list.filter((item) => item.popular);
    if (activeDiet === 'spicy') {
      list = list.filter(
        (item) =>
          item.spicy ||
          /chilli|chili|spicy|kadai/i.test(`${item.name} ${item.description}`),
      );
    }

    if (sortBy === 'price-low') list.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    if (sortBy === 'price-high') list.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [activeCategory, activeDiet, allItems, normalizedQuery, sortBy]);

  const sections = useMemo(() => {
    if (isFiltered) {
      return [
        {
          id: 'filtered',
          name: normalizedQuery ? `Results for “${searchQuery.trim()}”` : 'Your selection',
          description: `${visibleItems.length} dish${visibleItems.length === 1 ? '' : 'es'} found`,
          icon: '🔎',
          items: visibleItems,
        },
      ];
    }

    const selected =
      activeCategory === 'all'
        ? categories
        : categories.filter((category) => category.id === activeCategory);

    return selected.map((category) => ({ ...category, items: category.items }));
  }, [activeCategory, categories, isFiltered, normalizedQuery, searchQuery, visibleItems]);

  const totalDishes = allItems.length;
  const cheapest = allItems.length ? Math.min(...allItems.map((item) => parsePrice(item.price)).filter(Boolean)) : 0;

  const heroDishes = useMemo(() => {
    const seen = new Set();
    const picks = [];
    for (const item of [...popularItems, ...allItems]) {
      if (!item.image || seen.has(item.image)) continue;
      seen.add(item.image);
      picks.push(item);
      if (picks.length === 3) break;
    }
    return picks;
  }, [allItems, popularItems]);

  useEffect(() => {
    const category = searchParams.get('category');
    const search = searchParams.get('search') || '';
    setActiveCategory(category || 'all');
    setSearchQuery(search);
  }, [searchParams]);

  useEffect(() => {
    if (!quickView) return undefined;
    setSelectedOption(0);

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setQuickView(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [quickView]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    document.title = `${restaurantInfo.menuTitle} Menu | ${restaurantInfo.name}`;
    return () => {
      document.title = `${restaurantInfo.name} - Belonia's Favorite Restaurant | South Tripura`;
    };
  }, [restaurantInfo.menuTitle, restaurantInfo.name]);

  const updateParams = (category, search) => {
    const params = {};
    if (category && category !== 'all') params.category = category;
    if (search?.trim()) params.search = search.trim();
    setSearchParams(params, { replace: true });
  };

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    updateParams(categoryId, searchQuery);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    updateParams(activeCategory, searchQuery);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActiveDiet('all');
    setSortBy('default');
    setActiveCategory('all');
    setSearchParams({}, { replace: true });
    window.setTimeout(() => {
      document.getElementById('menu-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const addItemToCart = (item, option) => {
    const category = categories.find((entry) => entry.id === item.categoryId);
    const options = getPriceOptions(item);
    const chosen = option || options[0];

    addToCart({
      ...item,
      image: item.image || category?.image || '',
      price: chosen.display,
      cartKey: `${item.id}-${chosen.label}`,
      portion: options.length > 1 ? chosen.label : '',
    });
    setToast(`${item.name}${options.length > 1 ? ` · ${chosen.label}` : ''} added`);
  };

  const handleAdd = (item) => {
    const options = getPriceOptions(item);
    if (options.length > 1) {
      setQuickView(item);
      return;
    }
    addItemToCart(item, options[0]);
  };

  const quickViewOptions = quickView ? getPriceOptions(quickView) : [];
  const quickViewChosen = quickViewOptions[selectedOption] || quickViewOptions[0];
  const quickViewCategory = quickView
    ? categories.find((category) => category.id === quickView.categoryId)
    : null;

  const quickViewWhatsApp = quickView && quickViewChosen
    ? buildWhatsAppUrl(
        restaurantInfo.whatsapp,
        `Hello ${restaurantInfo.name}! I'd like to order ${quickView.name}${
          quickViewOptions.length > 1 ? ` (${quickViewChosen.label})` : ''
        } — ${quickViewChosen.display}. Is it available?`,
      )
    : '';

  const themeVars = useMemo(() => menuStyleVars(menuStyle), [menuStyle]);

  return (
    <div
      className="menu-page min-h-screen"
      data-layout={menuStyle.layout}
      data-radius={menuStyle.radius}
      data-heading={menuStyle.headingFont}
      style={{ ...themeVars, backgroundColor: menuStyle.bg }}
    >
      {/* Hero */}
      <header
        className="menu-hero relative overflow-hidden border-b border-surface-200 pb-12 pt-24 md:pb-16 md:pt-32"
        style={{
          background: `linear-gradient(135deg, ${menuStyle.heroFrom}, ${menuStyle.heroVia}, ${menuStyle.heroTo})`,
        }}
      >
        <div className="menu-hero-ring pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-[32px] border-brand-100/70" aria-hidden="true" />
        <div className="menu-hero-ring menu-hero-ring-alt pointer-events-none absolute -bottom-32 -left-20 h-64 w-64 rounded-full border-[28px] border-accent-100/60" aria-hidden="true" />

        <div className="section-container relative">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <OpenNowBadge />
                <span className="menu-pill inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-800">
                  <span className="menu-star text-brand-500">★</span>
                  {restaurantInfo.rating} on Google
                </span>
              </div>

              <p className="menu-accent-text mt-7 text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
                {restaurantInfo.menuTitle} · {restaurantInfo.menuSubtitle}
              </p>
              <h1 className="menu-heading mt-3 max-w-2xl font-display text-4xl font-semibold leading-[1.08] text-gray-900 sm:text-5xl lg:text-6xl">
                Good food.
                <span className="menu-accent-text block text-brand-700">Great mood.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-600 md:text-lg">
                The Bawarchi Puja Special menu — slow-cooked biryani, flaky rolls, wok-tossed
                noodles and gravies made for warm paratha. Order for pickup or delivery.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#menu-list"
                  className="btn-primary"
                >
                  Browse {totalDishes} dishes
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </a>
                <Link to="/order" className="btn-secondary">
                  Start an order
                </Link>
              </div>

              <dl className="menu-divider mt-8 grid max-w-lg grid-cols-3 gap-3 border-t border-brand-200/70 pt-5">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Categories</dt>
                  <dd className="mt-0.5 font-display text-2xl font-semibold text-gray-900">{categories.length}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Dishes</dt>
                  <dd className="mt-0.5 font-display text-2xl font-semibold text-gray-900">{totalDishes}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">From</dt>
                  <dd className="mt-0.5 font-display text-2xl font-semibold text-gray-900">{formatINR(cheapest)}</dd>
                </div>
              </dl>
            </div>

            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              <div className="grid grid-cols-2 grid-rows-[1.15fr_0.85fr] gap-3 sm:gap-4">
                {heroDishes[0] && (
                  <div className="menu-photo-frame relative row-span-2 overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-strong">
                    <FoodImage
                      src={heroDishes[0].image}
                      alt={heroDishes[0].name}
                      className="h-full min-h-[22rem] w-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5 pt-16 text-white">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-200">House favourite</p>
                      <p className="mt-1 font-display text-xl font-semibold">{heroDishes[0].name}</p>
                      <p className="text-sm text-white/85">{heroDishes[0].price}</p>
                    </div>
                  </div>
                )}
                {heroDishes.slice(1, 3).map((dish) => (
                  <div key={dish.id} className="menu-photo-frame relative overflow-hidden rounded-[1.5rem] border-4 border-white bg-white shadow-medium">
                    <FoodImage
                      src={dish.image}
                      alt={dish.name}
                      className="h-full min-h-[9rem] w-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-3 pt-8 text-white">
                      <p className="text-xs font-semibold leading-tight">{dish.name}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="menu-pill absolute -bottom-4 -left-3 rounded-2xl border border-brand-200 bg-white px-4 py-3 shadow-medium sm:-left-5">
                <p className="menu-accent-text text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-700">Pickup point</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900">College Square, Belonia</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sticky controls */}
      <div className="menu-controls sticky top-16 z-30 border-b border-surface-200 bg-[#fffdf8] md:top-20">
        <div className="section-container py-3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <form onSubmit={handleSearch} className="relative flex-1">
                <label htmlFor="menu-search" className="sr-only">Search the menu</label>
                <input
                  id="menu-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search biryani, rolls, momos, paneer…"
                  className="input-field py-2.5 pl-10 pr-20"
                />
                <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      updateParams(activeCategory, '');
                    }}
                    className="absolute right-16 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-400 hover:bg-surface-100 hover:text-gray-700"
                    aria-label="Clear search"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <button type="submit" className="menu-search-btn absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">
                  Search
                </button>
              </form>

              <div className="flex items-center gap-2">
                <label htmlFor="sort-select" className="flex-shrink-0 text-xs font-medium text-gray-500">Sort</label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="input-field min-w-44 py-2.5 text-sm"
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => handleCategoryChange('all')}
                data-active={activeCategory === 'all'}
                className="menu-chip whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors"
              >
                All dishes
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategoryChange(category.id)}
                  data-active={activeCategory === category.id}
                  className="menu-chip whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors"
                >
                  <span className="mr-1.5" aria-hidden="true">{category.icon}</span>
                  {category.name}
                </button>
              ))}

              <span className="mx-1 h-6 w-px flex-shrink-0 bg-surface-300" aria-hidden="true" />

              {dietOptions.map((diet) => (
                <button
                  key={diet.id}
                  type="button"
                  onClick={() => setActiveDiet(diet.id)}
                  aria-pressed={activeDiet === diet.id}
                  data-active={activeDiet === diet.id}
                  className="menu-chip menu-chip-outline whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
                >
                  <span className="mr-1" aria-hidden="true">{diet.icon}</span>
                  {diet.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <main id="menu-list" className="section-container scroll-mt-44 py-10 md:py-14">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="menu-accent-text text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
              {isFiltered ? 'Filtered menu' : 'The full menu'}
            </p>
            <h2 className="menu-heading mt-1 font-display text-3xl font-semibold text-gray-900">
              {isFiltered
                ? sections[0]?.name
                : activeCategory === 'all'
                  ? 'Everything we cook'
                  : categories.find((category) => category.id === activeCategory)?.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {visibleItems.length} dish{visibleItems.length === 1 ? '' : 'es'} · Prices in ₹ · Portion prices noted
            </p>
          </div>
          {isFiltered && (
            <button type="button" onClick={clearFilters} className="btn-outline self-start py-2 text-sm sm:self-auto">
              Clear filters
            </button>
          )}
        </div>

        {visibleItems.length === 0 ? (
          <div className="menu-empty rounded-3xl border border-dashed border-surface-300 bg-white py-16 text-center">
            <p className="text-5xl">🍽️</p>
            <h3 className="menu-heading mt-4 font-display text-2xl font-semibold text-gray-900">No dishes match that</h3>
            <p className="mt-2 text-gray-500">Try a different spelling, category or filter.</p>
            <button type="button" onClick={clearFilters} className="btn-primary mt-6">Show the full menu</button>
          </div>
        ) : (
          <div className="space-y-14">
            {sections.map((section) => (
              <section key={section.id} aria-labelledby={`section-${section.id}`}>
                <div className="menu-divider mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-surface-200 pb-3">
                  <div className="flex items-start gap-3">
                    <span className="menu-section-icon flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-100 text-xl" aria-hidden="true">
                      {section.icon || '🍽️'}
                    </span>
                    <div>
                      <h3 id={`section-${section.id}`} className="menu-heading font-display text-2xl font-semibold text-gray-900">
                        {section.name}
                      </h3>
                      {section.description && (
                        <p className="mt-0.5 max-w-2xl text-sm text-gray-500">{section.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-400">{section.items.length} dishes</span>
                    {!isFiltered && section.id !== 'filtered' && (
                      <Link
                        to={`/menu-print/${section.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="menu-accent-text text-xs font-semibold text-brand-700 hover:underline"
                      >
                        Print this section
                      </Link>
                    )}
                  </div>
                </div>

                <div className="menu-grid grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {section.items.map((item) => {
                    const multiPrice = getPriceOptions(item).length > 1;
                    return (
                      <article
                        key={`${item.categoryId}-${item.id}`}
                        className="menu-card group flex flex-col overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-medium"
                      >
                        <div className="menu-card-media relative aspect-[4/3] overflow-hidden bg-brand-50">
                          <FoodImage
                            src={item.image || item.categoryImage}
                            alt={item.name}
                            fallback={item.categoryIcon || (item.vegetarian ? '🥬' : '🍗')}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                            <div className="flex flex-wrap gap-1.5">
                              {item.popular && (
                                <span className="menu-badge rounded-full bg-brand-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-950">
                                  ★ Popular
                                </span>
                              )}
                              {item.chefSpecial && (
                                <span className="rounded-full bg-stone-900/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                                  Chef’s pick
                                </span>
                              )}
                              {item.spicy && (
                                <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-800">
                                  🌶 Spicy
                                </span>
                              )}
                            </div>
                            <VegMark vegetarian={item.vegetarian} />
                          </div>
                          <button
                            type="button"
                            onClick={() => setQuickView(item)}
                            className="menu-quick-btn absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-800 opacity-0 shadow-sm transition-opacity duration-200 hover:bg-white group-hover:opacity-100 focus:opacity-100"
                          >
                            Quick view
                          </button>
                        </div>

                        <div className="menu-card-body flex flex-1 flex-col p-4 md:p-5">
                          {isFiltered && (
                            <p className="menu-accent-text mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                              {item.categoryName}
                            </p>
                          )}
                          <h4 className="menu-heading font-display text-lg font-semibold leading-snug text-gray-900">
                            {item.name}
                          </h4>
                          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-500">
                            {item.description}
                          </p>
                          <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                            <div>
                              <p className="menu-price text-lg font-bold text-brand-800">{item.price}</p>
                              {multiPrice && (
                                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                                  Choose portion
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAdd(item)}
                              className="menu-add inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-brand-700"
                              aria-label={`Add ${item.name} to basket`}
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              {multiPrice ? 'Choose' : 'Add'}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* How ordering works */}
      <section className="menu-how border-y border-surface-200 bg-white py-12">
        <div className="section-container">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { step: '01', title: 'Pick your dishes', copy: 'Browse the full menu and add what you love to your basket.' },
              { step: '02', title: 'Login with your number', copy: 'Add your name, phone and delivery address. Our kitchen gets a WhatsApp alert with the order.' },
              { step: '03', title: 'Pickup or delivery', copy: 'We confirm timing on WhatsApp. Pay at the counter or on delivery.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <span className="menu-step font-display text-3xl font-semibold text-brand-300">{item.step}</span>
                <div>
                  <h3 className="menu-heading font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500">{item.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="menu-cta bg-gradient-to-br from-brand-50 via-[#fffdf8] to-accent-50 py-14">
        <div className="section-container">
          <div className="mx-auto max-w-3xl text-center">
            <p className="menu-accent-text text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Hungry yet?</p>
            <h2 className="menu-heading mt-2 font-display text-3xl font-semibold text-gray-900 md:text-4xl">
              Let’s get dinner sorted.
            </h2>
            <p className="mt-3 text-gray-600">
              Call the kitchen, message us on WhatsApp, or print a menu for the fridge.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href={buildWhatsAppUrl(
                  restaurantInfo.whatsapp,
                  `Hello ${restaurantInfo.name}! I'd like to place a takeaway order.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Order on WhatsApp
              </a>
              <a href={`tel:${restaurantInfo.phoneRaw}`} className="btn-secondary">
                Call {restaurantInfo.phone}
              </a>
              <Link to="/menu-print" className="menu-print-btn btn-outline bg-white text-brand-800">
                Print menu
              </Link>
            </div>
            <p className="mt-5 text-sm text-gray-500">{restaurantInfo.hours} · Dine-in, takeaway & delivery</p>
          </div>
        </div>
      </section>

      {/* Quick view / portion picker */}
      {quickView && quickViewChosen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-stone-950/55 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-view-title"
          onClick={() => setQuickView(null)}
        >
          <div
            className="menu-quick-card max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-strong sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="menu-quick-media relative aspect-[16/10] overflow-hidden rounded-t-3xl bg-brand-50">
              <FoodImage
                src={quickView.image || quickViewCategory?.image}
                alt={quickView.name}
                fallback={quickViewCategory?.icon || '🍽️'}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setQuickView(null)}
                className="menu-quick-close absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-800 shadow-sm hover:bg-surface-100"
                aria-label="Close quick view"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-3 left-3 flex gap-1.5">
                {quickView.popular && <span className="menu-badge rounded-full bg-brand-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-950">★ Popular</span>}
                {quickView.vegetarian
                  ? <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Veg</span>
                  : <span className="rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Non-veg</span>}
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <p className="menu-accent-text text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-700">
                {quickView.categoryName}
              </p>
              <h2 id="quick-view-title" className="menu-heading mt-1 font-display text-2xl font-semibold text-gray-900">
                {quickView.name}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{quickView.description}</p>

              {quickViewOptions.length > 1 && (
                <fieldset className="mt-5">
                  <legend className="text-xs font-semibold uppercase tracking-wider text-gray-500">Choose a portion</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {quickViewOptions.map((option, index) => (
                      <label
                        key={option.label}
                        data-active={selectedOption === index}
                        className="menu-portion cursor-pointer rounded-xl border-2 p-3 text-center transition-colors"
                      >
                        <input
                          type="radio"
                          name="portion"
                          value={option.label}
                          checked={selectedOption === index}
                          onChange={() => setSelectedOption(index)}
                          className="sr-only"
                        />
                        <span className="block text-sm font-semibold text-gray-900">{option.label}</span>
                        <span className="mt-0.5 block text-lg font-bold text-brand-800 menu-price">{option.display}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              <div className="menu-summary mt-5 flex items-center justify-between gap-3 rounded-xl bg-surface-50 px-4 py-3">
                <span className="text-sm font-medium text-gray-600">Your price</span>
                <span className="menu-price font-display text-2xl font-semibold text-brand-800">{quickViewChosen.display}</span>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    addItemToCart(quickView, quickViewChosen);
                    setQuickView(null);
                  }}
                  className="btn-primary flex-1"
                >
                  Add to basket
                </button>
                <a
                  href={quickViewWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                  Ask on WhatsApp
                </a>
              </div>
              <p className="mt-3 text-center text-xs text-gray-400">
                Portion prices are listed on the menu. Please confirm availability with the kitchen.
              </p>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-[70] flex max-w-[calc(100vw-2.5rem)] items-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white shadow-strong">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs">✓</span>
          <span className="truncate">{toast}</span>
        </div>
      )}
    </div>
  );
}
