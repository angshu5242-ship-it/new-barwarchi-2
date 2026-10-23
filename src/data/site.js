import { foodImages } from './images';

export const restaurantInfo = {
  name: 'New Bawarchi 2',
  menuTitle: 'Bawarchi Puja Special',
  menuSubtitle: 'Good Food · Great Mood',
  tagline: "Belonia's Puja-season kitchen for biryani, rolls & everyday comfort food",
  address: 'College Square, Belonia, Tripura 799155',
  shortAddress: 'College Square, Belonia',
  phone: '+91 93669 86853',
  phoneRaw: '+919366986853',
  phone2: '+91 96122 81939',
  phone2Raw: '+919612281939',
  whatsapp: '919366986853',
  email: '',
  hours: 'Daily: 8:00 AM – 10:00 PM',
  opensAt: 8,
  closesAt: 22,
  rating: '4.3',
  reviewCount: '25+',
  since: '2023',
  mapsEmbedUrl: 'https://www.google.com/maps?q=6FV9%2B9Q+Belonia,+Tripura+799155&output=embed',
  directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=6FV9%2B9Q+Belonia,+Tripura+799155',
  googleListingUrl: 'https://www.google.com/maps/place/Restaurant+New+Bawarchi+2/data=!4m2!3m1!1s0x0:0xed73a0c118858ff',
  instagram: 'https://www.instagram.com/',
  facebook: 'https://www.facebook.com/',
  announcement:
    'Bawarchi Puja Special · Open daily 8 AM – 10 PM · Call +91 93669 86853 / +91 96122 81939',
  deliveryNote: 'Home delivery around Belonia. Delivery charge and timing are confirmed on WhatsApp.',
};

export const websiteStudio = {
  whatsapp: '916009772116',
  phone: '+91 60097 72116',
  message:
    'Hi! I saw the New Bawarchi 2 website and I want a similar website for my business / restaurant.',
};

export const heroImages = [
  {
    id: 'hero-biryani',
    src: foodImages.biryani,
    alt: 'Aromatic chicken dum biryani served at New Bawarchi 2',
    caption: 'Chicken Dum Biriyani',
    active: true,
  },
  {
    id: 'hero-roll',
    src: foodImages.roll,
    alt: 'Fresh chicken rolls at New Bawarchi 2',
    caption: 'Fresh rolls, made to order',
    active: false,
  },
  {
    id: 'hero-paneer',
    src: foodImages.paneer,
    alt: 'Paneer butter masala with Indian breads',
    caption: 'Paneer Butter Masala',
    active: false,
  },
  {
    id: 'hero-interior',
    src: foodImages.interior,
    alt: 'Warm dining area at New Bawarchi 2',
    caption: 'A warm corner of Belonia',
    active: false,
  },
];

export const specialOffers = [
  {
    id: 'combo-puja',
    tag: 'Puja special',
    title: 'Dum Biriyani + Chicken Kasha',
    description: 'Dum biriyani, chicken kasha and a cold drink — a full Puja lunch for ₹230.',
    price: '₹230',
    image: foodImages.thali,
    link: '/menu?category=combo',
  },
  {
    id: 'biryani-feast',
    tag: 'For the family',
    title: 'Biryani made for sharing',
    description: 'Chicken dum biriyani in half and full portions, slow-cooked for deeper aroma.',
    price: 'From ₹120',
    image: foodImages.biryani,
    link: '/menu?category=biriyani',
  },
  {
    id: 'roll-run',
    tag: 'Quick bite',
    title: 'Rolls from ₹40',
    description: 'Flaky paratha, egg or spiced chicken, onions and a squeeze of lemon. Grab and go.',
    price: 'From ₹40',
    image: foodImages.roll,
    link: '/menu?category=roll',
  },
];

export const openingHours = [
  { day: 'Monday', open: '8:00 AM', close: '10:00 PM' },
  { day: 'Tuesday', open: '8:00 AM', close: '10:00 PM' },
  { day: 'Wednesday', open: '8:00 AM', close: '10:00 PM' },
  { day: 'Thursday', open: '8:00 AM', close: '10:00 PM' },
  { day: 'Friday', open: '8:00 AM', close: '10:00 PM' },
  { day: 'Saturday', open: '8:00 AM', close: '10:00 PM' },
  { day: 'Sunday', open: '8:00 AM', close: '10:00 PM' },
];
