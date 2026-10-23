import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import FoodImage from '../components/FoodImage';
import { useSiteData } from '../context/SiteDataContext';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { buildWhatsAppUrl } from '../utils/whatsapp';

const menuHighlights = [
  {
    categoryId: 'biriyani',
    icon: '🍚',
    title: 'Dum biryani',
    copy: 'Aromatic rice, warm spices and a slow-cooked finish. Choose chicken, egg or alu.',
  },
  {
    categoryId: 'roll',
    icon: '🌯',
    title: 'Fresh rolls',
    copy: 'Flaky paratha wraps made to order — egg, chicken or double egg chicken.',
  },
  {
    categoryId: 'momos',
    icon: '🥟',
    title: 'Momos',
    copy: 'Steamed, fried or pan-fried dumplings, served hot with a spicy dip.',
  },
  {
    categoryId: 'non-veg-gravy',
    icon: '🍗',
    title: 'Chicken gravies',
    copy: 'Kasha, butter masala, do piyaja and chilli chicken — made for rice or roti.',
  },
  {
    categoryId: 'rice',
    icon: '🍛',
    title: 'Rice & chowmein',
    copy: 'Everyday comfort food, from chicken fried rice to egg chicken chowmein.',
  },
  {
    categoryId: 'combo',
    icon: '🥡',
    title: 'Combo meals',
    copy: 'A full plate in one order — biryani or fried rice with a side and a cold drink.',
  },
];

const goodToKnow = [
  'Dine in with us or take your order away',
  'Local delivery around Belonia — charges and timing confirmed on WhatsApp',
  'Vegetarian and non-vegetarian dishes on the same menu',
  'Order by phone or WhatsApp; the kitchen is open every day',
];

