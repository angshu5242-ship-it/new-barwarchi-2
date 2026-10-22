import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { getAverageRating, getTotalReviews } from '../data/reviews';
import { getPopularItems } from '../data/menu';
import { useCart } from '../components/Header';

export default function Home() {
  const [heroRef, heroVisible] = useIntersectionObserver({ threshold: 0.1 });
  const [statsRef, statsVisible] = useIntersectionObserver({ threshold: 0.1 });
  const [featuresRef, featuresVisible] = useIntersectionObserver({ threshold: 0.1 });
  const [ctaRef, ctaVisible] = useIntersectionObserver({ threshold: 0.1 });
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [testimonialsRef, testimonialsVisible] = useIntersectionObserver({ threshold: 0.1 });

  const avgRating = getAverageRating();
  const totalReviews = getTotalReviews();
  const popularItems = getPopularItems().slice(0, 4);
  const { addToCart } = useCart();

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      title: 'Authentic Bengali Flavors',
      description: 'Traditional recipes from Bengal, prepared with fresh ingredients & mustard, poppy seed, coconut flavors.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: 'Prime Location',
      description: 'College Square, Belonia, South Tripura - easy to find, hard to forget.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      title: 'Customer Favorite',
      description: 'Rated 4.3/5 on Google. Loved for biryani, rolls, fish curry & friendly service since 2023.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'All-Day Dining',
      description: 'Open daily 8 AM - 10 PM. Breakfast, lunch, dinner & late-night takeaway available.',
    },
  ];

  const testimonials = [
    {
      author: 'Chiranjit Majumder',
      role: 'Local Foodie',
      rating: 5,
      text: 'Best biryani in town! The Chicken Dum Biryani is perfectly cooked with aromatic spices. The rolls are also amazing - crispy paratha with generous fillings.',
      avatar: 'CM',
    },
    {
      author: 'Priya Das',
      role: 'Regular Customer',
      rating: 5,
      text: 'Great place for vegetarian options too! The Paneer Butter Masala and Veg Fried Rice were delicious. Staff is very courteous and the place is clean.',
      avatar: 'PD',
    },
    {
      author: 'Amit Singh',
      role: 'Food Blogger',
      rating: 4,
      text: 'Best chilli chicken in Belonia! The Indo-Chinese section is amazing. Tried the schezwan fried rice and hakka noodles - both were excellent.',
      avatar: 'AS',
    },
  ];

  const goToTestimonial = useCallback((index) => {
    setTestimonialIndex(index);
  }, []);

  const nextTestimonial = useCallback(() => {
    setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prevTestimonial = useCallback(() => {
    setTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(nextTestimonial, 5000);
    return () => clearInterval(interval);
  }, [nextTestimonial]);

  const handleAddToCart = (item) => {
    addToCart(item);
  };

  return (
    <>
      <div ref={heroRef} className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-50 via-white to-brand-50">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-200/50 rounded-full" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-200/50 rounded-full" />
        </div>

        <div className="section-container relative py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-brand-200 text-brand-700 text-sm font-medium mb-8 animate-fade-in ${heroVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
              </span>
              <span>#1 Restaurant in Belonia • 4.3★ Google Rating</span>
            </div>

            <h1 className={`font-display font-semibold text-4xl md:text-5xl lg:text-6xl text-gray-900 leading-tight mb-6 animate-fade-in ${heroVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`} style={{ animationDelay: '100ms' }}>
              Belonia's Favorite
              <br />
              <span className="text-brand-600">Restaurant</span>
            </h1>

            <p className={`text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto animate-fade-in ${heroVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`} style={{ animationDelay: '200ms' }}>
              Experience authentic Bengali & Indian cuisine in a warm, welcoming atmosphere. 
              From aromatic biryanis to famous rolls, fish curries to Indo-Chinese - every dish tells a story.
            </p>

            <div className={`flex flex-col sm:flex-row items-center justify-center gap-6 mb-10 animate-fade-in ${heroVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`} style={{ animationDelay: '300ms' }}>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-brand-500" aria-label="4.3 out of 5 stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="font-semibold text-gray-900">{avgRating}</span>
                <span className="text-gray-500">({totalReviews}+ reviews)</span>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-gray-500">
                <span>📍 College Square, Belonia</span>
                <span>📞 +91 93669 86853</span>
              </div>
            </div>

            <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in ${heroVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`} style={{ animationDelay: '400ms' }}>
              <Link to="/menu" className="btn-primary w-full sm:w-auto">
                Explore Our Menu
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link to="/contact" className="btn-secondary w-full sm:w-auto">
                Book a Table
              </Link>
              <a href="tel:+919366986853" className="flex items-center gap-2 text-brand-600 font-medium hover:text-brand-700 transition-colors hidden sm:flex">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call: +91 93669 86853
              </a>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" aria-hidden="true">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* Stats Section */}
      <section ref={statsRef} className="py-16 bg-white border-y border-surface-200" aria-labelledby="stats-heading">
        <div className="section-container">
          <h2 id="stats-heading" className="sr-only">Our Achievements</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className={`text-center ${statsVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`}>
              <div className="text-4xl md:text-5xl font-display font-bold text-brand-600 mb-2">#1</div>
              <div className="text-gray-600 font-medium">Restaurant in Belonia</div>
            </div>
            <div className={`text-center ${statsVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`} style={{ animationDelay: '100ms' }}>
              <div className="text-4xl md:text-5xl font-display font-bold text-brand-600 mb-2">4.3</div>
              <div className="text-gray-600 font-medium">Google Rating</div>
            </div>
            <div className={`text-center ${statsVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`} style={{ animationDelay: '200ms' }}>
              <div className="text-4xl md:text-5xl font-display font-bold text-brand-600 mb-2">{totalReviews}+</div>
              <div className="text-gray-600 font-medium">Happy Reviews</div>
            </div>
            <div className={`text-center ${statsVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`} style={{ animationDelay: '300ms' }}>
              <div className="text-4xl md:text-5xl font-display font-bold text-brand-600 mb-2">12</div>
              <div className="text-gray-600 font-medium">Menu Categories</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 bg-surface-50" aria-labelledby="features-heading">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 id="features-heading" className={`section-title ${featuresVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`}>
              Why Choose New Bawarchi 2
            </h2>
            <p className={`section-subtitle mx-auto ${featuresVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`} style={{ animationDelay: '100ms' }}>
              Authentic taste, fresh ingredients, great value - the Belonia way since 2023
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                ref={index === 0 ? featuresRef : null}
                className={`card p-6 text-center hover:shadow-xl transition-shadow ${featuresVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600">
                  {feature.icon}
                </div>
                <h3 className="font-display font-semibold text-lg text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Dishes */}
      <section className="py-20 bg-white" aria-labelledby="popular-heading">
        <div className="section-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <h2 id="popular-heading" className="section-title">Popular Dishes</h2>
              <p className="section-subtitle">Customer favorites that keep them coming back</p>
            </div>
            <Link to="/menu" className="btn-primary mt-4 md:mt-0">
              View Full Menu
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularItems.map((dish, index) => (
              <article key={dish.id} className="card group overflow-hidden">
                <div className="relative h-48 overflow-hidden bg-surface-100">
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-5xl">{
                      dish.name.toLowerCase().includes('biryani') ? '🍚' :
                      dish.name.toLowerCase().includes('roll') ? '🌯' :
                      dish.name.toLowerCase().includes('paneer') ? '🧀' :
                      '🍚'
                    }</span>
                  </div>
                  {dish.popular && (
                    <span className="absolute top-3 right-3 bg-brand-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                      Popular
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-baseline gap-2 mb-2">
                    <h3 className="font-display font-semibold text-gray-900">{dish.name}</h3>
                    <span className="badge badge-popular">⭐ Popular</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">Customer favorite - rated 4.5+ stars</p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-brand-600 text-lg">{dish.price}</span>
                    <button
                      onClick={() => handleAddToCart(dish)}
                      className="text-brand-600 hover:text-brand-700 text-sm font-medium flex items-center gap-1"
                    >
                      Add to Cart
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section ref={testimonialsRef} className="py-20 bg-surface-50" aria-labelledby="testimonials-heading">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 id="testimonials-heading" className={`section-title ${testimonialsVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`}>
              What Our Customers Say
            </h2>
            <p className={`section-subtitle mx-auto ${testimonialsVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`} style={{ animationDelay: '100ms' }}>
              Real reviews from real customers who've experienced New Bawarchi 2
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="overflow-hidden">
                <div 
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${testimonialIndex * 100}%)` }}
                  role="region"
                  aria-label="Customer testimonials carousel"
                >
                  {testimonials.map((testimonial, index) => (
                    <div key={index} className="w-full flex-shrink-0 px-4">
                      <article className="card p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xl">
                          {testimonial.avatar}
                        </div>
                        <div className="flex items-center justify-center gap-1 mb-4 text-brand-500" aria-label={`${testimonial.rating} out of 5 stars`}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} className="w-5 h-5 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <p className="text-gray-600 text-lg leading-relaxed mb-4">"{testimonial.text}"</p>
                        <div>
                          <p className="font-semibold text-gray-900">{testimonial.author}</p>
                          <p className="text-sm text-gray-500">{testimonial.role}</p>
                        </div>
                      </article>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevTestimonial}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-8 w-12 h-12 rounded-full bg-white border border-surface-200 flex items-center justify-center text-gray-600 hover:bg-surface-50 hover:text-brand-600 transition-all shadow-medium"
                aria-label="Previous testimonial"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextTestimonial}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-8 w-12 h-12 rounded-full bg-white border border-surface-200 flex items-center justify-center text-gray-600 hover:bg-surface-50 hover:text-brand-600 transition-all shadow-medium"
                aria-label="Next testimonial"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Dots */}
              <div className="flex justify-center gap-2 mt-8" role="tablist" aria-label="Testimonial navigation">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToTestimonial(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      index === testimonialIndex
                        ? 'bg-brand-500 w-8'
                        : 'bg-surface-300 hover:bg-brand-300'
                    }`}
                    role="tab"
                    aria-selected={index === testimonialIndex}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="text-center mt-10">
              <a href="https://www.google.com/search?q=New+Bawarchi+2+Belonia+reviews" target="_blank" rel="noopener noreferrer" className="btn-secondary">
                Read All Reviews on Google
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className="py-20 bg-gradient-to-br from-brand-600 via-brand-700 to-accent-700" aria-labelledby="cta-heading">
        <div className="section-container">
          <div className="max-w-3xl mx-auto text-center relative" aria-hidden="true">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 to-accent-400/20 rounded-2xl" />
          </div>
          <div className="max-w-3xl mx-auto text-center relative">
            <h2 id="cta-heading" className={`font-display font-semibold text-3xl md:text-4xl text-white mb-6 ${ctaVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`}>
              Ready for a Delicious Meal?
            </h2>
            <p className={`text-brand-100 text-lg mb-10 ${ctaVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`} style={{ animationDelay: '100ms' }}>
              Visit us at College Square or order for takeaway. Great food, great prices, great memories.
            </p>
            <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 ${ctaVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`} style={{ animationDelay: '200ms' }}>
              <Link to="/contact" className="btn-primary bg-white text-brand-700 hover:bg-brand-50 w-full sm:w-auto">
                Find Us & Order
              </Link>
              <a href="tel:+919366986853" className="btn-secondary border-white text-white hover:bg-white/10 w-full sm:w-auto">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Now
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}