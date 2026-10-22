import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { getAverageRating, getTotalReviews, reviews } from '../data/reviews';

export default function About() {
  const [storyRef, storyVisible] = useIntersectionObserver();
  const [valuesRef, valuesVisible] = useIntersectionObserver();
  const [reviewsRef, reviewsVisible] = useIntersectionObserver();
  const [teamRef, teamVisible] = useIntersectionObserver();
  const [specialtiesRef, specialtiesVisible] = useIntersectionObserver();
  const [timelineRef, timelineVisible] = useIntersectionObserver();

  const avgRating = getAverageRating();
  const totalReviews = getTotalReviews();

  const values = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      title: 'Authentic Taste',
      description: 'We preserve traditional Bengali & Indian recipes, ensuring every dish delivers genuine flavors of the region.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Fresh Ingredients',
      description: 'We source fresh, high-quality ingredients daily from local markets for the best taste and nutrition.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      title: 'Customer First',
      description: 'Your satisfaction is our priority. We listen to feedback and continuously improve to exceed expectations.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Affordable Quality',
      description: 'Great food shouldn\'t break the bank. We offer premium quality at prices that welcome everyone.',
    },
  ];

  const specialties = [
    {
      icon: '🍚',
      title: 'Signature Biryani',
      description: 'Slow-cooked dum biryani with aromatic basmati rice, saffron, and traditional spices. Available in Chicken, Mutton, Fish, Prawn, Egg & Vegetarian varieties.',
      highlight: 'Chef\'s Special: Chicken Dum Biryani',
    },
    {
      icon: '🌯',
      title: 'Famous Rolls',
      description: 'Freshly made paratha wraps with generous fillings. Our Egg Roll, Double Egg Roll, Chicken Roll & Egg Chicken Roll are Belonia favorites.',
      highlight: 'Best Seller: Chicken Roll',
    },
    {
      icon: '🐟',
      title: 'Bengali Fish Curries',
      description: 'Authentic Bengali preparations with mustard, poppy seed, coconut & yogurt. Ilish Bhapa, Chingri Malai Curry, Rui Macher Jhol & more.',
      highlight: 'Seasonal: Ilish Bhapa (Hilsa)',
    },
    {
      icon: '🥟',
      title: 'Handmade Momos',
      description: 'Steamed, fried & pan-fried Tibetan dumplings with chicken, vegetable & paneer fillings. Served with spicy tomato chutney.',
      highlight: 'Popular: Steam Momos (Veg/Chicken)',
    },
    {
      icon: '🍛',
      title: 'Indo-Chinese Favorites',
      description: 'Chilli Chicken, Chilli Paneer, Hakka Noodles, Fried Rice & Manchurian - wok-tossed with authentic Indo-Chinese flavors.',
      highlight: 'Spicy: Schezwan Fried Rice',
    },
    {
      icon: '🫓',
      title: 'Fresh Breads & Breakfast',
      description: 'Lachha Paratha, Butter Naan, Tandoori Roti, Puri Sabji & Dal Puri served fresh daily. Perfect with any curry or dal.',
      highlight: 'Morning Special: Puri Sabji',
    },
  ];

  const timeline = [
    {
      year: '2023',
      title: 'Founded',
      description: 'New Bawarchi 2 opened at College Square, Belonia with a vision to bring authentic Bengali cuisine at affordable prices.',
      icon: '🏁',
    },
    {
      year: '2023',
      title: 'First 100 Reviews',
      description: 'Reached 100+ Google reviews within 6 months, maintaining 4.3+ star rating. Became a local favorite.',
      icon: '⭐',
    },
    {
      year: '2024',
      title: 'Menu Expansion',
      description: 'Added Bengali fish specialties, expanded biryani varieties, introduced momos & breakfast menu based on customer feedback.',
      icon: '📋',
    },
    {
      year: '2024',
      title: '#1 in Belonia',
      description: 'Achieved #1 restaurant ranking in Belonia on Google. Launched online ordering & digital menu with QR codes.',
      icon: '🏆',
    },
    {
      year: '2025',
      title: 'Digital Transformation',
      description: 'Implemented admin panel for real-time menu updates, shopping cart, PWA support & mobile app capabilities.',
      icon: '💻',
    },
  ];

  const team = [
    { name: 'Rajesh Roy', role: 'Founder & Head Chef', experience: '15+ years', bio: 'Passionate about bringing authentic Bengali flavors to Belonia. Trained in Kolkata\'s top kitchens.', specialty: 'Biryani & Bengali Curries' },
    { name: 'Priya Das', role: 'Restaurant Manager', experience: '8+ years', bio: 'Ensures every guest has a memorable dining experience. Manages operations, staff training & customer relations.', specialty: 'Operations & Hospitality' },
    { name: 'Amit Singh', role: 'Sous Chef', experience: '10+ years', bio: 'Specializes in Bengali fish curries and Mughlai cuisine. Brings authentic techniques from his family kitchen.', specialty: 'Fish Curries & Mughlai' },
    { name: 'Suman Deb', role: 'Tandoor Specialist', experience: '12+ years', bio: 'Master of the clay oven. Perfects naan, roti, kebabs & tandoori dishes with traditional techniques.', specialty: 'Tandoori & Breads' },
    { name: 'Rita Chakraborty', role: 'Senior Cook', experience: '7+ years', bio: 'Expert in vegetarian Bengali cuisine, momos & Indo-Chinese preparations. Ensures consistency in every dish.', specialty: 'Veg & Momos' },
    { name: 'Arjun Saha', role: 'Kitchen Assistant', experience: '3+ years', bio: 'Supports prep work, maintains kitchen hygiene & learns from senior chefs. Future head chef in training.', specialty: 'Prep & Support' },
  ];

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Page Header */}
      <header className="bg-gradient-to-br from-brand-600 via-brand-700 to-accent-700 pt-20 pb-16">
        <div className="section-container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display font-semibold text-3xl md:text-4xl lg:text-5xl text-white mb-4">
              Our Story
            </h1>
            <p className="text-brand-100 text-lg max-w-2xl mx-auto">
              Where authentic Bengali taste meets affordability – serving Belonia with love since 2023
            </p>
          </div>
        </div>
      </header>

      {/* Story Section */}
      <section ref={storyRef} className="py-20 bg-white" aria-labelledby="story-heading">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className={storyVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}>
              <h2 id="story-heading" className="font-display font-semibold text-3xl md:text-4xl text-gray-900 mb-6">
                A Journey of Flavor & Passion
              </h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Founded in 2023, New Bawarchi 2 began with a simple vision: to bring authentic, 
                  high-quality Bengali & Indian cuisine to Belonia at prices everyone can afford. 
                  What started as a small eatery at College Square has grown into the 
                  #1 rated restaurant in Belonia, beloved by locals and visitors alike.
                </p>
                <p>
                  Our founder, Chef Rajesh Roy, brought over 15 years of culinary experience 
                  from prestigious kitchens across India. He believed that great food shouldn't 
                  be a luxury – it should be a daily joy accessible to all. This philosophy 
                  guides everything we do, from sourcing the freshest ingredients to perfecting 
                  each recipe.
                </p>
                <p>
                  Today, we're proud to serve hundreds of happy customers every week, 
                  maintaining a 4.3-star rating on Google with 25+ glowing reviews. 
                  Whether it's our signature Chicken Dum Biryani, famous rolls, 
                  Bengali fish curries, or Indo-Chinese favorites – every dish is made with 
                  the same passion and attention to detail as day one.
                </p>
              </div>
            </div>
            <div className={storyVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'} style={{ animationDelay: '200ms' }}>
              <div className="relative">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-surface-200">
                  <div className="w-full h-full bg-gradient-to-br from-surface-100 to-surface-200 flex items-center justify-center">
                    <svg className="w-24 h-24 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 md:-bottom-8 md:-right-8 bg-white border border-surface-200 rounded-2xl p-6 md:p-8 shadow-xl max-w-xs">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1 text-brand-500" aria-label="4.3 out of 5 stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="w-5 h-5 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="font-bold text-gray-900">{avgRating}</span>
                    <span className="text-gray-500">({totalReviews} reviews)</span>
                  </div>
                  <p className="text-gray-600">"Best biryani in town! The flavors are authentic and the service is excellent."</p>
                  <p className="text-sm text-gray-500 mt-2">— Chiranjit Majumder, Google Reviews</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section ref={timelineRef} className="py-20 bg-surface-50" aria-labelledby="timeline-heading">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 id="timeline-heading" className={`section-title ${timelineVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`}>
              Our Journey
            </h2>
            <p className={`section-subtitle mx-auto ${timelineVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`} style={{ animationDelay: '100ms' }}>
              Milestones that shaped New Bawarchi 2
            </p>
          </div>

          <div className="relative max-w-3xl mx-auto">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-brand-200 -translate-x-1/2 hidden md:block" />
            <div className="space-y-12">
              {timeline.map((item, index) => (
                <div
                  key={item.year}
                  className={`relative flex items-start md:flex-row md:items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''} ${timelineVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className={`md:w-1/2 md:pr-8 ${index % 2 === 1 ? 'md:pl-8 md:pr-0' : ''} text-center md:text-right`}>
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 text-brand-600 text-2xl mb-4 md:mx-auto md:mb-4 relative z-10">
                      {item.icon}
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-soft border border-surface-200">
                      <div className="text-brand-600 font-bold text-lg mb-2">{item.year}</div>
                      <h3 className="font-display font-semibold text-xl text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  <div className="md:w-1/2 md:pt-4">
                    <div className="absolute hidden md:block top-20 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-brand-500 border-4 border-white z-10" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Specialties Section */}
      <section ref={specialtiesRef} className="py-20 bg-white" aria-labelledby="specialties-heading">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 id="specialties-heading" className={`section-title ${specialtiesVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`}>
              Our Specialties
            </h2>
            <p className={`section-subtitle mx-auto ${specialtiesVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`} style={{ animationDelay: '100ms' }}>
              Signature dishes that keep our customers coming back
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {specialties.map((item, index) => (
              <article
                key={item.title}
                className={`card p-6 hover:shadow-xl transition-shadow ${specialtiesVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-brand-100 flex items-center justify-center text-2xl flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-semibold text-lg text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-3">{item.description}</p>
                    <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2 py-1 rounded-full">{item.highlight}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section ref={valuesRef} className="py-20 bg-surface-50" aria-labelledby="values-heading">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 id="values-heading" className={`section-title ${valuesVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`}>
              Our Values
            </h2>
            <p className={`section-subtitle mx-auto ${valuesVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`} style={{ animationDelay: '100ms' }}>
              The principles that guide our kitchen and our service every single day
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <article
                key={value.title}
                ref={index === 0 ? valuesRef : null}
                className={`card p-6 text-center hover:shadow-xl transition-shadow ${valuesVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600">
                  {value.icon}
                </div>
                <h3 className="font-display font-semibold text-lg text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section ref={reviewsRef} className="py-20 bg-white" aria-labelledby="reviews-heading">
        <div className="section-container">
          <div className="text-center mb-12">
            <h2 id="reviews-heading" className={`section-title ${reviewsVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`}>
              What Our Customers Say
            </h2>
            <p className={`section-subtitle mx-auto ${reviewsVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`} style={{ animationDelay: '100ms' }}>
              Real reviews from real customers who've experienced New Bawarchi 2
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.slice(0, 6).map((review, index) => (
              <article
                key={review.id}
                ref={index === 0 ? reviewsRef : null}
                className={`card p-6 ${reviewsVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-semibold">
                    {review.avatar}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{review.author}</h3>
                    <p className="text-sm text-gray-500">{review.date} • {review.source}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-4 text-brand-500" aria-label={`${(review.rating.food + review.rating.service + review.rating.atmosphere) / 3} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-4 h-4 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{review.comment}"</p>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 border-t border-surface-200 pt-4">
                  <span>Food: <span className="font-medium text-gray-900">{review.rating.food}/5</span></span>
                  <span>Service: <span className="font-medium text-gray-900">{review.rating.service}/5</span></span>
                  <span>Atmosphere: <span className="font-medium text-gray-900">{review.rating.atmosphere}/5</span></span>
                </div>
              </article>
            ))}
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
      </section>

      {/* Team Section */}
      <section ref={teamRef} className="py-20 bg-surface-50" aria-labelledby="team-heading">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 id="team-heading" className={`section-title ${teamVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`}>
              Meet Our Team
            </h2>
            <p className={`section-subtitle mx-auto ${teamVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`} style={{ animationDelay: '100ms' }}>
              The passionate people behind your favorite meals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {team.map((member, index) => (
              <article
                key={member.name}
                className={`card overflow-hidden text-center ${teamVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="aspect-square overflow-hidden bg-surface-100 relative">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-brand-100 flex items-center justify-center">
                      <span className="text-3xl font-bold text-brand-600">{member.name.charAt(0)}</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-brand-600 to-transparent text-white p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-xs font-medium">{member.specialty}</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-display font-semibold text-lg text-gray-900">{member.name}</h3>
                  <p className="text-brand-600 text-sm font-medium mb-1">{member.role}</p>
                  <p className="text-gray-500 text-xs mb-3">{member.experience} • {member.specialty}</p>
                  <p className="text-gray-600 text-sm">{member.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Location & Hours */}
      <section className="py-20 bg-brand-600 text-white" aria-labelledby="visit-heading">
        <div className="section-container">
          <h2 id="visit-heading" className="font-display font-semibold text-3xl md:text-4xl text-center mb-12">
            Visit Us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6 bg-white/10 rounded-xl border border-white/20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-white/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-display font-semibold text-xl mb-2">Location</h3>
              <address className="not-italic text-brand-100 leading-relaxed">
                College Square<br />
                Belonia, Tripura 799155
              </address>
              <a 
                href="https://www.google.com/maps/dir/?api=1&destination=College+Square+Belonia+Tripura"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-brand-300 hover:text-white text-sm mt-3 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Get Directions
              </a>
            </div>
            <div className="text-center p-6 bg-white/10 rounded-xl border border-white/20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-white/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-display font-semibold text-xl mb-2">Opening Hours</h3>
              <div className="text-brand-100 space-y-1">
                <p>Monday - Sunday: 8:00 AM - 10:00 PM</p>
                <p className="text-brand-300 text-sm">Open all days including holidays</p>
              </div>
            </div>
            <div className="text-center p-6 bg-white/10 rounded-xl border border-white/20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-white/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="font-display font-semibold text-xl mb-2">Contact & Order</h3>
              <div className="text-brand-100 space-y-1">
                <a href="tel:+919366986853" className="hover:text-white transition-colors">+91 93669 86853</a>
                <p className="text-sm">Call for takeaway orders</p>
                <a 
                  href="https://wa.me/919366986853"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-green-300 hover:text-green-200 text-sm mt-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.472.099-.174.05-.372-.025-.52-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.372-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.406h-.004a9.87 9.87 0 01-5.031-1.378 9.86 9.86 0 01-.399-2.327c-.043-.204.064-.413.273-.56.297-.21 1.32-.866 2.53-2.198 1.04-1.125 1.698-1.963 1.777-2.059.074-.094.163-.197.204-.314.04-.134-.01-.25-.148-.347-.148-.098-.57-.373-.865-.58-.313-.207-.625-.398-.92-.557-.297-.149-.534-.198-.81-.198-.28 0-.52.065-.76.242-.272.174-.963.662-1.11 1.088-.232.67-.69 2.488-1.013 3.83-.215.895-.399 1.798-.399 2.162 0 .54.149 1.624.372 2.162.471.96 1.156 1.556 2.213 1.86.97.273 2.217.248 2.601.148.508-.133 1.655-1.624 2.645-3.147.61-.936.76-1.46.662-1.648-.098-.187-.333-.272-.644-.272-.347 0-.707.15-1.012.446Z"/>
                  </svg>
                  WhatsApp Order
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}