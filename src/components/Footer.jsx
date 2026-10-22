import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    quickLinks: [
      { path: '/', label: 'Home' },
      { path: '/menu', label: 'Menu' },
      { path: '/gallery', label: 'Gallery' },
      { path: '/about', label: 'About Us' },
      { path: '/contact', label: 'Contact' },
    ],
    services: [
      { label: 'Dine In', path: '/contact' },
      { label: 'Takeaway', path: '/contact' },
      { label: 'Delivery', path: '/contact' },
      { label: 'Catering', path: '/contact' },
      { label: 'Private Events', path: '/contact' },
    ],
    legal: [
      { label: 'Privacy Policy', path: '#' },
      { label: 'Terms of Service', path: '#' },
      { label: 'Cookie Policy', path: '#' },
    ],
  };

  const socialLinks = [
    { name: 'Facebook', href: 'https://facebook.com', icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    )},
    { name: 'Instagram', href: 'https://instagram.com', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" strokeWidth="2"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" strokeWidth="2"/>
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" strokeWidth="2"/>
      </svg>
    )},
    { name: 'Google Maps', href: 'https://maps.google.com', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
    { name: 'WhatsApp', href: 'https://wa.me/919366986853', icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.472.099-.174.05-.372-.025-.52-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.372-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.406h-.004a9.87 9.87 0 01-5.031-1.378 9.86 9.86 0 01-.399-2.327c-.043-.204.064-.413.273-.56.297-.21 1.32-.866 2.53-2.198 1.04-1.125 1.698-1.963 1.777-2.059.074-.094.163-.197.204-.314.04-.134-.01-.25-.148-.347-.148-.098-.57-.373-.865-.58-.313-.207-.625-.398-.92-.557-.297-.149-.534-.198-.81-.198-.28 0-.52.065-.76.242-.272.174-.963.662-1.11 1.088-.232.67-.69 2.488-1.013 3.83-.215.895-.399 1.798-.399 2.162 0 .54.149 1.624.372 2.162.471.96 1.156 1.556 2.213 1.86.97.273 2.217.248 2.601.148.508-.133 1.655-1.624 2.645-3.147.61-.936.76-1.46.662-1.648-.098-.187-.333-.272-.644-.272-.347 0-.707.15-1.012.446Z"/>
      </svg>
    )},
  ];

  return (
    <footer className="bg-gray-900 text-gray-400" role="contentinfo">
      <div className="section-container py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6" aria-label="New Bawarchi 2 Home">
              <div className="w-12 h-12 rounded-lg bg-brand-500 flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="font-display font-semibold text-2xl text-white">New Bawarchi 2</span>
            </Link>
            <p className="text-gray-500 mb-6 max-w-xs leading-relaxed">
              Belonia's favorite restaurant serving authentic Bengali & Indian cuisine since 2023. 
              Famous for biryani, rolls, fish curries & more. Experience true flavors of Bengal.
            </p>
            <div className="flex flex-wrap gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-brand-500 hover:text-white transition-all duration-200"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-brand-400 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-white mb-4">Our Services</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.services.map((service) => (
                <li key={service.label}>
                  <Link
                    to={service.path}
                    className="text-gray-400 hover:text-brand-400 transition-colors duration-200"
                  >
                    {service.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contact Us</h3>
            <address className="not-italic space-y-3 text-gray-400">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-brand-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>College Square<br />Belonia, Tripura 799155</span>
              </div>
              <a href="tel:+919366986853" className="flex items-center gap-3 hover:text-brand-400 transition-colors">
                <svg className="w-5 h-5 text-brand-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>+91 93669 86853</span>
              </a>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-brand-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Daily: 8:00 AM - 10:00 PM</span>
              </div>
            </address>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              &copy; {currentYear} New Bawarchi 2. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {footerLinks.legal.map((legal) => (
                <Link
                  key={legal.label}
                  to={legal.path}
                  className="text-gray-500 hover:text-brand-400 text-sm transition-colors"
                >
                  {legal.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}