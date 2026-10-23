const unsplash = (id, width = 1000, height) => {
  const params = new URLSearchParams({
    auto: 'format',
    fit: 'crop',
    w: String(width),
    q: '82',
  });
  if (height) params.set('h', String(height));
  return `https://images.unsplash.com/${id}?${params.toString()}`;
};

/**
 * Central photo library. Keeping the URLs in one place makes it easy to
 * swap in real restaurant photography later without touching the menu data.
 */
export const foodImages = {
  biryani: unsplash('photo-1631515243349-e0cb75fb8d3a', 1200),
  butterChicken: unsplash('photo-1603894584373-5ac82b2ae398', 1200),
  roll: unsplash('photo-1719282431565-3b30bb7d2658', 1200),
  friedRice: unsplash('photo-1603133872878-684f208fb84b', 1200),
  paneer: unsplash('photo-1631452180519-c014fe946bc7', 1200),
  paneerTikka: unsplash('photo-1565557623262-b51c2513a641', 1200),
  chilliChicken: unsplash('photo-1710508774177-7ac2f3492675', 1200),
  tandoor: unsplash('photo-1514933651103-005eec06c04b', 1200),
  momos: unsplash('photo-1563245372-f21724e3856d', 1200),
  noodles: unsplash('photo-1585032226651-759b368d7246', 1200),
  soup: unsplash('photo-1547592166-23ac45744acd', 1200),
  salad: unsplash('photo-1512621776951-a57141f2eefd', 1200),
  bread: unsplash('photo-1640625314547-aee9a7696589', 1200),
  thali: unsplash('photo-1546833999-b9f581a1996d', 1200),
  egg: unsplash('photo-1525351484163-7529414344d8', 1200),
  friedChicken: unsplash('photo-1527477396000-e27163b481c2', 1200),
  interior: unsplash('photo-1517248135467-4c7edcad34c4', 1200),
  interior2: unsplash('photo-1552566626-52f8b828add9', 1200),
  ambience: unsplash('photo-1559339352-11d035aa65de', 1200),
  dining: unsplash('photo-1414235077428-338989a2e8c0', 1200),
};

export const categoryImages = {
  starter: foodImages.friedChicken,
  biriyani: foodImages.biryani,
  rice: foodImages.friedRice,
  chowmin: foodImages.noodles,
  'non-veg-gravy': foodImages.butterChicken,
  'veg-gravy': foodImages.paneer,
  momos: foodImages.momos,
  combo: foodImages.thali,
  roll: foodImages.roll,
  tadka: foodImages.thali,
  soup: foodImages.soup,
  bread: foodImages.bread,
  salad: foodImages.salad,
};

export const categoryIcons = {
  starter: '🍢',
  biriyani: '🍛',
  rice: '🍚',
  chowmin: '🍜',
  'non-veg-gravy': '🍗',
  'veg-gravy': '🥘',
  momos: '🥟',
  combo: '🍱',
  roll: '🌯',
  tadka: '🥣',
  soup: '🍲',
  bread: '🫓',
  salad: '🥗',
};
