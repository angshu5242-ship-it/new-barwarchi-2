import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { useSiteData } from '../context/SiteDataContext';
import { useLanguage } from '../context/LanguageContext';
import FoodImage from './FoodImage';
import { formatINR, getPriceOptions, parsePrice } from '../utils/price';
import { buildOrderMessage, buildWhatsAppUrl } from '../utils/whatsapp';

// Light theme only — kept as a context so existing imports continue to work.
const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

const navLinks = [
  { path: '/', key: 'nav.home' },
  { path: '/menu', key: 'nav.menu' },
  { path: '/order', key: 'nav.order' },
  { path: '/catering', key: 'nav.catering' },
  { path: '/gallery', key: 'nav.gallery' },
  { path: '/about', key: 'nav.about' },
  { path: '/contact', key: 'nav.contact' },
];

export function ThemeProvider({ children }) {
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  const value = { theme: 'light', setTheme: () => {}, toggleTheme: () => {} };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Cart Context
const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('nb2_cart');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.filter((item) => item && item.id) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('nb2_cart', JSON.stringify(cart));
    } catch {
      // A full cart should never prevent the page from working.
    }
  }, [cart]);

  const keyOf = (item) => item?.cartKey ?? item?.id;

  const addToCart = (item, quantity = 1) => {
    const amount = Math.max(1, Number(quantity) || 1);
    setCart((prev) => {
      const key = keyOf(item);
      const existing = prev.find((entry) => keyOf(entry) === key);
      if (existing) {
        return prev.map((entry) =>
          keyOf(entry) === key
            ? { ...entry, quantity: Math.min(20, entry.quantity + amount) }
            : entry,
        );
      }
      return [...prev, { ...item, quantity: Math.min(20, amount) }];
    });
    setIsOpen(true);
  };

  const addManyToCart = (items = []) => {
    if (!Array.isArray(items) || !items.length) return;
    setCart((prev) => {
      const next = [...prev];
      items.forEach((entry) => {
        const item = entry.item || entry;
        const amount = Math.max(1, Number(entry.quantity) || 1);
        const key = keyOf(item);
        const index = next.findIndex((existing) => keyOf(existing) === key);
        if (index >= 0) {
          next[index] = {
            ...next[index],
            quantity: Math.min(20, next[index].quantity + amount),
          };
        } else {
          next.push({ ...item, quantity: Math.min(20, amount) });
        }
      });
      return next;
    });
    setIsOpen(true);
  };

  const removeFromCart = (key) => {
    setCart((prev) => prev.filter((item) => keyOf(item) !== key));
  };

  const updateQuantity = (key, qty) => {
    if (qty <= 0) {
      removeFromCart(key);
      return;
    }
    setCart((prev) => prev.map((item) => (keyOf(item) === key ? { ...item, quantity: qty } : item)));
  };

  const clearCart = () => setCart([]);
  const cartTotal = cart.reduce(
    (sum, item) => sum + parsePrice(item.price) * item.quantity,
    0,
  );
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartHasRange = cart.some((item) => String(item.price).includes('/'));

  return (
    <CartContext.Provider
      value={{
        cart,
        isOpen,
        setIsOpen,
        addToCart,
        addManyToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        cartHasRange,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const { cartCount, setIsOpen } = useCart();
  const { restaurantInfo } = useSiteData();
  const { t, toggleLanguage, language } = useLanguage();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowSearch(false);
  }, [location.pathname]);

  const handleSearch = (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    window.location.href = `/menu?search=${encodeURIComponent(query)}`;
    setShowSearch(false);
    setSearchQuery('');
  };

  const solidHeader = isScrolled || isMobileMenuOpen || showSearch;

  return (
    <header
      className={`site-header fixed inset-x-0 top-0 z-50 transition-colors duration-200 ${
        solidHeader
          ? 'bg-[#fffdf8] border-b border-surface-200 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <nav className="section-container" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between gap-4 md:h-20">
          {/* Brand */}
          <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="New Bawarchi 2 home">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-600 font-display text-lg font-bold text-white shadow-sm md:h-11 md:w-11">
              N2
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-lg font-semibold leading-tight text-gray-900 md:text-xl">
                {restaurantInfo.name}
              </span>
              <span className="hidden text-[11px] font-medium uppercase tracking-[0.16em] text-brand-700 sm:block">
                Belonia · Since {restaurantInfo.since}
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-brand-100 text-brand-800'
                      : 'text-gray-600 hover:bg-surface-100 hover:text-gray-900'
                  }`}
                >
                  {t(link.key, link.path)}
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={toggleLanguage}
              className="rounded-full border border-surface-300 px-2.5 py-1.5 text-[11px] font-bold text-gray-700 hover:border-brand-400 hover:text-brand-700"
              aria-label={language === 'en' ? 'Switch to Bangla' : 'Switch to English'}
              title={language === 'en' ? 'বাংলায় দেখুন' : 'View in English'}
            >
              {language === 'en' ? 'বাংলা' : 'EN'}
            </button>

            <button
              type="button"
              onClick={() => setShowSearch((value) => !value)}
              className="btn-ghost p-2 text-gray-600 hover:text-brand-700"
              aria-expanded={showSearch}
              aria-label={showSearch ? t('common.close', 'Close search') : t('common.search', 'Search the menu')}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <a
              href={`tel:${restaurantInfo.phoneRaw}`}
              className="btn-ghost hidden p-2 text-gray-600 hover:text-brand-700 sm:inline-flex"
              aria-label={`Call ${restaurantInfo.phone}`}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </a>

            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="relative btn-ghost p-2 text-gray-600 hover:text-brand-700"
              aria-label={`Open cart${cartCount ? `, ${cartCount} items` : ''}`}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            <Link to={cartCount > 0 ? '/order' : '/menu'} className="btn-primary hidden px-4 py-2.5 text-sm xl:inline-flex">
              {cartCount > 0 ? t('common.checkout', 'Checkout') : t('common.orderNow', 'Order now')}
            </Link>

            <button
              type="button"
              className="btn-ghost p-2 text-gray-600 hover:text-brand-700 lg:hidden"
              onClick={() => setIsMobileMenuOpen((value) => !value)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Search drawer */}
        {showSearch && (
          <div className="border-t border-surface-200 py-3">
            <form onSubmit={handleSearch} className="mx-auto flex max-w-2xl gap-2">
              <label htmlFor="header-search" className="sr-only">{t('common.search', 'Search the menu')}</label>
              <input
                id="header-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t('menu.search', 'Search biryani, rolls, momos…')}
                className="input-field py-2.5"
                autoFocus
              />
              <button type="submit" className="btn-primary px-5 py-2.5">
                {t('common.search', 'Search')}
              </button>
            </form>
          </div>
        )}

        {/* Mobile navigation */}
        <div
          id="mobile-menu"
          className={`overflow-hidden transition-[max-height,opacity] duration-300 lg:hidden ${
            isMobileMenuOpen ? 'max-h-[28rem] pb-5 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="flex flex-col gap-1 border-t border-surface-200 pt-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`rounded-xl px-4 py-3 text-base font-medium ${
                  location.pathname === link.path
                    ? 'bg-brand-50 text-brand-800'
                    : 'text-gray-700 hover:bg-surface-100'
                }`}
              >
                {t(link.key, link.path)}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link to="/menu" className="btn-primary py-3 text-sm">
                {t('common.orderNow', 'Order now')}
              </Link>
              <a
                href={`https://wa.me/${restaurantInfo.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
              >
                WhatsApp
              </a>
            </div>
            <p className="mt-3 px-2 text-sm text-gray-500">
              {restaurantInfo.address}
            </p>
          </div>
        </div>
      </nav>
    </header>
  );
}

// Cart Sidebar Component
export function CartSidebar() {
  const {
    cart,
    isOpen,
    setIsOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartHasRange,
  } = useCart();
  const { restaurantInfo, allItems, isSoldOut } = useSiteData();
  const { t } = useLanguage();

  const unavailable = useMemo(
    () => cart.filter((item) => isSoldOut(item.id)),
    [cart, isSoldOut],
  );

  const suggestions = useMemo(() => {
    const cartIds = new Set(cart.map((item) => String(item.id)));
    const available = allItems.filter(
      (item) => !cartIds.has(String(item.id)) && !isSoldOut(item.id),
    );
    const has = (categoryId) => cart.some((item) => item.categoryId === categoryId);
    const priority = [];
    if (!has('biriyani')) priority.push('biriyani');
    if (!has('roll')) priority.push('roll');
    if (!has('momos')) priority.push('momos');
    if (!has('non-veg-gravy') && !has('veg-gravy')) priority.push('non-veg-gravy');
    priority.push('combo', 'rice-noodles', 'chowmin');
    const ordered = [];
    priority.forEach((categoryId) => {
      available
        .filter((item) => item.categoryId === categoryId)
        .sort((a, b) => Number(Boolean(b.popular)) - Number(Boolean(a.popular)))
        .forEach((item) => {
          if (!ordered.some((entry) => String(entry.id) === String(item.id))) ordered.push(item);
        });
    });
    available
      .filter((item) => item.popular)
      .forEach((item) => {
        if (!ordered.some((entry) => String(entry.id) === String(item.id))) ordered.push(item);
      });
    return ordered.slice(0, 3);
  }, [allItems, cart, isSoldOut]);

  if (!isOpen) return null;

  const whatsappUrl = buildWhatsAppUrl(
    restaurantInfo.whatsapp,
    buildOrderMessage(cart, restaurantInfo),
  );

  const addSuggestion = (item) => {
    const option = getPriceOptions(item)[0];
    addToCart(
      {
        id: item.id,
        name: item.name,
        price: option?.display || item.price,
        portion: option?.label === 'Regular' ? '' : option?.label || '',
        image: item.image,
        vegetarian: item.vegetarian,
        categoryId: item.categoryId,
        cartKey: `${item.id}-${option?.label || 'Regular'}`,
      },
      1,
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Your takeaway order"
    >
      <button
        type="button"
        className="absolute inset-0 bg-gray-950/40"
        onClick={() => setIsOpen(false)}
        aria-label="Close cart"
      />

      <aside className="relative flex h-full w-full max-w-md flex-col bg-[#fffdf8] shadow-strong">
        <div className="flex items-start justify-between border-b border-surface-200 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              {t('nav.order', 'Your order')}
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-gray-900">
              {t('cart.title', 'Your basket')}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-full p-2 text-gray-500 hover:bg-surface-100 hover:text-gray-800"
            aria-label="Close cart"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-3xl">
                🛍️
              </div>
              <p className="font-display text-xl font-semibold text-gray-900">
                {t('common.emptyCart', 'Your basket is empty')}
              </p>
              <p className="mt-2 max-w-xs text-sm text-gray-500">
                {t(
                  'cart.emptyHint',
                  'Add a biryani, a roll or a plate of momos — then place your order in a few taps.',
                )}
              </p>
              <Link
                to="/menu"
                onClick={() => setIsOpen(false)}
                className="btn-primary mt-6"
              >
                {t('common.viewMenu', 'Browse the menu')}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {unavailable.length > 0 && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                  <p className="font-semibold">{t('cart.soldOutWarning', 'Some items are sold out.')}</p>
                  <p className="mt-1 text-xs">
                    {unavailable.map((item) => item.name).join(', ')}
                  </p>
                  <button
                    type="button"
                    onClick={() => unavailable.forEach((item) => removeFromCart(item.cartKey ?? item.id))}
                    className="mt-2 text-xs font-bold underline"
                  >
                    {t('common.remove', 'Remove them')}
                  </button>
                </div>
              )}
              {cart.map((item) => {
                const key = item.cartKey ?? item.id;
                return (
                <div key={key} className="flex gap-3 rounded-2xl border border-surface-200 bg-white p-3">
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-brand-50">
                    <FoodImage
                      src={item.image}
                      alt={item.name}
                      fallback={item.vegetarian ? '🥬' : '🍗'}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-gray-900">
                          {item.name}
                          {item.portion && (
                            <span className="ml-1 font-normal text-gray-500">({item.portion})</span>
                          )}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {item.price} {t('cart.each', 'each')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(key)}
                        className="p-1 text-gray-400 hover:text-rose-600"
                        aria-label={`Remove ${item.name}`}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(key, item.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-300 text-gray-600 hover:border-brand-500 hover:text-brand-700"
                          aria-label={`Decrease ${item.name} quantity`}
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(key, item.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-300 text-gray-600 hover:border-brand-500 hover:text-brand-700"
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-brand-800">
                        {formatINR(parsePrice(item.price) * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
                );
              })}
              <div className="flex items-center justify-between px-1 pt-1">
                <Link to="/menu" onClick={() => setIsOpen(false)} className="text-sm font-medium text-brand-700 hover:underline">
                  {t('cart.addMore', '+ Add more items')}
                </Link>
                <button type="button" onClick={clearCart} className="text-xs font-medium text-gray-500 hover:text-rose-600">
                  {t('cart.clear', 'Clear basket')}
                </button>
              </div>

              {suggestions.length > 0 && (
                <div className="rounded-2xl border border-brand-200 bg-brand-50/70 p-3">
                  <div className="mb-2">
                    <p className="text-sm font-bold text-brand-900">{t('cart.upsell', 'Complete your meal')}</p>
                    <p className="text-[11px] text-brand-700">{t('cart.upsellHint', 'A little something extra')}</p>
                  </div>
                  <div className="space-y-2">
                    {suggestions.map((item) => {
                      const option = getPriceOptions(item)[0];
                      return (
                        <div key={item.id} className="flex items-center gap-2 rounded-xl bg-white p-2">
                          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-brand-100">
                            <FoodImage
                              src={item.image}
                              alt={item.name}
                              fallback={item.vegetarian ? '🥬' : '🍗'}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-gray-900">{item.name}</p>
                            <p className="text-[11px] text-gray-500">
                              {option?.display || item.price}
                              {option?.label && option.label !== 'Regular' ? ` · ${option.label}` : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => addSuggestion(item)}
                            className="rounded-lg bg-brand-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-brand-700"
                          >
                            + {t('common.add', 'Add')}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="space-y-3 border-t border-surface-200 bg-white p-5">
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                {t('cart.items', '{count} items').replace(
                  '{count}',
                  cart.reduce((sum, item) => sum + item.quantity, 0),
                )}
              </span>
              <span>{formatINR(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-emerald-700">
              <span>{t('cart.fulfilment', 'Pickup / delivery')}</span>
              <span className="font-medium">
                {t('cart.chooseAtCheckout', 'Choose at checkout')}
              </span>
            </div>
            <div className="flex justify-between border-t border-dashed border-surface-300 pt-3 text-lg font-semibold text-gray-900">
              <span>{t('common.total', 'Total')}</span>
              <span>{formatINR(cartTotal)}</span>
            </div>
            {cartHasRange && (
              <p className="text-[11px] leading-relaxed text-gray-500">
                {t(
                  'cart.portionNote',
                  'Your chosen portions are included in the total. We’ll confirm availability on WhatsApp.',
                )}
              </p>
            )}

            {unavailable.length > 0 ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm font-semibold text-rose-800">
                {t('cart.soldOutWarning', 'Remove sold-out items before checkout.')}
              </div>
            ) : (
              <>
                <Link
                  to="/order"
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-700"
                >
                  {t('common.checkout', 'Continue to order')}
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                  {t('cart.sendWhatsApp', 'Or send directly on WhatsApp')}
                </a>
              </>
            )}
            <a
              href={`tel:${restaurantInfo.phoneRaw}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-brand-300 bg-brand-50 px-5 py-3 text-sm font-semibold text-brand-800"
            >
              {t('menu.callPhone', 'Call {phone}').replace('{phone}', restaurantInfo.phone)}
            </a>
            <p className="text-center text-[11px] text-gray-500">
              {t(
                'cart.payNote',
                'Pay at pickup or on delivery · Please wait for our confirmation before arriving.',
              )}
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