export default function About() {
  const { categories, galleryImages, restaurantInfo } = useSiteData();
  const [storyRef, storyVisible] = useIntersectionObserver();
  const [menuRef, menuVisible] = useIntersectionObserver();
  const [visitRef, visitVisible] = useIntersectionObserver();

  useEffect(() => {
    document.title = `About ${restaurantInfo.name} | ${restaurantInfo.shortAddress || 'Belonia'}`;
    return () => {
      document.title = `${restaurantInfo.name} - Belonia's Favorite Restaurant | South Tripura`;
    };
  }, [restaurantInfo.name, restaurantInfo.shortAddress]);

  const highlights = menuHighlights
    .map((highlight) => {
      const category = categories.find((item) => item.id === highlight.categoryId);
      const dish = category?.items.find((item) => item.popular) || category?.items?.[0];
      return { ...highlight, category, dish };
    })
    .filter((highlight) => highlight.category);

  const storyImage = galleryImages[4]?.src || galleryImages[0]?.src;
  const menuImage = galleryImages[0]?.src || galleryImages[4]?.src;
  const whatsappUrl = buildWhatsAppUrl(
    restaurantInfo.whatsapp,
    `Hello ${restaurantInfo.name}! I'd like to know more about your menu and delivery.`,
  );

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="relative overflow-hidden border-b border-surface-200 bg-gradient-to-br from-[#fff6e6] via-[#fffdf8] to-[#f5ecdc] pb-14 pt-24 md:pb-20 md:pt-32">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-[32px] border-brand-100/70" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-64 w-64 rounded-full border-[28px] border-accent-100/60" aria-hidden="true" />
        <div className="section-container relative">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
              About {restaurantInfo.name}
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-gray-900 md:text-5xl">
              A neighbourhood kitchen at College Square.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-600 md:text-lg">
              Biryani, rolls, momos and everyday favourites — cooked for Belonia and served with a
              smile. Dine in, take away or order for local delivery.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-800">
                ★ {restaurantInfo.rating} on Google
              </span>
              <span className="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-800">
                {restaurantInfo.hours}
              </span>
              <span className="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-800">
                Dine-in · Takeaway · Delivery
              </span>
            </div>
          </div>
        </div>
      </header>

      <section ref={storyRef} className="bg-white py-16 md:py-20" aria-labelledby="story-heading">
        <div className="section-container">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className={storyVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}>
              <div className="overflow-hidden rounded-[2rem] border-4 border-white shadow-strong">
                <FoodImage
                  src={storyImage}
                  alt="Food at New Bawarchi 2"
                  fallback="🍽️"
                  className="h-72 w-full object-cover md:h-96"
                />
              </div>
            </div>

            <div className={storyVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'} style={{ animationDelay: '120ms' }}>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
                Our kitchen
              </p>
              <h2 id="story-heading" className="mt-2 font-display text-3xl font-semibold text-gray-900 md:text-4xl">
                Good food, made for everyday meals.
              </h2>
              <div className="mt-4 space-y-4 leading-relaxed text-gray-600">
                <p>
                  {restaurantInfo.name} is a casual restaurant at{' '}
                  {restaurantInfo.shortAddress || 'College Square, Belonia'}. Our kitchen serves
                  the {restaurantInfo.menuTitle || 'Bawarchi Puja Special'} menu — biryani, rolls,
                  momos, fried rice, chowmein, chicken and paneer gravies, starters and combo meals.
                </p>
                <p>
                  You can eat in, take your order away, or ask for delivery around Belonia. Call or
                  message us on WhatsApp and we will confirm the menu, delivery charge and timing
                  before you order.
                </p>
                <p>
                  We keep the menu straightforward and the prices listed clearly. Whether you are
                  planning a family lunch or picking up a quick roll, there is something hot waiting
                  in the kitchen.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/menu" className="btn-primary">
                  See the full menu
                </Link>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  Ask on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={menuRef} className="border-y border-surface-200 bg-surface-50 py-16 md:py-20" aria-labelledby="menu-heading">
        <div className="section-container">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
              What we serve
            </p>
            <h2 id="menu-heading" className="mt-2 font-display text-3xl font-semibold text-gray-900 md:text-4xl">
              The dishes Belonia comes back for
            </h2>
            <p className="mt-2 text-gray-600">
              A quick look at the menu. Prices and availability are shown on the full menu page.
            </p>
          </div>

          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((highlight, index) => (
              <article
                key={highlight.categoryId}
                className={`card overflow-hidden ${menuVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <Link to={`/menu?category=${highlight.categoryId}`} className="block">
                  <div className="relative h-40 overflow-hidden bg-brand-50">
                    <FoodImage
                      src={highlight.dish?.image || highlight.category.image}
                      alt={highlight.dish?.name || highlight.title}
                      fallback={highlight.icon}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-lg shadow-sm" aria-hidden="true">
                      {highlight.icon}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-xl font-semibold text-gray-900">
                        {highlight.category.name || highlight.title}
                      </h3>
                      <span className="text-xs font-semibold text-brand-700">View →</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">{highlight.copy}</p>
                    {highlight.dish && (
                      <p className="mt-3 text-sm font-semibold text-brand-800">
                        {highlight.dish.name} · {highlight.dish.price}
                      </p>
                    )}
                  </div>
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link to="/menu" className="btn-secondary">
              Browse all {categories.reduce((sum, category) => sum + category.items.length, 0)} dishes
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20" aria-labelledby="good-to-know-heading">
        <div className="section-container">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
                Good to know
              </p>
              <h2 id="good-to-know-heading" className="mt-2 font-display text-3xl font-semibold text-gray-900 md:text-4xl">
                Simple, the way it should be
              </h2>
              <p className="mt-3 leading-relaxed text-gray-600">
                No complicated ordering. Tell us what you would like, and we will take it from there.
              </p>
              <ul className="mt-6 space-y-3">
                {goodToKnow.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-800" aria-hidden="true">
                      ✓
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="overflow-hidden rounded-[2rem] border-4 border-white shadow-strong">
              <FoodImage
                src={menuImage}
                alt="A meal from New Bawarchi 2"
                fallback="🍛"
                className="h-72 w-full object-cover md:h-96"
              />
            </div>
          </div>
        </div>
      </section>

      <section ref={visitRef} className="bg-brand-700 py-16 text-white md:py-20" aria-labelledby="visit-heading">
        <div className="section-container">
          <div className={`mx-auto max-w-2xl text-center ${visitVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-200">
              Come say hello
            </p>
            <h2 id="visit-heading" className="mt-2 font-display text-3xl font-semibold md:text-4xl">
              Visit {restaurantInfo.name}
            </h2>
            <p className="mt-3 text-brand-100">
              You will find us at {restaurantInfo.address}. Walk in, call ahead or message us on
              WhatsApp.
            </p>
          </div>

          <div className="mx-auto mt-9 grid max-w-5xl gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-6">
              <span className="text-2xl" aria-hidden="true">📍</span>
              <h3 className="mt-3 font-display text-xl font-semibold">Find us</h3>
              <address className="mt-2 not-italic text-sm leading-relaxed text-brand-100">
                {restaurantInfo.address}
              </address>
              <a
                href={restaurantInfo.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex text-sm font-semibold text-brand-200 hover:text-white"
              >
                Get directions →
              </a>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-6">
              <span className="text-2xl" aria-hidden="true">🕒</span>
              <h3 className="mt-3 font-display text-xl font-semibold">Opening hours</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-100">{restaurantInfo.hours}</p>
              <p className="mt-2 text-xs text-brand-200">Call ahead for large groups or festive orders.</p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-6">
              <span className="text-2xl" aria-hidden="true">📞</span>
              <h3 className="mt-3 font-display text-xl font-semibold">Call or WhatsApp</h3>
              <div className="mt-2 space-y-1 text-sm text-brand-100">
                <a href={`tel:${restaurantInfo.phoneRaw}`} className="block hover:text-white">
                  {restaurantInfo.phone}
                </a>
                {restaurantInfo.phone2 && (
                  <a href={`tel:${restaurantInfo.phone2Raw}`} className="block hover:text-white">
                    {restaurantInfo.phone2}
                  </a>
                )}
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-stone-950 hover:bg-emerald-400"
              >
                Message on WhatsApp
              </a>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a
              href={restaurantInfo.googleListingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-200 hover:text-white"
            >
              ★ {restaurantInfo.rating} on Google — read reviews
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
