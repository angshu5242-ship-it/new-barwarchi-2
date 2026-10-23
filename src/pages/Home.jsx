import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSiteData } from '../context/SiteDataContext';
import { useCart } from '../components/Header';
import FoodImage from '../components/FoodImage';
import OpenNowBadge from '../components/OpenNowBadge';
import { reviews } from '../data/reviews';
import { specialOffers } from '../data/site';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { getPriceOptions } from '../utils/price';

const craveCategories = [
  'biriyani',
  'roll',
  'momos',
  'chowmin',
  'non-veg-gravy',
  'veg-gravy',
];

function Stars({ rating = 5, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${star <= Math.round(rating) ? 'text-brand-500' : 'text-surface-300'} fill-current`}
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { restaurantInfo, categories, popularItems, activeHero, galleryImages, allItems } = useSiteData();
  const { addToCart } = useCart();
  const [reviewIndex, setReviewIndex] = useState(0);

  const totalDishes = allItems.length;
  const featuredCategories = useMemo(
    () =>
      craveCategories
        .map((id) => categories.find((category) => category.id === id))
        .filter(Boolean),
    [categories],
  );

  const review = reviews[reviewIndex % reviews.length];
  const reviewRating =
    (review.rating.food + review.rating.service + review.rating.atmosphere) / 3;
  const heroDish = useMemo(
    () =>
      allItems.find((item) => item.name === activeHero?.caption) ||
      allItems.find((item) => item.categoryId === 'biriyani') ||
      popularItems[0],
    [activeHero?.caption, allItems, popularItems],
  );

  useEffect(() => {
    document.title = `${restaurantInfo.menuTitle} | ${restaurantInfo.name} · Belonia`;
    return () => {
      document.title = `${restaurantInfo.name} - Belonia's Favorite Restaurant | South Tripura`;
    };
  }, [restaurantInfo.menuTitle, restaurantInfo.name]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setReviewIndex((index) => (index + 1) % reviews.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, []);

  const handlePopularClick = (dish) => {
    const options = getPriceOptions(dish);
    if (options.length > 1) {
      navigate(`/menu?category=${dish.categoryId || 'all'}`);
      return;
    }
    addToCart({
      ...dish,
      image: dish.image || dish.categoryImage,
      cartKey: `${dish.id}-${options[0].label}`,
      price: options[0].display,
      portion: '',
    });
  };

  const mosaicSmall = useMemo(() => {
    const seen = new Set(activeHero?.src ? [activeHero.src] : []);
    return popularItems
      .filter((item) => {
        if (!item.image || seen.has(item.image)) return false;
        seen.add(item.image);
        return true;
      })
      .slice(0, 2);
  }, [activeHero, popularItems]);

  return (
    <div className="bg-surface-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#fff5e3] via-[#fffdf8] to-[#f5ecdc] pb-16 pt-24 md:pb-20 md:pt-32">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full border-[40px] border-brand-100/70" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full border-[34px] border-accent-100/60" aria-hidden="true" />

        <div className="section-container relative">
          <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <OpenNowBadge />
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-800">
                  <Stars rating={Number(restaurantInfo.rating)} className="text-brand-500" />
                  {restaurantInfo.rating} · {restaurantInfo.reviewCount} reviews
                </span>
              </div>

              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
                {restaurantInfo.menuTitle} · College Square
              </p>
              <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-[1.06] text-gray-900 sm:text-5xl lg:text-6xl">
                Puja special flavours,
                <span className="block text-brand-700">good food, great mood.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-600 md:text-lg">
                Slow-cooked dum biryani, flaky rolls, steaming momos and the kind of gravies that
                bring everyone back for one more paratha. Order for pickup or delivery from College Square.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to="/menu" className="btn-primary">
                  Explore the Puja menu
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link to="/order" className="btn-secondary">
                  Start an order
                </Link>
              </div>

              <dl className="mt-9 grid max-w-lg grid-cols-3 gap-4 border-t border-brand-200/70 pt-5">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Dishes</dt>
                  <dd className="mt-0.5 font-display text-2xl font-semibold text-gray-900">{totalDishes}+</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Google</dt>
                  <dd className="mt-0.5 font-display text-2xl font-semibold text-gray-900">{restaurantInfo.rating}★</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Serving since</dt>
                  <dd className="mt-0.5 font-display text-2xl font-semibold text-gray-900">{restaurantInfo.since}</dd>
                </div>
              </dl>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="relative col-span-2 overflow-hidden rounded-[2rem] border-4 border-white bg-white shadow-strong">
                  <FoodImage
                    src={activeHero?.src}
                    alt={activeHero?.alt || 'Signature dish at New Bawarchi 2'}
                    loading="eager"
                    className="h-64 w-full object-cover sm:h-80"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-5 pt-20 text-white">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-200">
                      {activeHero?.caption || 'From our kitchen'}
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold">
                      {heroDish?.name || 'Chicken Dum Biriyani'}
                    </p>
                    <p className="mt-1 text-sm text-white/85">
                      {heroDish?.price || 'From ₹120'} · made fresh daily
                    </p>
                  </div>
                </div>

                {mosaicSmall.map((dish) => (
                  <Link
                    key={dish.id}
                    to={`/menu?category=${dish.categoryId || 'all'}`}
                    className="group relative overflow-hidden rounded-[1.4rem] border-4 border-white bg-white shadow-medium"
                  >
                    <FoodImage
                      src={dish.image}
                      alt={dish.name}
                      className="h-36 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-40"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-10 text-white">
                      <p className="text-xs font-semibold leading-tight">{dish.name}</p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="absolute -bottom-5 -left-3 flex items-center gap-3 rounded-2xl border border-brand-200 bg-white px-4 py-3 shadow-medium sm:-left-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-lg">⏰</span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-700">Kitchen hours</p>
                  <p className="text-sm font-semibold text-gray-900">8 AM – 10 PM daily</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick promises */}
      <section className="border-y border-surface-200 bg-white">
        <div className="section-container">
          <div className="grid grid-cols-2 divide-x divide-surface-200 md:grid-cols-4">
            {[
              { icon: '🍽️', title: 'Dine in', copy: 'Cosy, casual seating' },
              { icon: '🥡', title: 'Takeaway', copy: 'Packed fresh, ready fast' },
              { icon: '💳', title: 'Easy payment', copy: 'Cash, UPI & cards' },
              { icon: '👨‍👩‍👧', title: 'Family friendly', copy: 'Veg & non-veg menus' },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3 px-2 py-5 sm:px-5">
                <span className="text-2xl" aria-hidden="true">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular dishes */}
      <section className="py-16 md:py-20">
        <div className="section-container">
          <div className="mb-9 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Ordered again and again</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-gray-900 md:text-4xl">
                The ones people come back for
              </h2>
              <p className="mt-2 max-w-2xl text-gray-600">
                If it’s your first time, start here. These are the plates that leave the kitchen most often.
              </p>
            </div>
            <Link to="/menu" className="btn-secondary self-start md:self-auto">
              See all {totalDishes} dishes
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {popularItems.slice(0, 4).map((dish) => {
              const multiPrice = getPriceOptions(dish).length > 1;
              return (
                <article
                  key={dish.id}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-medium"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-brand-50">
                    <FoodImage
                      src={dish.image}
                      alt={dish.name}
                      fallback={dish.vegetarian ? '🥬' : '🍗'}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-brand-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-950">
                      ★ Popular
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                      {dish.categoryName}
                    </p>
                    <h3 className="mt-1 font-display text-xl font-semibold text-gray-900">{dish.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-500">{dish.description}</p>
                    <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                      <span className="text-lg font-bold text-brand-800">{dish.price}</span>
                      <button
                        type="button"
                        onClick={() => handlePopularClick(dish)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-brand-700"
                      >
                        {multiPrice ? 'Choose' : 'Add'}
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Craving categories */}
      <section className="bg-white py-16 md:py-20">
        <div className="section-container">
          <div className="mb-9 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Find your craving</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-gray-900 md:text-4xl">
              What are you in the mood for?
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {featuredCategories.map((category) => (
              <Link
                key={category.id}
                to={`/menu?category=${category.id}`}
                className="group relative overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-soft"
              >
                <FoodImage
                  src={category.image}
                  alt={category.name}
                  fallback={category.icon}
                  className="h-36 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-44"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 text-white">
                  <div>
                    <p className="font-display text-lg font-semibold leading-tight">{category.name}</p>
                    <p className="text-xs text-white/70">{category.items.length} dishes</p>
                  </div>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm transition-colors group-hover:bg-white group-hover:text-stone-900">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-7 text-center">
            <Link to="/menu" className="text-sm font-semibold text-brand-700 hover:underline">
              Browse all {categories.length} categories →
            </Link>
          </div>
        </div>
      </section>

      {/* Offers */}
      <section className="py-16 md:py-20">
        <div className="section-container">
          <div className="mb-9 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Good food, good value</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-gray-900 md:text-4xl">
                Made for lunch breaks & lazy evenings
              </h2>
            </div>
            <Link to="/menu?category=combo" className="text-sm font-semibold text-brand-700 hover:underline">
              See combo meals →
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {specialOffers.map((offer) => (
              <Link
                key={offer.id}
                to={offer.link}
                className="group relative min-h-64 overflow-hidden rounded-3xl border border-surface-200 bg-stone-900 shadow-medium"
              >
                <FoodImage
                  src={offer.image}
                  alt={offer.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/55 to-stone-950/5" />
                <div className="relative flex h-full min-h-64 flex-col justify-end p-6 text-white">
                  <span className="w-fit rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-200">
                    {offer.tag}
                  </span>
                  <h3 className="mt-3 font-display text-2xl font-semibold">{offer.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/80">{offer.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-display text-xl font-semibold text-brand-300">{offer.price}</span>
                    <span className="text-sm font-semibold text-white transition-transform group-hover:translate-x-1">
                      View →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="border-y border-surface-200 bg-white py-16 md:py-20">
        <div className="section-container">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="relative">
              <div className="overflow-hidden rounded-[2rem] border-4 border-white shadow-strong">
                <FoodImage
                  src={galleryImages[4]?.src || galleryImages[0]?.src}
                  alt="Inside New Bawarchi 2"
                  fallback="🏮"
                  className="h-72 w-full object-cover md:h-96"
                />
              </div>
              <div className="absolute -bottom-5 right-4 max-w-[13rem] rounded-2xl border border-brand-200 bg-white p-4 shadow-medium sm:right-8">
                <p className="font-display text-3xl font-semibold text-brand-700">{restaurantInfo.since}</p>
                <p className="text-xs leading-relaxed text-gray-500">
                  Serving Belonia from College Square with a kitchen that never cuts corners.
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Our story</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-gray-900 md:text-4xl">
                A neighbourhood kitchen, not a chain.
              </h2>
              <p className="mt-4 leading-relaxed text-gray-600">
                New Bawarchi 2 grew out of a simple idea: serve the food we cook for our own
                family, at prices our neighbours can come back to. The biryani is layered and
                slow-cooked. The rolls are made when you order. The chai is always on.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Fresh ingredients, prepped in-house every day',
                  'Separate veg and non-veg preparation',
                  'Takeaway packed to travel — or eat in with us',
                  'Friendly service and honest portions',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-800">✓</span>
                    {point}
                  </li>
                ))}
              </ul>
              <Link to="/about" className="btn-secondary mt-7">
                Read our story
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16 md:py-20">
        <div className="section-container">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">From our guests</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-gray-900 md:text-4xl">
              Kind words from Belonia
            </h2>
            <p className="mt-2 text-gray-600">A few of the reviews that make the long days worth it.</p>
          </div>

          <div className="mx-auto mt-9 max-w-3xl">
            <article className="rounded-3xl border border-surface-200 bg-white p-7 shadow-soft md:p-10">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 font-display text-xl font-semibold text-brand-800">
                  {review.avatar}
                </div>
                <Stars rating={reviewRating} className="mt-4" />
                <blockquote className="mt-4 font-display text-xl leading-relaxed text-gray-800 md:text-2xl">
                  “{review.comment}”
                </blockquote>
                <p className="mt-5 font-semibold text-gray-900">{review.author}</p>
                <p className="text-sm text-gray-500">{review.source} review · {review.date}</p>
              </div>

              <div className="mt-7 flex items-center justify-between gap-4 border-t border-surface-200 pt-5">
                <button
                  type="button"
                  onClick={() => setReviewIndex((index) => (index - 1 + reviews.length) % reviews.length)}
                  className="rounded-full border border-surface-200 p-2 text-gray-600 hover:border-brand-300 hover:text-brand-700"
                  aria-label="Previous review"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex gap-1.5" role="tablist" aria-label="Choose a review">
                  {reviews.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={index === reviewIndex}
                      onClick={() => setReviewIndex(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === reviewIndex ? 'w-7 bg-brand-600' : 'w-2 bg-surface-300 hover:bg-brand-300'
                      }`}
                      aria-label={`Review ${index + 1}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setReviewIndex((index) => (index + 1) % reviews.length)}
                  className="rounded-full border border-surface-200 p-2 text-gray-600 hover:border-brand-300 hover:text-brand-700"
                  aria-label="Next review"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </article>

            <div className="mt-6 text-center">
              <a
                href="https://www.google.com/search?q=New+Bawarchi+2+Belonia+reviews"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-brand-700 hover:underline"
              >
                Read all reviews on Google →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery teaser */}
      <section className="bg-white py-16 md:py-20">
        <div className="section-container">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">A peek inside</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-gray-900 md:text-4xl">
                Come hungry. Stay a while.
              </h2>
            </div>
            <Link to="/gallery" className="text-sm font-semibold text-brand-700 hover:underline">
              View the gallery →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {galleryImages.slice(0, 4).map((image) => (
              <Link
                key={image.id}
                to="/gallery"
                className="group relative aspect-square overflow-hidden rounded-2xl bg-surface-100"
              >
                <FoodImage
                  src={image.src}
                  alt={image.alt || image.caption}
                  fallback="🏮"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-stone-950/0 transition-colors group-hover:bg-stone-950/20" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Visit / reserve CTA */}
      <section className="relative overflow-hidden bg-[#1c1917] py-16 text-white md:py-20">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-[32px] border-brand-500/10" aria-hidden="true" />
        <div className="section-container relative">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-300">Come say hello</p>
              <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
                Lunch, dinner or a table full of friends.
              </h2>
              <p className="mt-3 max-w-xl leading-relaxed text-gray-300">
                Find us at College Square, Belonia. Walk in for dine-in, call ahead for takeaway,
                or message us on WhatsApp and we’ll get the kitchen ready.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
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
                <Link to="/contact#reserve" className="btn-secondary border-brand-300 bg-brand-100 text-brand-900">
                  Reserve a table
                </Link>
                <a
                  href={`tel:${restaurantInfo.phoneRaw}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5"
                >
                  Call {restaurantInfo.phone}
                </a>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-300">📍</span>
                  <div>
                    <p className="font-semibold text-white">Find us</p>
                    <p className="mt-0.5 text-gray-300">{restaurantInfo.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-300">🕗</span>
                  <div>
                    <p className="font-semibold text-white">Hours</p>
                    <p className="mt-0.5 text-gray-300">{restaurantInfo.hours}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-300">📞</span>
                  <div>
                    <p className="font-semibold text-white">Call ahead</p>
                    <a href={`tel:${restaurantInfo.phoneRaw}`} className="mt-0.5 block text-gray-300 hover:text-brand-300">
                      {restaurantInfo.phone}
                    </a>
                  </div>
                </div>
              </div>
              <a
                href={restaurantInfo.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-stone-900 hover:bg-brand-50"
              >
                Get directions
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
