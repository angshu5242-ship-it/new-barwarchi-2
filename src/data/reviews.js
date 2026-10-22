export const reviews = [
  {
    id: 1,
    author: 'Bithika Chakraborty',
    date: '5 months ago',
    source: 'Google',
    rating: { food: 5, service: 5, atmosphere: 4 },
    comment: 'Excellent food quality and great service! The chicken biryani is a must-try. The atmosphere is cozy and perfect for family dinners.',
    avatar: 'BC',
  },
  {
    id: 2,
    author: 'Chiranjit Majumder',
    date: '5 months ago',
    source: 'Google',
    rating: { food: 5, service: 5, atmosphere: 5 },
    comment: 'One of the best restaurants in Belonia! Amazing biryani, friendly staff, and great ambiance. Highly recommended for both lunch and dinner.',
    avatar: 'CM',
  },
  {
    id: 3,
    author: 'Snigdha Acharjee',
    date: '7 months ago',
    source: 'Google',
    rating: { food: 5, service: 4, atmosphere: 1 },
    comment: 'Good food specially biriyani. The taste is authentic and flavors are well-balanced. Service was good but could be faster during peak hours.',
    avatar: 'SA',
  },
  {
    id: 4,
    author: 'Rajesh Kumar',
    date: '3 months ago',
    source: 'Google',
    rating: { food: 5, service: 5, atmosphere: 4 },
    comment: 'Loved the butter chicken and garlic naan! Portions are generous and prices are reasonable. The chicken rolls are perfect for a quick snack.',
    avatar: 'RK',
  },
  {
    id: 5,
    author: 'Priya Das',
    date: '2 months ago',
    source: 'Google',
    rating: { food: 4, service: 5, atmosphere: 5 },
    comment: 'Great place for vegetarian options too! The paneer butter masala and veg biryani were delicious. Staff is very courteous and the place is clean.',
    avatar: 'PD',
  },
  {
    id: 6,
    author: 'Amit Singh',
    date: '1 month ago',
    source: 'Google',
    rating: { food: 5, service: 4, atmosphere: 4 },
    comment: 'Best chilli chicken in town! The Indo-Chinese section is amazing. Tried the schezwan fried rice and hakka noodles - both were excellent.',
    avatar: 'AS',
  },
  {
    id: 7,
    author: 'Sunita Roy',
    date: '4 months ago',
    source: 'Google',
    rating: { food: 4, service: 4, atmosphere: 4 },
    comment: 'Good value for money. The double egg chicken roll is a favorite. Takeaway service is quick and packaging is good.',
    avatar: 'SR',
  },
  {
    id: 8,
    author: 'Vikram Deb',
    date: '6 months ago',
    source: 'Google',
    rating: { food: 5, service: 5, atmosphere: 5 },
    comment: 'Mutton biryani is outstanding! Tender meat, perfectly cooked rice, and authentic flavors. Will definitely visit again.',
    avatar: 'VD',
  },
];

export const getAverageRating = () => {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => {
    const avg = (review.rating.food + review.rating.service + review.rating.atmosphere) / 3;
    return acc + avg;
  }, 0);
  return (sum / reviews.length).toFixed(1);
};

export const getTotalReviews = () => reviews.length;