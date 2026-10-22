import { useState } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [formStatus, setFormStatus] = useState('idle');
  const [contactRef, contactVisible] = useIntersectionObserver();
  const [infoRef, infoVisible] = useIntersectionObserver();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('submitting');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setFormStatus('success');
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    
    setTimeout(() => setFormStatus('idle'), 5000);
  };

  const contactInfo = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: 'Visit Us',
      details: [
        'College Square',
        'Belonia, Tripura 799155',
      ],
      link: {
        href: 'https://www.google.com/maps/dir/?api=1&destination=College+Square+Belonia+Tripura',
        text: 'Get Directions →',
      },
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      title: 'Call Us',
      details: [
        '+91 93669 86853',
        'Daily: 8:00 AM - 10:00 PM',
        'Takeaway orders welcome',
      ],
      link: {
        href: 'tel:+919366986853',
        text: 'Call Now →',
      },
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      title: 'Send a Message',
      details: [
        'Fill out the form to send us',
        'a message directly',
        'We typically respond within 24 hours',
      ],
      link: {
        href: '#contact-form',
        text: 'Send Message →',
      },
    },
  ];

  const subjects = [
    { value: '', label: 'Select a topic' },
    { value: 'reservation', label: 'Table Reservation' },
    { value: 'takeaway', label: 'Takeaway Order' },
    { value: 'catering', label: 'Catering Inquiry' },
    { value: 'feedback', label: 'Feedback / Complaint' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Page Header */}
      <header className="bg-white border-b border-surface-200 pt-20 pb-12">
        <div className="section-container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display font-semibold text-3xl md:text-4xl lg:text-5xl text-gray-900 mb-4">
              Contact Us
            </h1>
            <p className="text-lg text-gray-600">
              Have a question? Want to make a reservation or place a takeaway order? 
              We'd love to hear from you.
            </p>
          </div>
        </div>
      </header>

      <main className="section-container py-12">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Contact Info Cards */}
          <aside ref={infoRef} className="lg:col-span-1 space-y-4" aria-labelledby="contact-info-heading">
            <h2 id="contact-info-heading" className="sr-only">Contact Information</h2>
            {contactInfo.map((info, index) => (
              <article
                key={info.title}
                ref={index === 0 ? infoRef : null}
                className={`card p-6 ${infoVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600 mb-4">
                  {info.icon}
                </div>
                <h3 className="font-display font-semibold text-lg text-gray-900 mb-3">{info.title}</h3>
                <ul className="space-y-1 text-gray-600 text-sm mb-4" role="list">
                  {info.details.map((detail, i) => (
                    <li key={i}>{detail}</li>
                  ))}
                </ul>
                <a
                  href={info.link.href}
                  target={info.link.href.startsWith('http') ? '_blank' : undefined}
                  rel={info.link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium text-sm transition-colors"
                >
                  {info.link.text}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </article>
            ))}
          </aside>

          {/* Contact Form */}
          <section ref={contactRef} className="lg:col-span-2" aria-labelledby="form-heading">
            <h2 id="form-heading" className={`font-display font-semibold text-2xl md:text-3xl text-gray-900 mb-6 ${contactVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`}>
              Send Us a Message
            </h2>

            <form onSubmit={handleSubmit} className={`card p-6 md:p-8 ${contactVisible ? 'animate-slide-up' : 'opacity-0 translate-y-4'}`} style={{ animationDelay: '100ms' }} noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="label">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="Your name"
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="label">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="+91 93669 86853"
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="label">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="label">Subject *</label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="input-field appearance-none"
                    aria-required="true"
                  >
                    {subjects.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="message" className="label">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="input-field resize-y min-h-[120px]"
                  placeholder="Tell us about your inquiry, reservation request, or feedback..."
                  aria-required="true"
                />
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={formStatus === 'submitting'}
                  className="btn-primary w-full sm:w-auto"
                >
                  {formStatus === 'submitting' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </button>
                {formStatus === 'success' && (
                  <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Message sent successfully! We'll get back to you soon.
                  </div>
                )}
              </div>

              <p className="mt-4 text-sm text-gray-500">
                * Required fields. For urgent inquiries or takeaway orders, please call 
                <a href="tel:+919366986853" className="text-brand-600 hover:text-brand-700 font-medium">+91 93669 86853</a>.
              </p>
            </form>
          </section>
        </div>

        {/* Map Section */}
        <section className="mt-16" aria-labelledby="map-heading">
          <h2 id="map-heading" className="sr-only">Location Map</h2>
          <div className="rounded-xl overflow-hidden shadow-lg border border-surface-200 aspect-video bg-surface-100">
            <iframe
              title="New Bawarchi 2 location on Google Maps"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3722.5!2d91.458415!3d23.250753!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x375b6a1a3c5c5c5c%3A0x5c5c5c5c5c5c5c5c!2sNew%20Bawarchi%202!5e0!3m2!1sen!2sin!4v1698000000000!5m2!1sen!2sin"
              style={{ border: 0 }}
              width="100%"
              height="100%"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-16" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="font-display font-semibold text-2xl md:text-3xl text-gray-900 text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: 'Do you offer home delivery?',
                a: 'Currently we offer takeaway service. You can call us at +91 93669 86853 to place your order and pick it up at your convenience.',
              },
              {
                q: 'What are your opening hours?',
                a: 'We are open daily from 8:00 AM to 10:00 PM, including weekends and holidays.',
              },
              {
                q: 'Do you have vegetarian options?',
                a: 'Yes! We have a wide variety of vegetarian dishes including Paneer Butter Masala, Veg Fried Rice, Dal Tadka, and many more.',
              },
              {
                q: 'Can I make a reservation for a large group?',
                a: 'Absolutely! Please call us at +91 93669 86853 to discuss group bookings and any special arrangements.',
              },
              {
                q: 'Do you accept card payments?',
                a: 'Yes, we accept cash, UPI, and all major debit/credit cards.',
              },
              {
                q: 'Is parking available?',
                a: 'Street parking is available near the restaurant at College Square.',
              },
            ].map((faq, index) => (
              <details key={index} className="card group">
                <summary className="p-5 md:p-6 flex items-center justify-between cursor-pointer list-none">
                  <h3 className="font-medium text-gray-900 pr-4">{faq.q}</h3>
                  <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform duration-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 md:px-6 pb-5 md:pb-6 text-gray-600 border-t border-surface-200">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}