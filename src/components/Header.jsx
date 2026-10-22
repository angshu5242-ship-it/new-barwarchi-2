import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';

// Theme Context
const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/menu', label: 'Menu' },
  { path: '/gallery', label: 'Gallery' },
  { path: '/about', label: 'About' },
  { path: '/contact', label: 'Contact' },
];

// Cart Context
const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme: () => setTheme(t => t === 'light' ? 'dark' : 'light') }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('nb2_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('nb2_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsOpen(true);
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id, qty) => {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => setCart([]);
  const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price.replace(/[^0-9.]/g, '')) * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, isOpen, setIsOpen, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { cartCount, isOpen, setIsOpen } = useCart();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowSearch(false);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-surface-200'
          : 'bg-transparent'
      }`}
    >
      <nav className="section-container" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" aria-label="New Bawarchi 2 Home">
            <div className="w-10 h-10 rounded-lg bg-brand-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="font-display font-semibold text-xl md:text-2xl text-gray-900 hidden sm:block">New Bawarchi 2</span>
          </Link>

          {/* Desktop Search */}
          <div className={`hidden md:flex items-center gap-3 ${showSearch ? 'w-72' : 'w-0 overflow-hidden'} transition-all duration-300`}>
            <form onSubmit={handleSearch} className="flex items-center gap-2 w-full">
              <label htmlFor="header-search" className="sr-only">Search menu</label>
              <input
                id="header-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search biryani, rolls, fish..."
                className="w-full input-field bg-surface-50 border-surface-200 text-gray-900 placeholder-gray-500 pr-10"
                aria-label="Search menu"
              />
              <button type="submit" className="absolute right-3 text-gray-400 hover:text-brand-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  location.pathname === link.path
                    ? 'text-brand-600'
                    : 'text-gray-600 hover:text-brand-600'
                }`}
              >
                {link.label}
                {location.pathname === link.path && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500" aria-hidden="true" />
                )}
              </Link>
            ))}
            <Link to="/contact" className="btn-primary hidden sm:inline-flex">
              Order Online
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search Toggle (Mobile) */}
            <button
              className="md:hidden btn-ghost text-gray-600 hover:text-brand-600"
              onClick={() => setShowSearch(!showSearch)}
              aria-expanded={showSearch}
              aria-label={showSearch ? 'Close search' : 'Open search'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Mobile Search */}
            {showSearch && (
              <form onSubmit={handleSearch} className="fixed top-16 left-4 right-4 md:hidden z-40 animate-slide-down bg-white border border-surface-200 rounded-xl p-4 shadow-medium">
                <div className="flex gap-2">
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search menu..."
                    className="flex-1 input-field bg-surface-50 border-surface-200"
                    autoFocus
                    aria-label="Search menu"
                  />
                  <button type="submit" className="btn-primary">Search</button>
                </div>
              </form>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="btn-ghost text-gray-600 hover:text-brand-600 p-2"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Cart */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="relative btn-ghost text-gray-600 hover:text-brand-600 p-2"
              aria-label={`Cart ${cartCount > 0 ? `with ${cartCount} items` : 'empty'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden btn-ghost text-gray-600 hover:text-brand-600 p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          id="mobile-menu"
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'max-h-96 opacity-100 pb-6' : 'max-h-0 opacity-0'
          }`}
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-2 pt-4 border-t border-surface-200">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-3 text-base font-medium rounded-lg transition-colors ${
                  location.pathname === link.path
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-gray-600 hover:bg-surface-100 hover:text-brand-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/contact" className="btn-primary mt-2 mx-3 text-center">
              Order Online
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}

// Cart Sidebar Component
export function CartSidebar() {
  const { cart, isOpen, setIsOpen, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end md:justify-center" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <div className="fixed inset-0 bg-black/30" onClick={() => setIsOpen(false)} aria-hidden="true" />
      <div className="w-full md:w-96 lg:w-80 bg-white shadow-strong rounded-t-2xl md:rounded-xl h-full md:h-auto max-h-[90vh] flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-surface-200">
          <h2 className="font-display font-semibold text-xl text-gray-900">Your Order</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="btn-ghost text-gray-500 hover:text-gray-700 p-2"
            aria-label="Close cart"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
              <svg className="w-16 h-16 mb-4 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-lg font-medium text-gray-700 mb-2">Your cart is empty</p>
              <p className="text-sm mb-6">Add some delicious items from our menu!</p>
              <Link to="/menu" className="btn-primary" onClick={() => setIsOpen(false)}>
                Browse Menu
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 bg-surface-50 rounded-xl">
                  <div className="w-16 h-16 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <span className="text-2xl">🍽️</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.price}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg border border-surface-300 flex items-center justify-center text-gray-600 hover:bg-white hover:border-brand-500 hover:text-brand-600 transition-colors"
                        aria-label={`Decrease ${item.name} quantity`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="w-10 text-center font-semibold text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg border border-surface-300 flex items-center justify-center text-gray-600 hover:bg-white hover:border-brand-500 hover:text-brand-600 transition-colors"
                        aria-label={`Increase ${item.name} quantity`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="ml-auto text-gray-400 hover:text-red-500 transition-colors p-1"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-surface-200 p-4 md:p-6 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
              <span className="font-semibold text-gray-900">₹{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Delivery</span>
              <span className="font-medium">Free</span>
            </div>
            <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t border-surface-200">
              <span>Total</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={clearCart}
                className="flex-1 btn-secondary"
              >
                Clear Cart
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/contact');
                }}
                className="flex-1 btn-primary"
              >
                Checkout
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Minimum order ₹100 • Estimated delivery 30-45 mins
            </p>
          </div>
        )}
      </div>
    </div>
  );
}