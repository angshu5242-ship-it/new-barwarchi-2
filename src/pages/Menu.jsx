import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { menuCategories, getMenuCategories } from '../data/menu';
import { Link } from 'react-router-dom';
import { useCart } from '../components/Header';

const dietOptions = [
  { id: 'all', label: 'All', icon: '🍽️' },
  { id: 'vegetarian', label: 'Vegetarian', icon: '🌱' },
  { id: 'non-veg', label: 'Non-Veg', icon: '🍗' },
  { id: 'popular', label: 'Popular', icon: '⭐' },
  { id: 'spicy', label: 'Spicy', icon: '🌶️' },
];

const sortOptions = [
  { id: 'default', label: 'Recommended' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'price-high', label: 'Price: High to Low' },
  { id: 'name', label: 'Name A-Z' },
];

export default function Menu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState(() => {
    const cat = searchParams.get('category');
    return cat || menuCategories[0].id;
  });
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [activeDiet, setActiveDiet] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [menuRef, menuVisible] = useIntersectionObserver();
  const { addToCart } = useCart();
  const [showAddedToast, setShowAddedToast] = useState(null);

  useEffect(() => {
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    if (category) setActiveCategory(category);
    if (search) setSearchQuery(search);
  }, [searchParams]);

  const currentCategory = menuCategories.find(cat => cat.id === activeCategory);

  // Get all items from current category
  let items = useMemo(() => {
    if (!currentCategory) return [];
    let filtered = [...currentCategory.items];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    }

    // Apply diet filter
    if (activeDiet === 'vegetarian') {
      filtered = filtered.filter(item => item.vegetarian);
    } else if (activeDiet === 'non-veg') {
      filtered = filtered.filter(item => !item.vegetarian);
    } else if (activeDiet === 'popular') {
      filtered = filtered.filter(item => item.popular);
    } else if (activeDiet === 'spicy') {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes('chilli') ||
        item.name.toLowerCase().includes('spicy') ||
        item.description.toLowerCase().includes('spicy')
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => {
          const priceA = parseFloat(a.price.replace(/[^0-9.]/g, ''));
          const priceB = parseFloat(b.price.replace(/[^0-9.]/g, ''));
          return priceA - priceB;
        });
        break;
      case 'price-high':
        filtered.sort((a, b) => {
          const priceA = parseFloat(a.price.replace(/[^0-9.]/g, ''));
          const priceB = parseFloat(b.price.replace(/[^0-9.]/g, ''));
          return priceB - priceA;
        });
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // Keep original order (popular first)
        filtered.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
    }

    return filtered;
  }, [currentCategory, searchQuery, activeDiet, sortBy]);

  const handleAddToCart = (item) => {
    addToCart(item);
    setShowAddedToast(item.name);
    setTimeout(() => setShowAddedToast(null), 2000);
  };

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    setSearchParams({ category: categoryId }, { replace: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ search: searchQuery.trim(), category: activeCategory }, { replace: true });
  };

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Page Header */}
      <header className="bg-white border-b border-surface-200 pt-20 pb-12">
        <div className="section-container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display font-semibold text-3xl md:text-4xl lg:text-5xl text-gray-900 mb-4">
              Our Menu
            </h1>
            <p className="text-lg text-gray-600">
              Discover our wide selection of authentic Bengali & Indian dishes, Indo-Chinese favorites, 
              and delicious street food classics.
            </p>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-white border-b border-surface-200 sticky top-20 z-30">
        <div className="section-container py-4">
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
            <div className="relative">
              <label htmlFor="menu-search" className="sr-only">Search menu</label>
              <input
                id="menu-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search biryani, rolls, fish curry, momos..."
                className="w-full input-field bg-surface-50 border-surface-200 pl-12 pr-4 text-gray-900 placeholder-gray-500"
                aria-label="Search menu items"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSearchParams({ category: activeCategory }, { replace: true }); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Category Navigation */}
      <nav className="sticky top-28 z-40 bg-white border-b border-surface-200" aria-label="Menu categories">
        <div className="section-container">
          <div className="flex flex-wrap gap-2 md:gap-3 py-4 overflow-x-auto pb-4 -mx-4 px-4" role="tablist">
            {menuCategories.map((category) => (
              <button
                key={category.id}
                role="tab"
                aria-selected={activeCategory === category.id}
                aria-controls={`panel-${category.id}`}
                id={`tab-${category.id}`}
                onClick={() => handleCategoryChange(category.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeCategory === category.id
                    ? 'bg-brand-500 text-white shadow-lg'
                    : 'bg-surface-100 text-gray-700 hover:bg-brand-100 hover:text-brand-600'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Filters & Sort */}
      <div className="bg-white border-b border-surface-200 sticky top-36 z-30">
        <div className="section-container py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Diet Filters */}
            <div className="flex flex-wrap gap-2" role="group" aria-label="Dietary filters">
              {dietOptions.map((diet) => (
                <button
                  key={diet.id}
                  onClick={() => setActiveDiet(diet.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    activeDiet === diet.id
                      ? 'bg-brand-500 text-white'
                      : 'bg-surface-100 text-gray-700 hover:bg-brand-100 hover:text-brand-600'
                  }`}
                  aria-pressed={activeDiet === diet.id}
                >
                  <span>{diet.icon}</span>
                  <span>{diet.label}</span>
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-sm text-gray-600">Sort by:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field bg-surface-50 border-surface-200 text-gray-900 py-1.5 px-3 text-sm appearance-none"
                aria-label="Sort menu items"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <main ref={menuRef} className="section-container py-12" role="tabpanel" id={`panel-${activeCategory}`} aria-labelledby={`tab-${activeCategory}`}>
        {currentCategory && (
          <div className={`max-w-4xl mx-auto ${menuVisible ? 'animate-fade-in' : 'opacity-0'}`}>
            {/* Category Header */}
            <div className="mb-8 text-center">
              <h2 className="font-display font-semibold text-2xl md:text-3xl text-gray-900 mb-2">
                {currentCategory.name}
              </h2>
              <p className="text-gray-600">{currentCategory.description}</p>
              {searchQuery && (
                <p className="text-sm text-brand-600 mt-2">
                  Showing {items.length} result{items.length !== 1 ? 's' : ''} for "{searchQuery}"
                </p>
              )}
              {activeDiet !== 'all' && !searchQuery && (
                <p className="text-sm text-brand-600 mt-2">
                  Filtered by: {dietOptions.find(d => d.id === activeDiet)?.label}
                </p>
              )}
            </div>

            {/* Menu Items */}
            {items.length > 0 ? (
              <div className="space-y-4" role="list">
                {items.map((item, index) => (
                  <article
                    key={item.id}
                    role="listitem"
                    className={`card p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-4 group ${menuVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'} hover:shadow-medium`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Item Image Placeholder */}
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <span className="text-3xl md:text-4xl">{
                        item.name.toLowerCase().includes('biryani') ? '🍚' :
                        item.name.toLowerCase().includes('roll') ? '🌯' :
                        item.name.toLowerCase().includes('momo') ? '🥟' :
                        item.name.toLowerCase().includes('chow') || item.name.toLowerCase().includes('noodle') ? '🍜' :
                        item.name.toLowerCase().includes('rice') ? '🍚' :
                        item.name.toLowerCase().includes('soup') ? '🍲' :
                        item.name.toLowerCase().includes('bread') || item.name.toLowerCase().includes('roti') || item.name.toLowerCase().includes('paratha') ? '🫓' :
                        item.name.toLowerCase().includes('salad') ? '🥗' :
                        item.vegetarian ? '🥬' : '🍗'
                      }</span>
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <h3 className="font-display font-semibold text-lg md:text-xl text-gray-900 truncate">
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-1.5">
                            {item.popular && <span className="badge badge-popular">⭐ Popular</span>}
                            {item.vegetarian ? <span className="badge badge-veg">🌱 Veg</span> : <span className="badge badge-nonveg">🍗 Non-Veg</span>}
                            {item.name.toLowerCase().includes('chilli') && <span className="badge badge-spicy">🌶️ Spicy</span>}
                          </div>
                        </div>
                        <span className="font-display font-bold text-xl text-brand-600 whitespace-nowrap flex-shrink-0">
                          {item.price}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="btn-primary w-full md:w-auto md:flex-shrink-0 group-hover:bg-brand-600"
                      aria-label={`Add ${item.name} to cart - ${item.price}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add to Cart
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <svg className="w-16 h-16 mx-auto text-surface-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No items found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
                <button
                  onClick={() => { setSearchQuery(''); setActiveDiet('all'); }}
                  className="btn-secondary"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Dietary Info */}
      <section className="py-12 bg-white border-t border-surface-200">
        <div className="section-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-xl">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-medium text-green-800">Vegetarian Friendly</h3>
                <p className="text-green-700 text-sm">Wide variety of veg dishes available</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <svg className="w-6 h-6 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-medium text-amber-800">Quick Service</h3>
                <p className="text-amber-700 text-sm">Freshly prepared, served hot</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <h3 className="font-medium text-blue-800">Takeaway Available</h3>
                <p className="text-blue-700 text-sm">Packed fresh for your convenience</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-brand-50 to-accent-50">
        <div className="section-container text-center">
          <h2 className="font-display font-semibold text-3xl md:text-4xl text-gray-900 mb-4">
            Ready to Order?
          </h2>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            Visit us for dine-in or order for takeaway. We're open daily from 8 AM to 10 PM.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/contact" className="btn-primary bg-gray-900 text-white hover:bg-gray-800 w-full sm:w-auto">
              Find Us & Order
            </Link>
            <a href="tel:+919366986853" className="inline-flex items-center gap-2 px-8 py-3 text-lg font-medium text-brand-600 bg-white border-2 border-brand-300 rounded-xl hover:bg-brand-50 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call +91 93669 86853
            </a>
            <a href="/menu-print" target="_blank" className="btn-secondary border-brand-300 text-brand-600 hover:bg-brand-50 w-full sm:w-auto">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Menu
            </a>
          </div>
        </div>
      </section>

      {/* Added to Cart Toast */}
      {showAddedToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up bg-gray-900 text-white px-6 py-4 rounded-xl shadow-strong flex items-center gap-3">
          <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{showAddedToast} added to cart!</span>
        </div>
      )}
    </div>
  );
}