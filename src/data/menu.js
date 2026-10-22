export const menuCategories = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Delicious appetizers to start your meal',
    items: [
      { id: 1, name: 'Ch. Pokora', description: '1 plate (6pcs)', price: '₹80', popular: true, vegetarian: false },
      { id: 2, name: 'Chicken Lollipop', description: '(6pcs)', price: '₹180', popular: true, vegetarian: false },
      { id: 3, name: 'Chilli Chicken Dry', description: 'Spicy dry chicken with peppers', price: '₹200', popular: true, vegetarian: false },
      { id: 4, name: 'Paneer Chilli Dry', description: 'Spicy dry paneer with peppers', price: '₹180', popular: true, vegetarian: true },
      { id: 5, name: 'Mushroom Chilli Dry', description: 'Spicy dry mushroom with peppers', price: '₹160', vegetarian: true },
      { id: 6, name: 'Egg Pokora', description: '(6pcs)', price: '₹60', vegetarian: false },
    ],
  },
  {
    id: 'biriyani',
    name: 'Biriyani',
    description: 'Aromatic biryani with premium basmati rice',
    items: [
      { id: 7, name: 'Chicken Biriyani', description: '(Half/Full)', price: '₹180/₹320', popular: true, vegetarian: false },
      { id: 8, name: 'Chicken Dum Biriyani', description: '(Half/Full)', price: '₹200/₹360', popular: true, vegetarian: false },
      { id: 9, name: 'Special Biriyani', description: 'Chef\'s special with mixed meats', price: '₹250/₹450', vegetarian: false },
    ],
  },
  {
    id: 'rice',
    name: 'Rice',
    description: 'Wok-tossed fried rice varieties',
    items: [
      { id: 10, name: 'Veg. Fried Rice', description: '(Half/Full)', price: '₹100/₹180', vegetarian: true },
      { id: 11, name: 'Egg Fried Rice', description: '(Half/Full)', price: '₹120/₹200', vegetarian: false },
      { id: 12, name: 'Chicken Fried Rice', description: '(Half/Full)', price: '₹140/₹240', popular: true, vegetarian: false },
      { id: 13, name: 'Egg Chicken Fried Rice', description: '(Half/Full)', price: '₹160/₹280', vegetarian: false },
      { id: 14, name: 'Mix Fried Rice', description: '(Half/Full)', price: '₹180/₹320', vegetarian: false },
    ],
  },
  {
    id: 'chowmin',
    name: 'Chowmin',
    description: 'Stir-fried noodles with vegetables and proteins',
    items: [
      { id: 15, name: 'Veg. Chow', description: '(Half/Full)', price: '₹100/₹180', vegetarian: true },
      { id: 16, name: 'Egg Chow', description: '(Half/Full)', price: '₹120/₹200', vegetarian: false },
      { id: 17, name: 'Chicken Chow', description: '(Half/Full)', price: '₹140/₹240', popular: true, vegetarian: false },
      { id: 18, name: 'Egg Chicken Chow', description: '(Half/Full)', price: '₹160/₹280', vegetarian: false },
    ],
  },
  {
    id: 'non-veg-gravy',
    name: 'Non Veg. Gravy',
    description: 'Rich and flavorful non-vegetarian curries',
    items: [
      { id: 19, name: 'Chicken Curry', description: 'Traditional home-style chicken curry', price: '₹180', popular: true, vegetarian: false },
      { id: 20, name: 'Chicken Butter Masala', description: '(2pcs/4pcs)', price: '₹200/₹360', popular: true, vegetarian: false },
      { id: 21, name: 'Chicken Kacha', description: '(2pcs/4pcs) - Bengali style', price: '₹200/₹360', vegetarian: false },
    ],
  },
  {
    id: 'veg-gravy',
    name: 'Veg. Gravy',
    description: 'Delicious vegetarian curries and gravies',
    items: [
      { id: 22, name: 'Paneer Butter Masala', description: '(Half/Full)', price: '₹180/₹320', popular: true, vegetarian: true },
      { id: 23, name: 'Paneer Do Pyaza', description: '(Half/Full)', price: '₹170/₹300', vegetarian: true },
      { id: 24, name: 'Kadai Paneer', description: '(Half/Full)', price: '₹180/₹320', vegetarian: true },
      { id: 25, name: 'Chilli Paneer', description: '(Half/Full) - Gravy style', price: '₹180/₹320', vegetarian: true },
      { id: 26, name: 'Chilli Mushroom', description: '(Half/Full) - Gravy style', price: '₹160/₹280', vegetarian: true },
    ],
  },
  {
    id: 'momos',
    name: 'Momos',
    description: 'Steamed and fried Tibetan dumplings',
    items: [
      { id: 27, name: 'Steam Momo', description: '(Half/Full) - 6/12 pcs', price: '₹80/₹140', vegetarian: true },
      { id: 28, name: 'Fried Momo', description: '(Half/Full) - 6/12 pcs', price: '₹100/₹180', popular: true, vegetarian: true },
      { id: 29, name: 'Pan Fried Momo', description: 'Crispy pan-fried dumplings', price: '₹120', vegetarian: true },
    ],
  },
  {
    id: 'combo',
    name: 'Combo',
    description: 'Value combo meals',
    items: [
      { id: 30, name: 'Chowmin + Chilli Chicken', description: 'Half chowmin + half chilli chicken', price: '₹200', popular: true, vegetarian: false },
      { id: 31, name: 'Fried Rice + Chilli Chicken', description: 'Half fried rice + half chilli chicken', price: '₹200', vegetarian: false },
      { id: 32, name: 'Chicken Kasha', description: 'With rice/roti', price: '₹220', vegetarian: false },
      { id: 33, name: 'Chicken Butter Masala', description: 'With rice/roti', price: '₹220', vegetarian: false },
    ],
  },
  {
    id: 'roll',
    name: 'Roll',
    description: 'Fresh paratha wraps with tasty fillings',
    items: [
      { id: 34, name: 'Egg Roll', description: 'Scrambled egg with onions', price: '₹70', popular: true, vegetarian: false },
      { id: 35, name: 'Double Egg Roll', description: 'Double egg coating', price: '₹90', popular: true, vegetarian: false },
      { id: 36, name: 'Chicken Roll', description: 'Spiced chicken with onions', price: '₹100', popular: true, vegetarian: false },
      { id: 37, name: 'Egg Chicken Roll', description: 'Egg & chicken combination', price: '₹120', vegetarian: false },
      { id: 38, name: 'Paneer Roll', description: 'Spiced paneer with mint chutney', price: '₹90', vegetarian: true },
    ],
  },
  {
    id: 'tadka',
    name: 'Tadka',
    description: 'Flavorful tempered lentils and proteins',
    items: [
      { id: 39, name: 'Dal Tadka', description: 'Yellow lentils with cumin tempering', price: '₹40', vegetarian: true },
      { id: 40, name: 'Egg Tadka', description: 'Eggs in spiced lentil gravy', price: '₹50', vegetarian: false },
      { id: 41, name: 'Chicken Tadka', description: 'Chicken in spiced lentil gravy', price: '₹60', popular: true, vegetarian: false },
      { id: 42, name: 'Egg Chicken Tadka', description: 'Egg & chicken in lentil gravy', price: '₹70', vegetarian: false },
    ],
  },
  {
    id: 'soup',
    name: 'Soup',
    description: 'Warm and comforting soups',
    items: [
      { id: 43, name: 'Veg Soup', description: 'Mixed vegetable clear soup', price: '₹80', vegetarian: true },
      { id: 44, name: 'Chicken Soup', description: 'Chicken clear soup with herbs', price: '₹100', vegetarian: false },
    ],
  },
  {
    id: 'bread',
    name: 'Bread',
    description: 'Freshly made Indian breads',
    items: [
      { id: 45, name: 'Lachha Paratha', description: 'Layered whole wheat flatbread', price: '₹20', vegetarian: true },
      { id: 46, name: 'Butter Lachha Paratha', description: 'Layered flatbread with butter', price: '₹25', vegetarian: true },
      { id: 47, name: 'Tawa Roti', description: 'Plain whole wheat roti', price: '₹10', vegetarian: true },
      { id: 48, name: 'Puri Sabji', description: 'Fried bread with potato curry', price: '₹20', vegetarian: true },
      { id: 49, name: 'Dal Puri Sabji', description: 'Lentil-stuffed puri with curry', price: '₹30', vegetarian: true },
    ],
  },
  {
    id: 'salad',
    name: 'Salad',
    description: 'Fresh and crunchy salads',
    items: [
      { id: 50, name: 'Green Salad', description: 'Mixed greens with dressing', price: '₹70', vegetarian: true },
      { id: 51, name: 'Onion Salad', description: 'Sliced onions with lemon & spices', price: '₹40', vegetarian: true },
    ],
  },
];

export const getAllMenuItems = () => menuCategories.flatMap(cat => cat.items);
export const getPopularItems = () => getAllMenuItems().filter(item => item.popular);
export const getMenuCategories = () => menuCategories;