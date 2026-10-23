import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { menuCategories as defaultMenuCategories } from '../data/menu';
import { galleryImages as defaultGalleryImages } from '../data/gallery';
import { heroImages as defaultHeroImages, restaurantInfo as defaultRestaurantInfo } from '../data/site';
import { defaultMenuStyle, sanitizeMenuStyle } from '../data/menuStyles';
import { getSiteSettings, saveSiteMenuStyle } from '../utils/siteApi';

const STORAGE_KEYS = {
  // Versioned keys keep the new Bawarchi Puja Special menu from being hidden
  // by an older menu saved in the same browser.
  categories: 'nb2_puja_menu_categories',
  gallery: 'nb2_gallery_images',
  hero: 'nb2_hero_images',
  info: 'nb2_puja_restaurant_info',
  style: 'nb2_menu_style',
};

const SiteDataContext = createContext(null);

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function mergeCategoriesWithDefaults(categories) {
  if (!Array.isArray(categories)) return defaultMenuCategories;

  return categories.map((category) => {
    const defaultCategory = defaultMenuCategories.find((item) => item.id === category.id);
    const items = Array.isArray(category.items) ? category.items : [];

    return {
      ...defaultCategory,
      ...category,
      description: category.description ?? defaultCategory?.description ?? '',
      icon: category.icon ?? defaultCategory?.icon ?? '🍽️',
      image: category.image === undefined ? defaultCategory?.image : category.image,
      items: items.map((item) => {
        const defaultItem = defaultCategory?.items?.find(
          (candidate) => candidate.id === item.id || candidate.name === item.name,
        );

        return {
          ...defaultItem,
          ...item,
          vegetarian: Boolean(item.vegetarian),
          popular: Boolean(item.popular),
          spicy: item.spicy ?? defaultItem?.spicy ?? false,
          chefSpecial: item.chefSpecial ?? defaultItem?.chefSpecial ?? false,
          image: item.image === undefined ? defaultItem?.image : item.image,
        };
      }),
    };
  });
}

function normalizeGallery(images) {
  if (!Array.isArray(images)) return defaultGalleryImages;
  return images.map((image, index) => ({
    id: image.id ?? `gallery-${index}`,
    src: image.src || image.url || '',
    alt: image.alt || image.caption || 'New Bawarchi 2',
    category: image.category || 'food',
    caption: image.caption || '',
  }));
}

function normalizeHero(images) {
  if (!Array.isArray(images)) return defaultHeroImages;
  return images.map((image, index) => ({
    id: image.id ?? `hero-${index}`,
    src: image.src || image.url || '',
    alt: image.alt || image.caption || 'New Bawarchi 2',
    caption: image.caption || image.alt || '',
    active: Boolean(image.active),
  }));
}

function normalizeInfo(info) {
  if (!info || typeof info !== 'object') return defaultRestaurantInfo;
  return { ...defaultRestaurantInfo, ...info };
}

function getStoredSize() {
  try {
    return Object.values(STORAGE_KEYS).reduce(
      (sum, key) => sum + (localStorage.getItem(key)?.length || 0) * 2,
      0,
    );
  } catch {
    return 0;
  }
}

