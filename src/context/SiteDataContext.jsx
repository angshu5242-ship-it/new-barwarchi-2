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
import { defaultSiteConfig, normalizeSiteConfig } from '../data/delivery';
import { getSiteSettings, saveSiteContent, saveSiteMenuStyle } from '../utils/siteApi';

const STORAGE_KEYS = {
  // Versioned keys keep the new Bawarchi Puja Special menu from being hidden
  // by an older menu saved in the same browser.
  categories: 'nb2_puja_menu_categories',
  gallery: 'nb2_gallery_images',
  hero: 'nb2_hero_images',
  info: 'nb2_puja_restaurant_info',
  style: 'nb2_menu_style',
};

// Vercel limits a serverless request body to about 4.5 MB. Keep a safety
// margin so the API can return a useful message before that hard limit.
const MAX_SITE_CONTENT_BYTES = 3_500_000;

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
  const next = { ...defaultRestaurantInfo, ...info };
  const url = String(next.googleListingUrl || '');
  if (!url.includes('/maps/place/') || /0x0:0x/i.test(url)) {
    next.googleListingUrl = defaultRestaurantInfo.googleListingUrl;
  }
  return next;
}

function normalizeContent(content) {
  return {
    categories: mergeCategoriesWithDefaults(content?.categories),
    galleryImages: normalizeGallery(content?.galleryImages),
    heroImages: normalizeHero(content?.heroImages),
    restaurantInfo: normalizeInfo(content?.restaurantInfo),
  };
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

function cacheContent(content) {
  try {
    localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(content.categories));
    localStorage.setItem(STORAGE_KEYS.gallery, JSON.stringify(content.galleryImages));
    localStorage.setItem(STORAGE_KEYS.hero, JSON.stringify(content.heroImages));
    localStorage.setItem(STORAGE_KEYS.info, JSON.stringify(content.restaurantInfo));
  } catch {
    // The online copy is the source of truth. A full browser cache should not
    // stop an admin save from reaching Neon.
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
  const [remoteState, setRemoteState] = useState('loading');
  const [contentPublished, setContentPublished] = useState(false);
  const [siteConfig, setSiteConfig] = useState(defaultSiteConfig);
  const [soldOut, setSoldOut] = useState([]);

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
    getSiteSettings()
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setRemoteState('offline');
          return;
        }

        const settings = result.data?.settings || {};

        if (settings.config) {
          setSiteConfig(normalizeSiteConfig(settings.config));
        }
        setSoldOut(settings.availability?.soldOut || []);

        if (settings.menuStyle) {
          const next = sanitizeMenuStyle(settings.menuStyle);
          setMenuStyle(next);
          try {
            localStorage.setItem(STORAGE_KEYS.style, JSON.stringify(next));
          } catch {
            // Best effort only.
          }
        }

        if (settings.siteContent) {
          const next = normalizeContent(settings.siteContent);
          setCategories(next.categories);
          setGalleryImages(next.galleryImages);
          setHeroImages(next.heroImages);
          setRestaurantInfo(next.restaurantInfo);
          cacheContent(next);
          setContentPublished(true);
          setLastSavedAt(
            settings.siteContentUpdatedAt ? new Date(settings.siteContentUpdatedAt) : new Date(),
          );
        } else {
          setContentPublished(false);
        }

        setStorageBytes(getStoredSize());
        setRemoteState(result.data?.persisted ? 'online' : 'offline');
      })
      .catch(() => {
        if (!cancelled) setRemoteState('offline');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshSiteConfig = useCallback(async () => {
    const result = await getSiteSettings();
    if (!result.ok) return result;
    const settings = result.data?.settings || {};
    if (settings.config) setSiteConfig(normalizeSiteConfig(settings.config));
    setSoldOut(settings.availability?.soldOut || []);
    return result;
  }, []);

  const isSoldOut = useCallback(
    (itemOrId) => {
      const id = typeof itemOrId === 'object' ? itemOrId?.id : itemOrId;
      return soldOut.includes(String(id));
    },
    [soldOut],
  );

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') refreshSiteConfig();
    };
    const timer = window.setInterval(refreshIfVisible, 60000);
    document.addEventListener('visibilitychange', refreshIfVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
  }, [refreshSiteConfig]);

  const saveAll = useCallback(
    async (next = {}, adminPassword) => {
      const nextContent = {
        categories: next.categories ?? categories,
        galleryImages: next.galleryImages ?? galleryImages,
        heroImages: next.heroImages ?? heroImages,
        restaurantInfo: next.restaurantInfo ?? restaurantInfo,
      };

      let serialized = '';
      try {
        serialized = JSON.stringify(nextContent);
      } catch {
        return {
          ok: false,
          persisted: false,
          localSaved: false,
          error: 'The content could not be prepared for saving. Please remove the last change and try again.',
        };
      }

      if (serialized.length > MAX_SITE_CONTENT_BYTES) {
        return {
          ok: false,
          persisted: false,
          localSaved: false,
          error:
            'This content is too large to publish online. Remove a few uploaded photos or use image URLs, then save again.',
        };
      }

      const normalized = normalizeContent(nextContent);
      cacheContent(normalized);
      setCategories(normalized.categories);
      setGalleryImages(normalized.galleryImages);
      setHeroImages(normalized.heroImages);
      setRestaurantInfo(normalized.restaurantInfo);
      setStorageBytes(getStoredSize());

      if (!adminPassword) {
        setLastSavedAt(new Date());
        return { ok: true, persisted: false, localSaved: true };
      }

      const result = await saveSiteContent(nextContent, adminPassword);
      if (!result.ok) {
        return {
          ok: false,
          persisted: false,
          localSaved: true,
          error:
            result.error ||
            'The changes were saved on this device but could not be published to Neon.',
        };
      }

      if (result.data?.siteContent) {
        const saved = normalizeContent(result.data.siteContent);
        cacheContent(saved);
        setCategories(saved.categories);
        setGalleryImages(saved.galleryImages);
        setHeroImages(saved.heroImages);
        setRestaurantInfo(saved.restaurantInfo);
      }

      setStorageBytes(getStoredSize());
      setLastSavedAt(
        result.data?.updatedAt ? new Date(result.data.updatedAt) : new Date(),
      );
      setRemoteState(result.data?.persisted ? 'online' : 'offline');
      setContentPublished(Boolean(result.data?.persisted));

      return {
        ok: true,
        persisted: Boolean(result.data?.persisted),
        localSaved: true,
      };
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
      setRemoteState(result.data?.persisted ? 'online' : 'offline');
      return {
        ok: true,
        style: saved,
        persisted: Boolean(result.data?.persisted),
      };
    },
    [applyMenuStyle],
  );

  const resetAll = useCallback(
    async (adminPassword) => {
      Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
      setMenuStyle(defaultMenuStyle);
      setStorageBytes(getStoredSize());

      const contentResult = await saveAll(
        {
          categories: defaultMenuCategories,
          galleryImages: defaultGalleryImages,
          heroImages: defaultHeroImages,
          restaurantInfo: defaultRestaurantInfo,
        },
        adminPassword,
      );

      let styleResult = { ok: true, persisted: false };
      if (adminPassword) {
        styleResult = await saveMenuStyle(defaultMenuStyle, adminPassword);
      }

      return {
        ok: contentResult.ok && styleResult.ok,
        persisted: Boolean(contentResult.persisted && styleResult.persisted),
        error: contentResult.error || styleResult.error || '',
      };
    },
    [saveAll, saveMenuStyle],
  );

  const importData = useCallback(
    (data, adminPassword) => {
      if (!data || typeof data !== 'object') {
        return Promise.resolve({ ok: false, error: 'Invalid backup file.' });
      }
      return saveAll(
        {
          categories: data.categories ?? data.menuCategories ?? categories,
          galleryImages: data.galleryImages ?? data.gallery ?? galleryImages,
          heroImages: data.heroImages ?? heroImages,
          restaurantInfo: data.restaurantInfo ?? data.info ?? restaurantInfo,
        },
        adminPassword,
      );
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
      remoteState,
      contentPublished,
      siteConfig,
      soldOut,
      isSoldOut,
      setSoldOut,
      refreshSiteConfig,
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
      remoteState,
      contentPublished,
      siteConfig,
      soldOut,
      isSoldOut,
      setSoldOut,
      refreshSiteConfig,
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
