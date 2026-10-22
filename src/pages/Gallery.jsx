import { useState } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { galleryImages, galleryCategories } from '../data/gallery';

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const [galleryRef, galleryVisible] = useIntersectionObserver();
  const [currentIndex, setCurrentIndex] = useState(0);

  const filteredImages = activeCategory === 'all'
    ? galleryImages
    : galleryImages.filter(img => img.category === activeCategory);

  const openLightbox = (image, index) => {
    setSelectedImage(image);
    setCurrentIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    document.body.style.overflow = '';
  };

  const nextImage = () => {
    const next = (currentIndex + 1) % filteredImages.length;
    setSelectedImage(filteredImages[next]);
    setCurrentIndex(next);
  };

  const prevImage = () => {
    const prev = (currentIndex - 1 + filteredImages.length) % filteredImages.length;
    setSelectedImage(filteredImages[prev]);
    setCurrentIndex(prev);
  };

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Page Header */}
      <header className="bg-white border-b border-surface-200 pt-20 pb-12">
        <div className="section-container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display font-semibold text-3xl md:text-4xl lg:text-5xl text-gray-900 mb-4">
              Gallery
            </h1>
            <p className="text-lg text-gray-600">
              Take a visual tour of our restaurant, dishes, and the memorable moments we create.
            </p>
          </div>
        </div>
      </header>

      {/* Category Filter */}
      <div className="sticky top-20 z-40 bg-white border-b border-surface-200">
        <div className="section-container">
          <div className="flex flex-wrap gap-2 md:gap-3 py-4 justify-center" role="tablist">
            {galleryCategories.map((category) => (
              <button
                key={category}
                role="tab"
                aria-selected={activeCategory === category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 capitalize ${
                  activeCategory === category
                    ? 'bg-brand-500 text-white'
                    : 'bg-surface-100 text-gray-700 hover:bg-brand-100 hover:text-brand-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <main ref={galleryRef} className="section-container py-12">
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${galleryVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          {filteredImages.map((image, index) => (
            <article
              key={image.id}
              className="group relative overflow-hidden rounded-xl cursor-pointer aspect-[4/3]"
              onClick={() => openLightbox(image, index)}
              onKeyDown={(e) => e.key === 'Enter' && openLightbox(image, index)}
              tabIndex={0}
              role="button"
              aria-label={`View ${image.alt}`}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <div className="w-full text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="font-semibold text-lg">{image.caption}</h3>
                  <p className="text-sm opacity-90 capitalize">{image.category}</p>
                </div>
              </div>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:text-brand-600 transition-colors shadow-lg"
                  onClick={(e) => { e.stopPropagation(); openLightbox(image, index); }}
                  aria-label={`View ${image.caption} in full size`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </article>
          ))}
        </div>

        {filteredImages.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-surface-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No images found</h3>
            <p className="text-gray-500">No images available in this category.</p>
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-title"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="relative max-w-5xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-4 text-center text-white">
              <h2 id="lightbox-title" className="font-display font-semibold text-xl">{selectedImage.caption}</h2>
              <p className="text-brand-300 capitalize">{selectedImage.category}</p>
            </div>
          </div>

          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors hidden md:block"
            aria-label="Previous image"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors hidden md:block"
            aria-label="Next image"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Keyboard hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-white/70 text-sm hidden md:flex">
            <kbd className="px-2 py-1 bg-white/10 rounded">←</kbd>
            <span>Previous</span>
            <kbd className="px-2 py-1 bg-white/10 rounded">→</kbd>
            <span>Next</span>
            <kbd className="px-2 py-1 bg-white/10 rounded">Esc</kbd>
            <span>Close</span>
          </div>
        </div>
      )}
    </div>
  );
}