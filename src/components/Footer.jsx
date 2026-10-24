import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { websiteStudio } from '../data/site';
import { buildWhatsAppUrl } from '../utils/whatsapp';

export default function Footer() {
  const { t, language } = useLanguage();
  const { restaurantInfo } = useSiteData();
  const currentYear = new Date().getFullYear();
  const studioUrl = buildWhatsAppUrl(websiteStudio.whatsapp, websiteStudio.message);

  const quickLinks = [
    { path: '/', label: t('footer.home', 'Home') },
    { path: '/menu', label: t('footer.fullMenu', 'Full Menu') },
    { path: '/gallery', label: t('footer.gallery', 'Gallery') },
    { path: '/about', label: t('footer.ourStory', 'Our Story') },
    { path: '/contact', label: t('footer.contactReservations', 'Contact & Reservations') },
    { path: '/track', label: t('footer.trackOrder', 'Track an Order') },
  ];

  const services = [
    { label: t('footer.orderOnline', 'Order Online'), path: '/order' },
    { label: t('footer.takeaway', 'Takeaway'), path: '/menu' },
    { label: t('footer.reservation', 'Table Reservation'), path: '/contact#reserve' },
    { label: t('footer.cateringCalculator', 'Catering Calculator'), path: '/catering' },
    { label: t('footer.printableMenu', 'Printable Menu'), path: '/menu-print' },
  ];

  return (
    <footer className="site-footer bg-[#1c1917] text-gray-400" role="contentinfo">
      <div className="section-container py-16 md:py-20">
        <div className="mb-12 flex flex-col gap-4 rounded-2xl border border-brand-500/30 bg-brand-500/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-400">
              {t('footer.businessOwners', 'For business owners')}
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-white">
              {t('footer.businessTitle', 'Want a website like this for your business or restaurant?')}
            </p>
            <p className="mt-1 text-sm text-gray-400">
              {t(
                'footer.businessCopy',
                'Menu, online orders, WhatsApp alerts and an admin panel — built for you.',
              )}
            </p>
          </div>
          <a
            href={studioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-stone-950 transition-colors hover:bg-brand-400 sm:w-auto"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.472.099-.174.05-.372-.025-.52-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.372-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.406h-.004a9.87 9.87 0 01-5.031-1.378L3.4 21.5l1.1-3.2A9.86 9.86 0 013 12c0-5.523 4.477-10 10-10 2.67 0 5.18 1.04 7.07 2.93A9.93 9.93 0 0123 12c0 5.523-4.477 10-10 10z" />
            </svg>
            WhatsApp {websiteStudio.phone}
          </a>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5 lg:gap-12">
          <div className="lg:col-span-2">
            <Link to="/" className="mb-5 flex items-center gap-3" aria-label={`${restaurantInfo.name} home`}>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 font-display text-xl font-bold text-stone-950">
                N2
              </span>
              <span>
                <span className="block font-display text-2xl font-semibold text-white">{restaurantInfo.name}</span>
                <span className="text-xs uppercase tracking-[0.18em] text-brand-400">
                  {t('footer.since', 'Belonia · Since')} {restaurantInfo.since}
                </span>
              </span>
            </Link>
            <p className="mb-6 max-w-sm leading-relaxed text-gray-400">
              {t('footer.tagline', restaurantInfo.tagline)}
              {language === 'bn' ? '।' : '.'}{' '}
              {t(
                'footer.taglineExtra',
                'Biryani, rolls, momos and everyday Bengali comfort food — made fresh, served warm.',
              )}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={`https://wa.me/${restaurantInfo.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/25"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.472.099-.174.05-.372-.025-.52-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.372-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.406h-.004a9.87 9.87 0 01-5.031-1.378L3.4 21.5l1.1-3.2A9.86 9.86 0 013 12c0-5.523 4.477-10 10-10 2.67 0 5.18 1.04 7.07 2.93A9.93 9.93 0 0123 12c0 5.523-4.477 10-10 10z" />
                </svg>
                {t('footer.whatsappUs', 'WhatsApp us')}
              </a>
              <a
                href={restaurantInfo.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-gray-200 transition-colors hover:bg-white/5"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('footer.getDirections', 'Get directions')}
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white">{t('footer.explore', 'Explore')}</h3>
            <ul className="space-y-3" role="list">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm text-gray-400 transition-colors hover:text-brand-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white">{t('footer.services', 'Services')}</h3>
            <ul className="space-y-3" role="list">
              {services.map((service) => (
                <li key={service.label}>
                  <Link to={service.path} className="text-sm text-gray-400 transition-colors hover:text-brand-300">
                    {service.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white">{t('footer.visitUs', 'Visit us')}</h3>
            <address className="space-y-3 not-italic text-sm">
              <a
                href={restaurantInfo.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 transition-colors hover:text-brand-300"
              >
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{restaurantInfo.address}</span>
              </a>
              <a href={`tel:${restaurantInfo.phoneRaw}`} className="flex items-center gap-3 transition-colors hover:text-brand-300">
                <svg className="h-5 w-5 flex-shrink-0 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>
                  {restaurantInfo.phone}
                  {restaurantInfo.phone2 ? ` · ${restaurantInfo.phone2}` : ''}
                </span>
              </a>
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{t('footer.hours', restaurantInfo.hours)}</span>
              </div>
            </address>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-xs text-gray-500">
            © {currentYear} {restaurantInfo.name}. {t('footer.rights', 'All rights reserved.')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs">
            <Link to="/menu-print" className="text-gray-500 transition-colors hover:text-brand-300">
              {t('footer.printMenuLink', 'Print menu')}
            </Link>
            <Link to="/staff" className="text-gray-500 transition-colors hover:text-brand-300">
              {t('footer.staffLogin', 'Staff login')}
            </Link>
            <Link to="/admin123" className="text-gray-500 transition-colors hover:text-brand-300">
              {t('footer.admin', 'Admin')}
            </Link>
            <span className="text-gray-600">{t('footer.madeWithCare', 'Made with care in Belonia')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
