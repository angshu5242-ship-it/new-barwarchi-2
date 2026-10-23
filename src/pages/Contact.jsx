import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSiteData } from '../context/SiteDataContext';
import OpenNowBadge from '../components/OpenNowBadge';
import { buildContactMessage, buildReservationMessage, buildWhatsAppUrl } from '../utils/whatsapp';

const timeSlots = [
  '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
  '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
  '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM',
];

const today = new Date().toISOString().split('T')[0];

export default function Contact() {
  const { restaurantInfo } = useSiteData();
  const [reservation, setReservation] = useState({
    name: '', phone: '', date: today, time: '7:00 PM', guests: '2', notes: '',
  });
  const [reservationSent, setReservationSent] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', subject: '', message: '',
  });
  const [formSent, setFormSent] = useState(false);

  const handleReservationChange = (event) => {
    const { name, value } = event.target;
    setReservation((prev) => ({ ...prev, [name]: value }));
    setReservationSent(false);
  };

  const handleReservationSubmit = (event) => {
    event.preventDefault();
    const url = buildWhatsAppUrl(
      restaurantInfo.whatsapp,
      buildReservationMessage(reservation, restaurantInfo),
    );
    window.open(url, '_blank', 'noopener,noreferrer');
    setReservationSent(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormSent(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const url = buildWhatsAppUrl(
      restaurantInfo.whatsapp,
      buildContactMessage(formData, restaurantInfo),
    );
    window.open(url, '_blank', 'noopener,noreferrer');
    setFormSent(true);
  };

  const contactInfo = [
    {
      title: 'Visit us',
      icon: '📍',
      details: [restaurantInfo.address, 'Look for the bright yellow sign at College Square'],
      link: { href: restaurantInfo.directionsUrl, text: 'Get directions' },
    },
    {
      title: 'Call us',
      icon: '📞',
      details: [
        restaurantInfo.phone,
        restaurantInfo.phone2,
        restaurantInfo.hours,
        'Takeaway & delivery orders welcome',
      ].filter(Boolean),
      link: { href: `tel:${restaurantInfo.phoneRaw}`, text: 'Call now' },
    },
    {
      title: 'Message us',
      icon: '💬',
      details: ['WhatsApp is the fastest way to reach the kitchen', 'We usually reply within a few minutes'],
      link: {
        href: buildWhatsAppUrl(restaurantInfo.whatsapp, `Hello ${restaurantInfo.name}!`),
        text: 'Open WhatsApp',
      },
    },
  ];

  const faqs = [
    {
      q: 'Do you offer home delivery?',
      a: `Yes, we deliver around Belonia. Place an order online with your address, or call ${restaurantInfo.phone}. Delivery charge and timing are confirmed on WhatsApp.`,
    },
    {
      q: 'What are your opening hours?',
      a: 'The kitchen is open every day from 8:00 AM to 10:00 PM, including weekends and holidays.',
    },
    {
      q: 'Do you have vegetarian options?',
      a: 'Yes — paneer butter masala, veg fried rice, chowmin, dal tadka, momos, salads and more. Veg dishes are marked clearly on the menu.',
    },
    {
      q: 'Can I reserve a table for a group?',
      a: 'Absolutely. Use the reservation form on this page or call us. For groups of 8 or more, please message us a day in advance so we can set up the tables.',
    },
    {
      q: 'Do you accept card payments?',
      a: 'Yes — cash, UPI and all major debit/credit cards are accepted.',
    },
    {
      q: 'Is parking available?',
      a: 'Street parking is available around College Square. Two-wheeler parking is usually easiest in the evening.',
    },
  ];

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="relative overflow-hidden border-b border-surface-200 bg-gradient-to-br from-[#fff6e6] via-[#fffdf8] to-[#f5ecdc] pb-12 pt-24 md:pb-16 md:pt-32">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-[32px] border-brand-100/70" aria-hidden="true" />
        <div className="section-container relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex justify-center">
              <OpenNowBadge />
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
              We’d love to feed you
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold text-gray-900 md:text-5xl">
              Contact & reservations
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-gray-600">
              Book a table, ask about a dish, or send a takeaway order to our kitchen. WhatsApp is
              usually the quickest way to reach us.
            </p>
          </div>
        </div>
      </header>

      <main className="section-container py-10 md:py-14">
        {/* Info cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {contactInfo.map((info) => (
            <article key={info.title} className="rounded-2xl border border-surface-200 bg-white p-6 shadow-soft">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-xl" aria-hidden="true">
                {info.icon}
              </span>
              <h2 className="mt-4 font-display text-xl font-semibold text-gray-900">{info.title}</h2>
              <ul className="mt-2 space-y-1 text-sm leading-relaxed text-gray-600">
                {info.details.map((detail) => <li key={detail}>{detail}</li>)}
              </ul>
              <a
                href={info.link.href}
                target={info.link.href.startsWith('http') ? '_blank' : undefined}
                rel={info.link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
              >
                {info.link.text}
                <span aria-hidden="true">→</span>
              </a>
            </article>
          ))}
        </div>

        {/* Reservation */}
        <section id="reserve" className="mt-12 scroll-mt-28">
          <div className="overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-soft">
            <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
              <div className="relative min-h-64 overflow-hidden bg-stone-900 p-7 text-white md:p-10">
                <img
                  src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1000&q=82"
                  alt="A warm table setting at New Bawarchi 2"
                  className="absolute inset-0 h-full w-full object-cover opacity-55"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-stone-950/20" />
                <div className="relative flex h-full flex-col justify-end">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-300">
                    Reserve a table
                  </p>
                  <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
                    Save a seat at the table.
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80">
                    Tell us when you’re coming and how many seats you need. We’ll confirm on
                    WhatsApp — no payment or booking fee required.
                  </p>
                  <div className="mt-6 space-y-2 text-sm text-white/85">
                    <p>🕗 {restaurantInfo.hours}</p>
                    <p>📍 {restaurantInfo.address}</p>
                    <p>👨‍👩‍👧 Groups of 8+ — please book a day ahead</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleReservationSubmit} className="p-6 md:p-9">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="res-name" className="label">Your name *</label>
                    <input
                      id="res-name"
                      name="name"
                      type="text"
                      required
                      value={reservation.name}
                      onChange={handleReservationChange}
                      className="input-field"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="res-phone" className="label">Phone number *</label>
                    <input
                      id="res-phone"
                      name="phone"
                      type="tel"
                      required
                      value={reservation.phone}
                      onChange={handleReservationChange}
                      className="input-field"
                      placeholder="+91 9XXXX XXXXX"
                    />
                  </div>
                  <div>
                    <label htmlFor="res-date" className="label">Date *</label>
                    <input
                      id="res-date"
                      name="date"
                      type="date"
                      required
                      min={today}
                      value={reservation.date}
                      onChange={handleReservationChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label htmlFor="res-time" className="label">Time *</label>
                    <select
                      id="res-time"
                      name="time"
                      required
                      value={reservation.time}
                      onChange={handleReservationChange}
                      className="input-field"
                    >
                      {timeSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="res-guests" className="label">Guests *</label>
                    <select
                      id="res-guests"
                      name="guests"
                      required
                      value={reservation.guests}
                      onChange={handleReservationChange}
                      className="input-field"
                    >
                      {Array.from({ length: 14 }, (_, index) => index + 1).map((count) => (
                        <option key={count} value={count}>{count} {count === 1 ? 'guest' : 'guests'}</option>
                      ))}
                      <option value="15+">15+ guests</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="res-notes" className="label">Anything we should know?</label>
                    <input
                      id="res-notes"
                      name="notes"
                      type="text"
                      value={reservation.notes}
                      onChange={handleReservationChange}
                      className="input-field"
                      placeholder="Birthday, high chair, quiet corner…"
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary mt-5 w-full">
                  Request table on WhatsApp
                </button>
                {reservationSent && (
                  <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    WhatsApp should open with your request. Send the message and we’ll confirm
                    shortly. If it didn’t open, call {restaurantInfo.phone}.
                  </p>
                )}
                <p className="mt-3 text-center text-xs text-gray-500">
                  Your request opens in WhatsApp. A table is confirmed only after we reply.
                </p>
              </form>
            </div>
          </div>
        </section>

        {/* Contact form + map */}
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <section aria-labelledby="message-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">General enquiries</p>
            <h2 id="message-heading" className="mt-2 font-display text-3xl font-semibold text-gray-900">
              Send us a message
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Feedback, catering questions or a dish you’d like us to make — tell us here.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-surface-200 bg-white p-6 shadow-soft">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="label">Full name *</label>
                  <input id="name" name="name" type="text" required value={formData.name} onChange={handleChange} className="input-field" placeholder="Your name" />
                </div>
                <div>
                  <label htmlFor="phone" className="label">Phone number *</label>
                  <input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleChange} className="input-field" placeholder="+91 9XXXX XXXXX" />
                </div>
                <div>
                  <label htmlFor="email" className="label">Email (optional)</label>
                  <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="you@example.com" />
                </div>
                <div>
                  <label htmlFor="subject" className="label">Topic *</label>
                  <select id="subject" name="subject" required value={formData.subject} onChange={handleChange} className="input-field">
                    <option value="">Choose a topic</option>
                    <option value="Takeaway order">Takeaway order</option>
                    <option value="Catering / bulk order">Catering / bulk order</option>
                    <option value="Feedback">Feedback</option>
                    <option value="Lost item">Lost item</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label htmlFor="message" className="label">Message *</label>
                <textarea id="message" name="message" required rows={4} value={formData.message} onChange={handleChange} className="input-field resize-y" placeholder="How can we help?" />
              </div>
              <button type="submit" className="btn-primary mt-4 w-full">Send via WhatsApp</button>
              {formSent && (
                <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  WhatsApp should open with your message. Send it across and we’ll get back to you.
                </p>
              )}
              <p className="mt-3 text-xs text-gray-500">
                Prefer to talk? Call <a href={`tel:${restaurantInfo.phoneRaw}`} className="font-semibold text-brand-700 hover:underline">{restaurantInfo.phone}</a>.
              </p>
            </form>
          </section>

          <section aria-labelledby="map-heading" className="flex flex-col">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Find the yellow sign</p>
            <h2 id="map-heading" className="mt-2 font-display text-3xl font-semibold text-gray-900">
              College Square, Belonia
            </h2>
            <p className="mt-2 text-sm text-gray-600">{restaurantInfo.address}</p>
            <div className="mt-6 flex-1 overflow-hidden rounded-2xl border border-surface-200 bg-surface-100 shadow-soft">
              <iframe
                title={`${restaurantInfo.name} on Google Maps`}
                src={restaurantInfo.mapsEmbedUrl}
                style={{ border: 0, minHeight: '26rem' }}
                width="100%"
                height="100%"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <a
                href={restaurantInfo.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                Get directions
              </a>
              <a
                href={restaurantInfo.googleListingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline text-sm"
              >
                View Google listing
              </a>
            </div>
          </section>
        </div>

        {/* FAQ */}
        <section className="mt-14" aria-labelledby="faq-heading">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Before you ask</p>
              <h2 id="faq-heading" className="mt-2 font-display text-3xl font-semibold text-gray-900">
                Frequently asked questions
              </h2>
            </div>
            <div className="mt-7 space-y-3">
              {faqs.map((faq) => (
                <details key={faq.q} className="group rounded-2xl border border-surface-200 bg-white shadow-soft">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-gray-900">
                    {faq.q}
                    <svg className="h-5 w-5 flex-shrink-0 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="border-t border-surface-200 px-5 py-4 text-sm leading-relaxed text-gray-600">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
            <p className="mt-7 text-center text-sm text-gray-500">
              Still curious? <Link to="/menu" className="font-semibold text-brand-700 hover:underline">Browse the menu</Link> or{' '}
              <a href={`tel:${restaurantInfo.phoneRaw}`} className="font-semibold text-brand-700 hover:underline">give us a call</a>.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
