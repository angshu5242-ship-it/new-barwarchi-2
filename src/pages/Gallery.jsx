import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSiteData } from '../context/SiteDataContext';
import FoodImage from '../components/FoodImage';

export default function Gallery() {
  const { galleryImages, restaurantInfo } = useSiteData();
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedIndex, setSelectedIndex] = useState(null);

  const categories = useMemo(() => {
    const unique = [...new Set(galleryImages.map((image) => image.category).filter(Boolean))];
    return ['all', ...unique];
  }, [galleryImages]);

  const filteredImages = useMemo(
    () =>
      activeCategory === 'all'
        ? galleryImages
        : galleryImages.filter((image) => image.category === activeCategory),
    [activeCategory, galleryImages],
  );

  const selectedImage = selectedIndex === null ? null : filteredImages[selectedIndex];

  const closeLightbox = () => setSelectedIndex(null);
  const nextImage = () =>
    setSelectedIndex((index) => (index === null ? null : (index + 1) % filteredImages.length));
  const prevImage = () =>
    setSelectedIndex((index) =>
      index === null ? null : (index - 1 + filteredImages.length) % filteredImages.length,
    );

  useEffect(() => {
    if (selectedIndex === null) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowRight') nextImage();
      if (event.key === 'ArrowLeft') prevImage();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedIndex, filteredImages.length]);

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="border-b border-surface-200 bg-[#fffdf8] pb-10 pt-24 md:pb-14 md:pt-32">
        <div className="section-container">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
              From our kitchen & dining room
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold text-gray-900 md:text-5xl">
              A little look inside
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-gray-600">
              Fresh plates, warm lights and the everyday moments that make New Bawarchi 2 feel
              like Belonia’s own dining room.
            </p>
            <p className="mt-4 text-sm font-medium text-gray-500">
              {galleryImages.length} photos and counting
            </p>
          </div>
        </div>
      </header>

      <div className="sticky top-16 z-30 border-b border-surface-200 bg-[#fffdf8] md:top-20">
        <div className="section-container">
          <div className="flex gap-2 overflow-x-auto py-4" role="tablist" aria-label="Gallery categories">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={activeCategory === category}
                onClick={() => {
                  setActiveCategory(category);
                  setSelectedIndex(null);
                }}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  activeCategory === category
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-100 text-gray-700 hover:bg-brand-100 hover:text-brand-800'
                }`}
              >
                {category === 'all' ? 'All photos' : category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="section-container py-10 md:py-14">
        {filteredImages.length > 0 ? (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {filteredImages.map((image, index) => (
              <figure key={image.id ?? index} className="mb-4 break-inside-avoid">
                <button
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className="group relative block w-full overflow-hidden rounded-2xl border border-surface-200 bg-white text-left shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-medium"
                  aria-label={`View ${image.caption || image.alt || 'photo'} in full size`}
                >
                  <FoodImage
                    src={image.src}
                    alt={image.alt || image.caption || 'New Bawarchi 2'}
                    fallback="🏮"
                    className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-3 p-5 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <span className="block font-display text-lg font-semibold">
                      {image.caption || image.alt}
                    </span>
                    <span className="mt-0.5 block text-xs uppercase tracking-[0.16em] text-white/80">
                      {image.category}
                    </span>
                  </span>
                  <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                    </svg>
                  </span>
                </button>
              </figure>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-5xl">📷</p>
            <h2 className="mt-4 font-display text-2xl font-semibold text-gray-900">No photos here yet</h2>
            <p className="mt-2 text-gray-500">Try another category — the kitchen is always busy.</p>
          </div>
        )}

        <div className="mt-12 rounded-3xl border border-brand-200 bg-brand-50 p-7 text-center md:p-10">
          <h2 className="font-display text-2xl font-semibold text-gray-900">Tag your food photos</h2>
          <p className="mx-auto mt-2 max-w-xl text-gray-600">
            Share your New Bawarchi 2 moments and tag us. We love seeing your favourites on our
            feed — and we might feature you next.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={restaurantInfo.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Find us on Instagram
            </a>
            <Link to="/menu" className="btn-secondary">Order your favourite</Link>
          </div>
        </div>
      </main>

      {selectedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-title"
          onClick={closeLightbox}
        >
          <button
            type="button"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-800 shadow-lg hover:bg-gray-100"
            onClick={closeLightbox}
            aria-label="Close photo"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {filteredImages.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                prevImage();
              }}
              className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-800 shadow-lg hover:bg-gray-100 md:left-6"
              aria-label="Previous photo"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <figure
            className="w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={selectedImage.src}
              alt={selectedImage.alt || selectedImage.caption || 'New Bawarchi 2'}
              className="mx-auto max-h-[78vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
            <figcaption className="mt-4 text-center text-white">
              <span id="lightbox-title" className="block font-display text-xl font-semibold">
                {selectedImage.caption || selectedImage.alt}
              </span>
              <span className="mt-1 block text-sm capitalize text-brand-300">
                {selectedImage.category} · {selectedIndex + 1} / {filteredImages.length}
              </span>
            </figcaption>
          </figure>

          {filteredImages.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                nextImage();
              }}
              className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-800 shadow-lg hover:bg-gray-100 md:right-6"
              aria-label="Next photo"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