export function SiteDataProvider({ children }) {
  const [categories, setCategories] = useState(() =>
    mergeCategoriesWithDefaults(readJson(STORAGE_KEYS.categories, defaultMenuCategories)),
  );
  const [galleryImages, setGalleryImages] = useState(() =>
    normalizeGallery(readJson(STORAGE_KEYS.gallery, defaultGalleryImages)),
  );
  const [heroImages, setHeroImages] = useState(() =>
    normalizeHero(readJson(STORAGE_KEYS.hero, defaultHeroImages)),
  );
  const [restaurantInfo, setRestaurantInfo] = useState(() =>
    normalizeInfo(readJson(STORAGE_KEYS.info, defaultRestaurantInfo)),
  );
  const [menuStyle, setMenuStyle] = useState(() =>
    sanitizeMenuStyle(readJson(STORAGE_KEYS.style, defaultMenuStyle)),
  );
  const [storageBytes, setStorageBytes] = useState(getStoredSize);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  useEffect(() => {
    const handleStorage = (event) => {
      if (!event.key) return;
      if (event.key === STORAGE_KEYS.categories) {
        setCategories(mergeCategoriesWithDefaults(readJson(STORAGE_KEYS.categories, defaultMenuCategories)));
      }
      if (event.key === STORAGE_KEYS.gallery) {
        setGalleryImages(normalizeGallery(readJson(STORAGE_KEYS.gallery, defaultGalleryImages)));
      }
      if (event.key === STORAGE_KEYS.hero) {
        setHeroImages(normalizeHero(readJson(STORAGE_KEYS.hero, defaultHeroImages)));
      }
      if (event.key === STORAGE_KEYS.info) {
        setRestaurantInfo(normalizeInfo(readJson(STORAGE_KEYS.info, defaultRestaurantInfo)));
      }
      if (event.key === STORAGE_KEYS.style) {
        setMenuStyle(sanitizeMenuStyle(readJson(STORAGE_KEYS.style, defaultMenuStyle)));
      }
      setStorageBytes(getStoredSize());
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getSiteSettings().then((result) => {
      if (cancelled || !result.ok) return;
      const remote = result.data?.settings?.menuStyle;
      if (!remote) return;
      const next = sanitizeMenuStyle(remote);
      setMenuStyle(next);
      try {
        localStorage.setItem(STORAGE_KEYS.style, JSON.stringify(next));
      } catch {
        // Best effort only.
      }
      setStorageBytes(getStoredSize());
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveAll = useCallback(
    (next = {}) => {
      const nextCategories = next.categories ?? categories;
      const nextGallery = next.galleryImages ?? galleryImages;
      const nextHero = next.heroImages ?? heroImages;
      const nextInfo = next.restaurantInfo ?? restaurantInfo;

      const previous = Object.fromEntries(
        Object.values(STORAGE_KEYS).map((key) => [key, localStorage.getItem(key)]),
      );

      try {
        localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(nextCategories));
        localStorage.setItem(STORAGE_KEYS.gallery, JSON.stringify(nextGallery));
        localStorage.setItem(STORAGE_KEYS.hero, JSON.stringify(nextHero));
        localStorage.setItem(STORAGE_KEYS.info, JSON.stringify(nextInfo));

        setCategories(mergeCategoriesWithDefaults(nextCategories));
        setGalleryImages(normalizeGallery(nextGallery));
        setHeroImages(normalizeHero(nextHero));
        setRestaurantInfo(normalizeInfo(nextInfo));
        setStorageBytes(getStoredSize());
        setLastSavedAt(new Date());
        return { ok: true };
      } catch (error) {
        // A quota error can happen halfway through. Put the previous values back
        // so a failed save never leaves the site in a mixed state.
        Object.entries(previous).forEach(([key, value]) => {
          try {
            if (value === null) localStorage.removeItem(key);
            else localStorage.setItem(key, value);
          } catch {
            // Best effort only.
          }
        });
        setStorageBytes(getStoredSize());
        return { ok: false, error };
      }
    },
    [categories, galleryImages, heroImages, restaurantInfo],
  );

  const applyMenuStyle = useCallback((style) => {
    const next = sanitizeMenuStyle(style);
    setMenuStyle(next);
    try {
      localStorage.setItem(STORAGE_KEYS.style, JSON.stringify(next));
    } catch {
      // The style still applies in this tab if storage is unavailable.
    }
    setStorageBytes(getStoredSize());
    setLastSavedAt(new Date());
    return next;
  }, []);

  const saveMenuStyle = useCallback(
    async (style, adminPassword) => {
      const next = applyMenuStyle(style);
      if (!adminPassword) return { ok: true, style: next, persisted: false };

      const result = await saveSiteMenuStyle(next, adminPassword);
      if (!result.ok) {
        return {
          ok: false,
          style: next,
          persisted: false,
          error: result.error || 'The style was saved on this device but not on the server.',
        };
      }

      const saved = result.data?.style ? applyMenuStyle(result.data.style) : next;
      return {
        ok: true,
        style: saved,
        persisted: Boolean(result.data?.persisted),
      };
    },
    [applyMenuStyle],
  );

  const resetAll = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    setCategories(defaultMenuCategories);
    setGalleryImages(defaultGalleryImages);
    setHeroImages(defaultHeroImages);
    setRestaurantInfo(defaultRestaurantInfo);
    setMenuStyle(defaultMenuStyle);
    setStorageBytes(getStoredSize());
    setLastSavedAt(null);
  }, []);

  const importData = useCallback(
    (data) => {
      if (!data || typeof data !== 'object') return { ok: false, error: new Error('Invalid backup file.') };
      return saveAll({
        categories: data.categories ?? data.menuCategories ?? categories,
        galleryImages: data.galleryImages ?? data.gallery ?? galleryImages,
        heroImages: data.heroImages ?? heroImages,
        restaurantInfo: data.restaurantInfo ?? data.info ?? restaurantInfo,
      });
    },
    [categories, galleryImages, heroImages, restaurantInfo, saveAll],
  );

  const allItems = useMemo(
    () =>
      categories.flatMap((category) =>
        category.items.map((item) => ({
          ...item,
          categoryId: category.id,
          categoryName: category.name,
          categoryImage: category.image,
        })),
      ),
    [categories],
  );

  const popularItems = useMemo(() => {
    const flagged = allItems.filter((item) => item.popular);
    if (flagged.length >= 4) return flagged;
    const extras = allItems.filter((item) => !flagged.includes(item));
    return [...flagged, ...extras].slice(0, 4);
  }, [allItems]);

  const activeHero =
    heroImages.find((image) => image.active) || heroImages[0] || defaultHeroImages[0];

  const getItemImage = useCallback(
    (item, category) => item?.image || category?.image || '',
    [],
  );

  const value = useMemo(
    () => ({
      categories,
      galleryImages,
      heroImages,
      restaurantInfo,
      menuStyle,
      activeHero,
      allItems,
      popularItems,
      storageBytes,
      lastSavedAt,
      saveAll,
      resetAll,
      importData,
      getItemImage,
      applyMenuStyle,
      saveMenuStyle,
      defaults: {
        categories: defaultMenuCategories,
        galleryImages: defaultGalleryImages,
        heroImages: defaultHeroImages,
        restaurantInfo: defaultRestaurantInfo,
        menuStyle: defaultMenuStyle,
      },
    }),
    [
      categories,
      galleryImages,
      heroImages,
      restaurantInfo,
      menuStyle,
      activeHero,
      allItems,
      popularItems,
      storageBytes,
      lastSavedAt,
      saveAll,
      resetAll,
      importData,
      getItemImage,
      applyMenuStyle,
      saveMenuStyle,
    ],
  );

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
}

export function useSiteData() {
  const context = useContext(SiteDataContext);
  if (!context) throw new Error('useSiteData must be used inside a SiteDataProvider');
  return context;
}
