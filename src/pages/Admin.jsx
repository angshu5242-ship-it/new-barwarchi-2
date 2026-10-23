import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSiteData } from '../context/SiteDataContext';
import ImagePicker from '../components/ImagePicker';
import FoodImage from '../components/FoodImage';
import MenuStyleStudio from '../components/MenuStyleStudio';
import StaffManager from '../components/StaffManager';
import { compressImage, formatBytes } from '../utils/image';
import { averagePrice, formatINR } from '../utils/price';
import { getAdminOrders, patchOrderStatus } from '../utils/orderApi';

const ADMIN_PASSWORD = 'nb2admin2024';
const AUTH_KEY = 'nb2_admin_auth';
const STORAGE_BUDGET = 5 * 1024 * 1024;
const ORDER_STATUSES = [
  { id: 'new', label: 'New' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'ready', label: 'Ready' },
  { id: 'out-for-delivery', label: 'Out for delivery' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const clone = (value) => JSON.parse(JSON.stringify(value));
const uid = (prefix = 'id') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const slugify = (value) =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || uid('category');

const tabs = [
  { id: 'dashboard', label: 'Overview', icon: '▦' },
  { id: 'orders', label: 'Orders', icon: '🧾' },
  { id: 'staff', label: 'Staff access', icon: '👥' },
  { id: 'menu', label: 'Menu & photos', icon: '🍛' },
  { id: 'style', label: 'Menu style', icon: '🎨' },
  { id: 'gallery', label: 'Gallery', icon: '🖼️' },
  { id: 'homepage', label: 'Homepage', icon: '🏠' },
  { id: 'settings', label: 'Restaurant details', icon: '⚙️' },
];

function readAuth() {
  try {
    return sessionStorage.getItem(AUTH_KEY) === 'true';
  } catch {
    return false;
  }
}

function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (password === ADMIN_PASSWORD) {
      onLogin();
    } else {
      setError('That password is not correct. Please try again.');
      setPassword('');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fff6e6] via-[#fffdf8] to-[#f1e5d2] px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 font-display text-xl font-bold text-white shadow-sm">
            N2
          </span>
          <span>
            <span className="block font-display text-2xl font-semibold text-gray-900">New Bawarchi 2</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-700">
              Kitchen admin
            </span>
          </span>
        </Link>

        <div className="mt-7 rounded-3xl border border-surface-200 bg-white p-6 shadow-strong sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Staff access</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-gray-900">Welcome back</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Sign in to manage the menu, food photos and restaurant details.
          </p>

          <form onSubmit={handleSubmit} className="mt-6">
            <label htmlFor="admin-password" className="label">Password</label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError('');
                }}
                className="input-field pr-16"
                placeholder="Enter admin password"
                autoComplete="current-password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-brand-700"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {error && (
              <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary mt-5 w-full">
              Enter admin
            </button>
          </form>

          <div className="mt-5 border-t border-surface-200 pt-4 text-center">
            <Link to="/" className="text-sm font-semibold text-brand-700 hover:underline">
              ← Back to the website
            </Link>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-gray-500">
          Private area for New Bawarchi 2 staff.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, detail, icon }) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">{label}</p>
        <span className="text-xl" aria-hidden="true">{icon}</span>
      </div>
      <p className="mt-2 font-display text-3xl font-semibold text-gray-900">{value}</p>
      {detail && <p className="mt-1 text-xs leading-relaxed text-gray-500">{detail}</p>}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label
      className={`inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
        checked
          ? 'border-brand-300 bg-brand-50 text-brand-800'
          : 'border-surface-200 bg-white text-gray-500 hover:border-surface-300'
      }`}
    >
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span
        className={`flex h-3 w-3 items-center justify-center rounded-full border ${
          checked ? 'border-brand-600 bg-brand-600' : 'border-surface-300 bg-white'
        }`}
        aria-hidden="true"
      >
        {checked && <span className="h-1 w-1 rounded-full bg-white" />}
      </span>
      {label}
    </label>
  );
}

function ActionButton({ label, onClick, disabled, children, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
        danger
          ? 'border-rose-200 bg-white text-rose-600 hover:bg-rose-50'
          : 'border-surface-200 bg-white text-gray-500 hover:border-brand-300 hover:text-brand-700'
      }`}
    >
      {children}
    </button>
  );
}

function ItemEditor({
  item,
  index,
  total,
  onUpdate,
  onPickImage,
  onDelete,
  onDuplicate,
  onMove,
}) {
  return (
    <div className="rounded-xl border border-surface-200 bg-white p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <button
          type="button"
          onClick={onPickImage}
          className="group relative h-24 w-full flex-shrink-0 overflow-hidden rounded-xl border border-surface-200 bg-brand-50 sm:w-28"
          aria-label={`Change photo for ${item.name}`}
        >
          <FoodImage
            src={item.image}
            alt={item.name}
            fallback={item.vegetarian ? '🥬' : '🍗'}
            className="h-full w-full object-cover"
          />
          <span className="absolute inset-x-0 bottom-0 bg-stone-950/80 py-1 text-center text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
            Change photo
          </span>
        </button>

        <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[1fr_7rem]">
          <div className="sm:col-span-2">
            <label htmlFor={`item-name-${item.id}`} className="sr-only">Dish name</label>
            <input
              id={`item-name-${item.id}`}
              value={item.name}
              onChange={(event) => onUpdate({ name: event.target.value })}
              placeholder="Dish name"
              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor={`item-desc-${item.id}`} className="sr-only">Description</label>
            <input
              id={`item-desc-${item.id}`}
              value={item.description || ''}
              onChange={(event) => onUpdate({ description: event.target.value })}
              placeholder="Short description"
              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs text-gray-600 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor={`item-price-${item.id}`} className="sr-only">Price</label>
            <input
              id={`item-price-${item.id}`}
              value={item.price || ''}
              onChange={(event) => onUpdate({ price: event.target.value })}
              placeholder="₹180/₹320"
              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-right text-xs font-bold text-brand-800 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-row gap-1 sm:flex-col">
          <ActionButton label="Move dish up" onClick={() => onMove(-1)} disabled={index === 0}>
            ↑
          </ActionButton>
          <ActionButton label="Move dish down" onClick={() => onMove(1)} disabled={index === total - 1}>
            ↓
          </ActionButton>
          <ActionButton label={`Duplicate ${item.name}`} onClick={onDuplicate}>⧉</ActionButton>
          <ActionButton label={`Delete ${item.name}`} onClick={onDelete} danger>✕</ActionButton>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-surface-100 pt-2.5">
        <Toggle checked={Boolean(item.vegetarian)} onChange={(event) => onUpdate({ vegetarian: event.target.checked })} label="Veg" />
        <Toggle checked={Boolean(item.popular)} onChange={(event) => onUpdate({ popular: event.target.checked })} label="Popular" />
        <Toggle checked={Boolean(item.spicy)} onChange={(event) => onUpdate({ spicy: event.target.checked })} label="Spicy" />
        <Toggle checked={Boolean(item.chefSpecial)} onChange={(event) => onUpdate({ chefSpecial: event.target.checked })} label="Chef’s pick" />
        <span className="ml-auto text-[10px] text-gray-400">ID {item.id}</span>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
        >
          Delete dish
        </button>
      </div>
    </div>
  );
}

function CategoryEditor({
  category,
  index,
  total,
  onUpdate,
  onPickImage,
  onDelete,
  onMove,
  onAddItem,
  onUpdateItem,
  onPickItemImage,
  onDeleteItem,
  onDuplicateItem,
  onMoveItem,
}) {
  const photoCount = category.items.filter((item) => item.image).length;

  return (
    <section className="rounded-2xl border border-surface-200 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <button
          type="button"
          onClick={onPickImage}
          className="group relative h-24 w-full flex-shrink-0 overflow-hidden rounded-xl border border-surface-200 bg-brand-50 sm:w-32"
          aria-label={`Change photo for ${category.name} category`}
        >
          <FoodImage
            src={category.image}
            alt={category.name}
            fallback={category.icon || '🍽️'}
            className="h-full w-full object-cover"
          />
          <span className="absolute inset-x-0 bottom-0 bg-stone-950/80 py-1 text-center text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
            Change cover
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="grid min-w-0 flex-1 gap-2">
              <div>
                <label htmlFor={`cat-name-${category.id}`} className="sr-only">Category name</label>
                <input
                  id={`cat-name-${category.id}`}
                  value={category.name}
                  onChange={(event) => onUpdate({ name: event.target.value })}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 font-display text-lg font-semibold text-gray-900 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor={`cat-desc-${category.id}`} className="sr-only">Category description</label>
                <input
                  id={`cat-desc-${category.id}`}
                  value={category.description || ''}
                  onChange={(event) => onUpdate({ description: event.target.value })}
                  placeholder="A short line shown above this section"
                  className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs text-gray-600 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex flex-row gap-1 sm:flex-col">
              <ActionButton label="Move category up" onClick={() => onMove(-1)} disabled={index === 0}>↑</ActionButton>
              <ActionButton label="Move category down" onClick={() => onMove(1)} disabled={index === total - 1}>↓</ActionButton>
              <ActionButton label={`Delete ${category.name} category`} onClick={onDelete} danger>✕</ActionButton>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {category.items.length} dishes · {photoCount} with their own photo · icon {category.icon || '🍽️'}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2 border-t border-surface-100 pt-4">
        {category.items.map((item, itemIndex) => (
          <ItemEditor
            key={item.id}
            item={item}
            index={itemIndex}
            total={category.items.length}
            onUpdate={(patch) => onUpdateItem(item.id, patch)}
            onPickImage={() => onPickItemImage(item)}
            onDelete={() => onDeleteItem(item.id, item.name)}
            onDuplicate={() => onDuplicateItem(item.id)}
            onMove={(direction) => onMoveItem(item.id, direction)}
          />
        ))}

        <button
          type="button"
          onClick={onAddItem}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 px-4 py-3 text-sm font-semibold text-brand-800 transition-colors hover:border-brand-400 hover:bg-brand-50"
        >
          <span className="text-lg leading-none">＋</span>
          Add a dish to {category.name}
        </button>
      </div>
    </section>
  );
}

export default function Admin() {
  const {
    categories,
    galleryImages,
    heroImages,
    restaurantInfo,
    menuStyle,
    defaults,
    storageBytes,
    lastSavedAt,
    saveAll,
    resetAll,
    saveMenuStyle,
  } = useSiteData();

  const [authed, setAuthed] = useState(readAuth);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [draftCategories, setDraftCategories] = useState(() => clone(categories));
  const [draftGallery, setDraftGallery] = useState(() => clone(galleryImages));
  const [draftHero, setDraftHero] = useState(() => clone(heroImages));
  const [draftInfo, setDraftInfo] = useState(() => clone(restaurantInfo));
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState(null);
  const [picker, setPicker] = useState(null);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [ordersService, setOrdersService] = useState(null);
  const galleryInputRef = useRef(null);
  const importInputRef = useRef(null);

  const itemCount = useMemo(
    () => draftCategories.reduce((sum, category) => sum + category.items.length, 0),
    [draftCategories],
  );
  const itemPhotoCount = useMemo(
    () =>
      draftCategories.reduce(
        (sum, category) => sum + category.items.filter((item) => item.image).length,
        0,
      ),
    [draftCategories],
  );
  const allDraftItems = useMemo(
    () => draftCategories.flatMap((category) => category.items),
    [draftCategories],
  );
  const avgPrice = useMemo(() => averagePrice(allDraftItems), [allDraftItems]);
  const photoCount =
    itemPhotoCount +
    draftGallery.filter((image) => image.src).length +
    draftHero.filter((image) => image.src).length;
  const coverage = itemCount ? Math.round((itemPhotoCount / itemCount) * 100) : 0;
  const storagePercent = Math.min(100, Math.round((storageBytes / STORAGE_BUDGET) * 100));

  const showNotice = (type, message) => setNotice({ type, message, id: Date.now() });

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!dirty) {
      setDraftCategories(clone(categories));
      setDraftGallery(clone(galleryImages));
      setDraftHero(clone(heroImages));
      setDraftInfo(clone(restaurantInfo));
    }
  }, [categories, galleryImages, heroImages, restaurantInfo, dirty]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const markDirty = () => setDirty(true);

  useEffect(() => {
    document.title = 'Orders & menu admin | New Bawarchi 2';
    return () => {
      document.title = "New Bawarchi 2 - Belonia's Favorite Restaurant | South Tripura";
    };
  }, []);

  const loadOrders = async () => {
    setOrdersLoading(true);
    setOrdersError('');
    const result = await getAdminOrders(ADMIN_PASSWORD);
    setOrdersLoading(false);
    if (!result.ok) {
      setOrdersError(
        result.status === 401
          ? 'The order service rejected the admin password. Set ADMIN_PASSWORD to match the admin login.'
          : result.error || 'Could not load online orders.',
      );
      return;
    }
    setOrdersService(result.data?.service || null);
    setOrders(result.data?.orders || []);
  };

  useEffect(() => {
    if (authed && activeTab === 'orders') loadOrders();
    // loadOrders is intentionally recreated with the current admin session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, activeTab]);

  const changeOrderStatus = async (orderId, status) => {
    const result = await patchOrderStatus(orderId, status, ADMIN_PASSWORD);
    if (!result.ok) {
      showNotice('error', result.error || 'Could not update that order.');
      return;
    }
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, status: result.data.order?.status || status } : order,
      ),
    );
    showNotice('success', `Order ${orderId} marked ${status.replaceAll('-', ' ')}.`);
  };

  const handleLogin = () => {
    try {
      sessionStorage.setItem(AUTH_KEY, 'true');
    } catch {
      // Session storage can be unavailable in strict browser modes.
    }
    setAuthed(true);
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(AUTH_KEY);
    } catch {
      // Ignore.
    }
    setAuthed(false);
  };

  const handleSave = () => {
    const result = saveAll({
      categories: draftCategories,
      galleryImages: draftGallery,
      heroImages: draftHero,
      restaurantInfo: draftInfo,
    });

    if (result.ok) {
      setDirty(false);
      showNotice('success', 'Saved. Your menu, photos and details are up to date.');
    } else {
      const isQuota =
        result.error?.name === 'QuotaExceededError' ||
        /quota|storage/i.test(result.error?.message || '');
      showNotice(
        'error',
        isQuota
          ? 'Browser storage is full. Remove a few uploads or use image URLs, then save again.'
          : 'Could not save the changes. Please try again.',
      );
    }
  };

  const handleDiscard = () => {
    setDraftCategories(clone(categories));
    setDraftGallery(clone(galleryImages));
    setDraftHero(clone(heroImages));
    setDraftInfo(clone(restaurantInfo));
    setDirty(false);
    showNotice('success', 'Unsaved changes discarded.');
  };

  const handleResetAll = () => {
    const confirmed = window.confirm(
      'Reset everything to the original menu, photos and restaurant details? This cannot be undone.',
    );
    if (!confirmed) return;
    resetAll();
    setDraftCategories(clone(defaults.categories));
    setDraftGallery(clone(defaults.galleryImages));
    setDraftHero(clone(defaults.heroImages));
    setDraftInfo(clone(defaults.restaurantInfo));
    setDirty(false);
    showNotice('success', 'Everything has been reset to the original content.');
  };

  const handleExport = () => {
    const data = {
      version: 2,
      exportedAt: new Date().toISOString(),
      categories: draftCategories,
      galleryImages: draftGallery,
      heroImages: draftHero,
      restaurantInfo: draftInfo,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `new-bawarchi-2-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showNotice('success', 'Backup downloaded.');
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const importedCategories = data.categories ?? data.menuCategories;
      if (!Array.isArray(importedCategories)) {
        throw new Error('The backup does not contain a menu.');
      }
      setDraftCategories(importedCategories);
      if (data.galleryImages || data.gallery) {
        setDraftGallery(data.galleryImages ?? data.gallery);
      }
      if (data.heroImages) setDraftHero(data.heroImages);
      if (data.restaurantInfo || data.info) {
        setDraftInfo(data.restaurantInfo ?? data.info);
      }
      setDirty(true);
      showNotice('success', 'Backup loaded. Check the content, then click “Save changes”.');
    } catch (error) {
      showNotice('error', error.message || 'That file could not be imported.');
    }
  };

  const updateCategory = (categoryId, patch) => {
    setDraftCategories((prev) =>
      prev.map((category) => (category.id === categoryId ? { ...category, ...patch } : category)),
    );
    markDirty();
  };

  const updateItem = (categoryId, itemId, patch) => {
    setDraftCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              items: category.items.map((item) =>
                item.id === itemId ? { ...item, ...patch } : item,
              ),
            }
          : category,
      ),
    );
    markDirty();
  };

  const moveArrayItem = (list, index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= list.length) return list;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  };

  const moveCategory = (categoryId, direction) => {
    setDraftCategories((prev) => {
      const index = prev.findIndex((category) => category.id === categoryId);
      return moveArrayItem(prev, index, direction);
    });
    markDirty();
  };

  const moveItem = (categoryId, itemId, direction) => {
    setDraftCategories((prev) =>
      prev.map((category) => {
        if (category.id !== categoryId) return category;
        const index = category.items.findIndex((item) => item.id === itemId);
        return { ...category, items: moveArrayItem(category.items, index, direction) };
      }),
    );
    markDirty();
  };

  const addItem = (categoryId) => {
    const newItem = {
      id: uid('item'),
      name: 'New dish',
      description: 'Add a short description',
      price: '₹0',
      vegetarian: false,
      popular: false,
      spicy: false,
      chefSpecial: false,
      image: '',
    };
    setDraftCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? { ...category, items: [...category.items, newItem] }
          : category,
      ),
    );
    markDirty();
    setPicker({
      type: 'item',
      categoryId,
      itemId: newItem.id,
      value: '',
      title: 'Add a photo for the new dish',
      aspect: '4 / 3',
      maxWidth: 1000,
      maxHeight: 1000,
      quality: 0.76,
    });
  };

  const duplicateItem = (categoryId, itemId) => {
    setDraftCategories((prev) =>
      prev.map((category) => {
        if (category.id !== categoryId) return category;
        const sourceIndex = category.items.findIndex((item) => item.id === itemId);
        if (sourceIndex < 0) return category;
        const source = category.items[sourceIndex];
        const copy = { ...source, id: uid('item'), name: `${source.name} (copy)` };
        const items = [...category.items];
        items.splice(sourceIndex + 1, 0, copy);
        return { ...category, items };
      }),
    );
    markDirty();
  };

  const deleteItem = (categoryId, itemId, itemName = 'this dish') => {
    if (!window.confirm(`Delete “${itemName}” from the menu? This cannot be undone after you save.`)) return;
    setDraftCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? { ...category, items: category.items.filter((item) => item.id !== itemId) }
          : category,
      ),
    );
    markDirty();
    showNotice('success', `“${itemName}” removed. Click Save changes to publish.`);
  };

  const addCategory = () => {
    const name = newCategory.name.trim();
    if (!name) return;
    const baseId = slugify(name);
    const id = draftCategories.some((category) => category.id === baseId)
      ? `${baseId}-${Math.random().toString(36).slice(2, 5)}`
      : baseId;
    const category = {
      id,
      name,
      description: newCategory.description.trim() || 'A new section on the menu.',
      icon: '🍽️',
      image: '',
      items: [],
    };
    setDraftCategories((prev) => [...prev, category]);
    setNewCategory({ name: '', description: '' });
    setNewCategoryOpen(false);
    markDirty();
    showNotice('success', `“${name}” added. Add a dish or a cover photo next.`);
  };

  const deleteCategory = (categoryId, name) => {
    if (!window.confirm(`Delete the “${name}” section and all of its dishes?`)) return;
    setDraftCategories((prev) => prev.filter((category) => category.id !== categoryId));
    markDirty();
  };

  const updateGallery = (id, patch) => {
    setDraftGallery((prev) => prev.map((image) => (image.id === id ? { ...image, ...patch } : image)));
    markDirty();
  };

  const deleteGallery = (id) => {
    setDraftGallery((prev) => prev.filter((image) => image.id !== id));
    markDirty();
  };

  const moveGallery = (id, direction) => {
    setDraftGallery((prev) => {
      const index = prev.findIndex((image) => image.id === id);
      return moveArrayItem(prev, index, direction);
    });
    markDirty();
  };

  const addGalleryPhoto = () => {
    const image = {
      id: uid('gallery'),
      src: '',
      alt: 'New Bawarchi 2',
      category: 'food',
      caption: '',
    };
    setDraftGallery((prev) => [...prev, image]);
    markDirty();
    setPicker({
      type: 'gallery',
      id: image.id,
      value: '',
      title: 'Add a gallery photo',
      aspect: '4 / 3',
      maxWidth: 1600,
      maxHeight: 1200,
      quality: 0.76,
    });
  };

  const handleGalleryFiles = async (files) => {
    const imageFiles = Array.from(files || []).filter((file) => file.type.startsWith('image/'));
    if (!imageFiles.length) {
      showNotice('error', 'Please choose one or more image files.');
      return;
    }

    setGalleryUploading(true);
    const added = [];
    for (const file of imageFiles) {
      try {
        const result = await compressImage(file, {
          maxWidth: 1600,
          maxHeight: 1200,
          quality: 0.76,
        });
        added.push({
          id: uid('gallery'),
          src: result.dataUrl,
          alt: 'New Bawarchi 2',
          category: 'food',
          caption: '',
        });
      } catch {
        // Skip files that cannot be processed and continue with the rest.
      }
    }
    setGalleryUploading(false);

    if (added.length) {
      setDraftGallery((prev) => [...prev, ...added]);
      markDirty();
      showNotice('success', `${added.length} photo${added.length === 1 ? '' : 's'} added. Click Save changes to publish.`);
    } else {
      showNotice('error', 'No photos could be processed. Please try different files.');
    }
  };

  const updateHero = (id, patch) => {
    setDraftHero((prev) => prev.map((image) => (image.id === id ? { ...image, ...patch } : image)));
    markDirty();
  };

  const setHeroActive = (id) => {
    setDraftHero((prev) => prev.map((image) => ({ ...image, active: image.id === id })));
    markDirty();
  };

  const addHeroPhoto = () => {
    const image = {
      id: uid('hero'),
      src: '',
      alt: 'New Bawarchi 2',
      caption: '',
      active: draftHero.length === 0,
    };
    setDraftHero((prev) => [...prev, image]);
    markDirty();
    setPicker({
      type: 'hero',
      id: image.id,
      value: '',
      title: 'Add a homepage hero photo',
      aspect: '16 / 10',
      maxWidth: 1600,
      maxHeight: 1000,
      quality: 0.8,
    });
  };

  const deleteHero = (id) => {
    setDraftHero((prev) => {
      const next = prev.filter((image) => image.id !== id);
      if (next.length && !next.some((image) => image.active)) next[0] = { ...next[0], active: true };
      return next;
    });
    markDirty();
  };

  const updateInfo = (field, value) => {
    setDraftInfo((prev) => ({ ...prev, [field]: value }));
    markDirty();
  };

  const handlePickerSave = (value) => {
    if (!picker) return;
    if (picker.type === 'category') updateCategory(picker.id, { image: value });
    if (picker.type === 'item') updateItem(picker.categoryId, picker.itemId, { image: value });
    if (picker.type === 'gallery') updateGallery(picker.id, { src: value });
    if (picker.type === 'hero') updateHero(picker.id, { src: value });
  };

  const openItemPicker = (categoryId, item) => {
    setPicker({
      type: 'item',
      categoryId,
      itemId: item.id,
      value: item.image || '',
      title: `Photo for ${item.name}`,
      aspect: '4 / 3',
      maxWidth: 1000,
      maxHeight: 1000,
      quality: 0.76,
    });
  };

  const openCategoryPicker = (category) => {
    setPicker({
      type: 'category',
      id: category.id,
      value: category.image || '',
      title: `Cover photo for ${category.name}`,
      aspect: '4 / 3',
      maxWidth: 1200,
      maxHeight: 900,
      quality: 0.76,
    });
  };

  if (!authed) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-surface-50 pb-16">
      <header className="sticky top-0 z-40 border-b border-surface-200 bg-white">
        <div className="section-container flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2" aria-label="View website">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 font-display text-sm font-bold text-white">
                N2
              </span>
              <span className="hidden sm:block">
                <span className="block text-sm font-semibold leading-tight text-gray-900">Kitchen admin</span>
                <span className="block text-[10px] uppercase tracking-[0.16em] text-brand-700">New Bawarchi 2</span>
              </span>
            </Link>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                dirty
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {dirty ? 'Unsaved' : 'Saved'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {dirty && (
              <button type="button" onClick={handleDiscard} className="hidden text-xs font-semibold text-gray-500 hover:text-gray-900 sm:block">
                Discard
              </button>
            )}
            <Link
              to="/menu-print"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-lg border border-surface-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-surface-100 sm:inline-flex"
            >
              Print menu
            </Link>
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-lg border border-surface-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-surface-100 md:inline-flex"
            >
              View site
            </Link>
            <button type="button" onClick={handleLogout} className="rounded-lg px-2 py-2 text-xs font-semibold text-gray-500 hover:text-rose-600">
              Log out
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty}
              className="btn-primary px-4 py-2 text-sm"
            >
              {dirty ? 'Save changes' : 'All saved'}
            </button>
          </div>
        </div>

        <div className="section-container flex gap-1 overflow-x-auto pb-3 lg:hidden">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                activeTab === tab.id ? 'bg-brand-600 text-white' : 'bg-surface-100 text-gray-600'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="section-container py-6">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="hidden space-y-4 lg:sticky lg:top-[5.4rem] lg:block lg:h-fit">
            <nav className="rounded-2xl border border-surface-200 bg-white p-2 shadow-soft" aria-label="Admin sections">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'bg-brand-50 text-brand-800'
                      : 'text-gray-600 hover:bg-surface-100 hover:text-gray-900'
                  }`}
                >
                  <span className="text-base" aria-hidden="true">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-soft">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700">Browser storage</span>
                <span className="font-medium text-gray-500">{formatBytes(storageBytes)}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-200">
                <div
                  className={`h-full rounded-full ${
                    storagePercent > 80 ? 'bg-rose-500' : storagePercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.max(2, storagePercent)}%` }}
                />
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-gray-500">
                Photos are compressed automatically. If storage fills up, use an image URL or remove an unused upload.
              </p>
            </div>

            <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4">
              <p className="text-xs font-semibold text-brand-900">A quick note</p>
              <p className="mt-1 text-[11px] leading-relaxed text-brand-800">
                Changes save in this browser. Download a backup from Overview before switching phones or computers.
              </p>
            </div>
          </aside>

          <main className="min-w-0">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Overview</p>
                  <h1 className="mt-1 font-display text-3xl font-semibold text-gray-900">Your kitchen at a glance</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Update the menu, add appetising photos and keep the restaurant details current.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  <StatCard label="Dishes" value={itemCount} detail={`${draftCategories.length} menu sections`} icon="🍛" />
                  <StatCard label="Food photos" value={photoCount} detail={`${coverage}% of dishes have a photo`} icon="📷" />
                  <StatCard label="Average price" value={avgPrice ? formatINR(avgPrice) : '—'} detail="Based on listed menu prices" icon="₹" />
                  <StatCard label="Gallery" value={draftGallery.length} detail={`${draftHero.length} homepage photos`} icon="🖼️" />
                </div>

                {dirty && (
                  <div className="flex flex-col justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-sm font-semibold text-amber-900">You have unsaved changes</p>
                      <p className="text-xs text-amber-800">Save them before leaving the admin panel.</p>
                    </div>
                    <button type="button" onClick={handleSave} className="btn-primary px-4 py-2 text-sm">
                      Save changes
                    </button>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <section className="rounded-2xl border border-surface-200 bg-white p-5 shadow-soft">
                    <h2 className="font-display text-xl font-semibold text-gray-900">Quick actions</h2>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <button type="button" onClick={() => setActiveTab('menu')} className="rounded-xl border border-surface-200 p-3 text-left hover:border-brand-300 hover:bg-brand-50">
                        <span className="text-lg">🍛</span>
                        <p className="mt-1 text-sm font-semibold text-gray-900">Edit the menu</p>
                        <p className="text-xs text-gray-500">Dishes, prices & photos</p>
                      </button>
                      <button type="button" onClick={() => setActiveTab('gallery')} className="rounded-xl border border-surface-200 p-3 text-left hover:border-brand-300 hover:bg-brand-50">
                        <span className="text-lg">📷</span>
                        <p className="mt-1 text-sm font-semibold text-gray-900">Add gallery photos</p>
                        <p className="text-xs text-gray-500">Paste, drop or browse</p>
                      </button>
                      <button type="button" onClick={() => setActiveTab('homepage')} className="rounded-xl border border-surface-200 p-3 text-left hover:border-brand-300 hover:bg-brand-50">
                        <span className="text-lg">🏠</span>
                        <p className="mt-1 text-sm font-semibold text-gray-900">Change the hero photo</p>
                        <p className="text-xs text-gray-500">The first photo on the homepage</p>
                      </button>
                      <button type="button" onClick={() => setActiveTab('settings')} className="rounded-xl border border-surface-200 p-3 text-left hover:border-brand-300 hover:bg-brand-50">
                        <span className="text-lg">⚙️</span>
                        <p className="mt-1 text-sm font-semibold text-gray-900">Restaurant details</p>
                        <p className="text-xs text-gray-500">Phone, hours & address</p>
                      </button>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-surface-200 bg-white p-5 shadow-soft">
                    <h2 className="font-display text-xl font-semibold text-gray-900">Photo coverage</h2>
                    <div className="mt-3 flex items-end justify-between">
                      <p className="font-display text-4xl font-semibold text-brand-700">{coverage}%</p>
                      <p className="text-xs text-gray-500">{itemPhotoCount} of {itemCount} dishes</p>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-surface-200">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(2, coverage)}%` }} />
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-gray-500">
                      Menus with photos sell better. Start with the most popular dishes, then work through the sections.
                    </p>
                    <button type="button" onClick={() => setActiveTab('menu')} className="btn-secondary mt-4 w-full py-2.5 text-sm">
                      Add missing photos
                    </button>
                  </section>
                </div>

                <section className="rounded-2xl border border-surface-200 bg-white p-5 shadow-soft">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="font-display text-xl font-semibold text-gray-900">Menu sections</h2>
                      <p className="text-xs text-gray-500">A quick look at every section and its photo coverage.</p>
                    </div>
                    <button type="button" onClick={() => setActiveTab('menu')} className="text-xs font-semibold text-brand-700 hover:underline">
                      Edit menu →
                    </button>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {draftCategories.map((category) => {
                      const withPhotos = category.items.filter((item) => item.image).length;
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setActiveTab('menu')}
                          className="flex items-center gap-3 rounded-xl border border-surface-200 p-2.5 text-left hover:border-brand-300 hover:bg-brand-50"
                        >
                          <div className="h-11 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-brand-50">
                            <FoodImage src={category.image} alt={category.name} fallback={category.icon} className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900">{category.name}</p>
                            <p className="text-[11px] text-gray-500">{category.items.length} dishes · {withPhotos} photos</p>
                          </div>
                          <span className="text-xs text-gray-400">{category.items.length ? Math.round((withPhotos / category.items.length) * 100) : 0}%</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <div className="grid gap-4 md:grid-cols-2">
                  <section className="rounded-2xl border border-surface-200 bg-white p-5 shadow-soft">
                    <h2 className="font-display text-xl font-semibold text-gray-900">Backup & transfer</h2>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                      Export the menu, photos and settings as one JSON file. Import it on another phone or computer.
                    </p>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <button type="button" onClick={handleExport} className="btn-secondary flex-1 py-2.5 text-sm">
                        Export backup
                      </button>
                      <button type="button" onClick={() => importInputRef.current?.click()} className="btn-outline flex-1 border-surface-300 py-2.5 text-sm text-gray-700">
                        Import backup
                      </button>
                      <input
                        ref={importInputRef}
                        type="file"
                        accept="application/json,.json"
                        className="hidden"
                        onChange={handleImportFile}
                      />
                    </div>
                    <p className="mt-3 text-[10px] text-gray-400">
                      Last saved: {lastSavedAt ? lastSavedAt.toLocaleString() : 'not saved yet'}
                    </p>
                  </section>

                  <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                    <h2 className="font-display text-xl font-semibold text-rose-900">Start fresh</h2>
                    <p className="mt-1 text-xs leading-relaxed text-rose-800">
                      Restore the original menu, photos and restaurant details. This removes all custom changes made in this browser.
                    </p>
                    <button type="button" onClick={handleResetAll} className="mt-4 rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100">
                      Reset everything
                    </button>
                  </section>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Kitchen queue</p>
                    <h1 className="mt-1 font-display text-3xl font-semibold text-gray-900">Online orders</h1>
                    <p className="mt-1 text-sm text-gray-500">
                      Orders placed from the website appear here. Change the status as the kitchen moves them along.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={loadOrders}
                    disabled={ordersLoading}
                    className="btn-secondary px-4 py-2.5 text-sm"
                  >
                    {ordersLoading ? 'Refreshing…' : 'Refresh orders'}
                  </button>
                </div>

                {ordersService && !ordersService.database && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-900">Online order database is not connected</p>
                    <p className="mt-1 text-xs leading-relaxed text-amber-800">
                      Add <code className="rounded bg-amber-100 px-1">DATABASE_URL</code> from your Neon project
                      to <code className="rounded bg-amber-100 px-1">.env.local</code> for local development,
                      and to the Vercel environment variables for production. Then restart the app.
                      The database tables are created automatically on the first request.
                    </p>
                  </div>
                )}

                {ordersService?.database && !ordersService.whatsapp && (
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                    <p className="text-sm font-semibold text-sky-900">Orders are saving — WhatsApp bot is not configured</p>
                    <p className="mt-1 text-xs leading-relaxed text-sky-800">
                      Add the WhatsApp Cloud API keys to send new-order alerts to the restaurant automatically.
                      Until then, each order includes a WhatsApp link for the customer to notify the kitchen.
                    </p>
                  </div>
                )}

                {ordersError && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
                    {ordersError}
                  </div>
                )}

                {ordersLoading ? (
                  <div className="rounded-2xl border border-surface-200 bg-white p-10 text-center text-sm text-gray-500">
                    Loading orders…
                  </div>
                ) : orders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-surface-300 bg-white p-10 text-center">
                    <p className="text-4xl">🧾</p>
                    <h2 className="mt-3 font-display text-2xl font-semibold text-gray-900">No orders yet</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      When a customer checks out on the website, their order will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <article
                        key={order.id}
                        className={`rounded-2xl border bg-white p-4 shadow-soft ${
                          order.status === 'new' ? 'border-brand-300' : 'border-surface-200'
                        }`}
                      >
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-mono text-sm font-bold text-gray-900">{order.id}</p>
                              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-800">
                                {order.orderType === 'delivery' ? 'Delivery' : 'Pickup'}
                              </span>
                              {order.whatsappSent ? (
                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                                  WhatsApp sent
                                </span>
                              ) : (
                                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                                  WhatsApp pending
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleString('en-IN', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                  })
                                : 'Just now'}
                            </p>
                          </div>
                          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                            Status
                            <select
                              value={order.status}
                              onChange={(event) => changeOrderStatus(order.id, event.target.value)}
                              className="rounded-lg border border-surface-300 bg-white px-2.5 py-2 text-xs font-semibold text-gray-800"
                            >
                              {ORDER_STATUSES.map((status) => (
                                <option key={status.id} value={status.id}>{status.label}</option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <div className="mt-4 grid gap-4 border-t border-surface-100 pt-3 md:grid-cols-[1fr_1.2fr]">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{order.customerName}</p>
                            <a href={`tel:+91${order.customerPhone}`} className="text-sm text-brand-700 hover:underline">
                              +91 {order.customerPhone}
                            </a>
                            {order.orderType === 'delivery' ? (
                              <p className="mt-1 text-xs leading-relaxed text-gray-600">{order.address}</p>
                            ) : (
                              <p className="mt-1 text-xs text-gray-500">Pickup from College Square, Belonia</p>
                            )}
                            {order.notes && (
                              <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-900">
                                Note: {order.notes}
                              </p>
                            )}
                            <div className="mt-3 flex flex-wrap gap-2">
                              <a
                                href={`https://wa.me/91${order.customerPhone}?text=${encodeURIComponent(
                                  `Hello ${order.customerName}, this is New Bawarchi 2 about your order ${order.id}.`,
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg bg-[#1f9d55] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#178247]"
                              >
                                WhatsApp customer
                              </a>
                              <a
                                href={`tel:+91${order.customerPhone}`}
                                className="rounded-lg border border-surface-200 px-3 py-2 text-[11px] font-semibold text-gray-700 hover:bg-surface-50"
                              >
                                Call customer
                              </a>
                            </div>
                          </div>
                          <div className="rounded-xl bg-surface-50 p-3">
                            <ul className="space-y-1.5 text-xs text-gray-600">
                              {order.items?.map((item, index) => (
                                <li key={`${order.id}-${index}`} className="flex justify-between gap-2">
                                  <span>
                                    {item.quantity} × {item.name}
                                    {item.portion ? ` (${item.portion})` : ''}
                                  </span>
                                  <span className="whitespace-nowrap font-medium text-gray-800">
                                    {formatINR((item.price || 0) * item.quantity)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                            <div className="mt-2 flex justify-between border-t border-dashed border-surface-300 pt-2 text-sm font-bold text-gray-900">
                              <span>Total</span>
                              <span>{formatINR(order.subtotal)}</span>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'staff' && (
              <StaffManager adminPassword={ADMIN_PASSWORD} onNotice={showNotice} />
            )}

            {activeTab === 'menu' && (
              <div className="space-y-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Menu & photos</p>
                    <h1 className="mt-1 font-display text-3xl font-semibold text-gray-900">Dishes, prices and photos</h1>
                    <p className="mt-1 text-sm text-gray-500">
                      Click any food photo to upload, paste or link a new image. Remember to save changes.
                    </p>
                  </div>
                  <button type="button" onClick={() => setNewCategoryOpen((value) => !value)} className="btn-primary self-start px-4 py-2.5 text-sm sm:self-auto">
                    + Add menu section
                  </button>
                </div>

                {newCategoryOpen && (
                  <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4">
                    <h2 className="font-display text-lg font-semibold text-brand-900">New menu section</h2>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor="new-category-name" className="label">Section name</label>
                        <input
                          id="new-category-name"
                          value={newCategory.name}
                          onChange={(event) => setNewCategory((prev) => ({ ...prev, name: event.target.value }))}
                          className="input-field py-2.5"
                          placeholder="e.g. Desserts"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label htmlFor="new-category-description" className="label">Short description</label>
                        <input
                          id="new-category-description"
                          value={newCategory.description}
                          onChange={(event) => setNewCategory((prev) => ({ ...prev, description: event.target.value }))}
                          className="input-field py-2.5"
                          placeholder="e.g. Something sweet to finish"
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={addCategory} disabled={!newCategory.name.trim()} className="btn-primary px-4 py-2 text-sm">
                        Add section
                      </button>
                      <button type="button" onClick={() => setNewCategoryOpen(false)} className="btn-outline border-brand-300 px-4 py-2 text-sm text-brand-800">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-5">
                  {draftCategories.map((category, index) => (
                    <CategoryEditor
                      key={category.id}
                      category={category}
                      index={index}
                      total={draftCategories.length}
                      onUpdate={(patch) => updateCategory(category.id, patch)}
                      onPickImage={() => openCategoryPicker(category)}
                      onDelete={() => deleteCategory(category.id, category.name)}
                      onMove={(direction) => moveCategory(category.id, direction)}
                      onAddItem={() => addItem(category.id)}
                      onUpdateItem={(itemId, patch) => updateItem(category.id, itemId, patch)}
                      onPickItemImage={(item) => openItemPicker(category.id, item)}
                      onDeleteItem={(itemId) => deleteItem(category.id, itemId)}
                      onDuplicateItem={(itemId) => duplicateItem(category.id, itemId)}
                      onMoveItem={(itemId, direction) => moveItem(category.id, itemId, direction)}
                    />
                  ))}
                </div>

                {draftCategories.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-surface-300 bg-white p-10 text-center">
                    <p className="text-4xl">🍽️</p>
                    <h2 className="mt-3 font-display text-2xl font-semibold text-gray-900">Your menu is empty</h2>
                    <p className="mt-1 text-sm text-gray-500">Add your first section to get started.</p>
                    <button type="button" onClick={() => setNewCategoryOpen(true)} className="btn-primary mt-5">
                      Add menu section
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'style' && (
              <MenuStyleStudio
                key={`${menuStyle.preset}-${menuStyle.name}-${menuStyle.accent}`}
                currentStyle={menuStyle}
                adminPassword={ADMIN_PASSWORD}
                onApply={(style) => saveMenuStyle(style, ADMIN_PASSWORD)}
                onNotice={showNotice}
              />
            )}

            {activeTab === 'gallery' && (
              <div className="space-y-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Gallery</p>
                    <h1 className="mt-1 font-display text-3xl font-semibold text-gray-900">Food & dining room photos</h1>
                    <p className="mt-1 text-sm text-gray-500">
                      Add as many as you like. Photos are resized automatically for fast loading.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => galleryInputRef.current?.click()} className="btn-primary px-4 py-2.5 text-sm" disabled={galleryUploading}>
                      {galleryUploading ? 'Processing…' : '+ Upload photos'}
                    </button>
                    <button type="button" onClick={addGalleryPhoto} className="btn-secondary px-4 py-2.5 text-sm">
                      Add one
                    </button>
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        handleGalleryFiles(event.target.files);
                        event.target.value = '';
                      }}
                    />
                  </div>
                </div>

                <div
                  className="rounded-2xl border-2 border-dashed border-surface-300 bg-white p-6 text-center"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleGalleryFiles(event.dataTransfer.files);
                  }}
                >
                  <p className="text-sm font-semibold text-gray-800">Drag & drop photos here</p>
                  <p className="mt-1 text-xs text-gray-500">
                    or click “Upload photos”. You can select several images at once.
                  </p>
                </div>

                {draftGallery.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-surface-300 bg-white p-10 text-center">
                    <p className="text-4xl">📷</p>
                    <h2 className="mt-3 font-display text-2xl font-semibold text-gray-900">No gallery photos yet</h2>
                    <p className="mt-1 text-sm text-gray-500">Upload a few to show off the food and the dining room.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {draftGallery.map((image, index) => (
                      <article key={image.id} className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-soft">
                        <button
                          type="button"
                          onClick={() =>
                            setPicker({
                              type: 'gallery',
                              id: image.id,
                              value: image.src || '',
                              title: 'Change gallery photo',
                              aspect: '4 / 3',
                              maxWidth: 1600,
                              maxHeight: 1200,
                              quality: 0.76,
                            })
                          }
                          className="group relative block aspect-[4/3] w-full overflow-hidden bg-brand-50"
                          aria-label="Change gallery photo"
                        >
                          <FoodImage src={image.src} alt={image.alt || image.caption} fallback="🏮" className="h-full w-full object-cover" />
                          <span className="absolute inset-0 flex items-center justify-center bg-stone-950/0 text-sm font-semibold text-white opacity-0 transition-all group-hover:bg-stone-950/35 group-hover:opacity-100">
                            Change photo
                          </span>
                        </button>
                        <div className="space-y-2 p-3">
                          <div>
                            <label htmlFor={`gallery-caption-${image.id}`} className="sr-only">Caption</label>
                            <input
                              id={`gallery-caption-${image.id}`}
                              value={image.caption || ''}
                              onChange={(event) => updateGallery(image.id, { caption: event.target.value, alt: event.target.value || image.alt })}
                              placeholder="Photo caption"
                              className="w-full rounded-lg border border-surface-200 px-2.5 py-1.5 text-xs text-gray-700 focus:border-brand-500 focus:outline-none"
                            />
                          </div>
                          <div className="flex gap-2">
                            <label htmlFor={`gallery-category-${image.id}`} className="sr-only">Category</label>
                            <select
                              id={`gallery-category-${image.id}`}
                              value={image.category || 'food'}
                              onChange={(event) => updateGallery(image.id, { category: event.target.value })}
                              className="min-w-0 flex-1 rounded-lg border border-surface-200 px-2 py-1.5 text-xs text-gray-700 focus:border-brand-500 focus:outline-none"
                            >
                              <option value="food">Food</option>
                              <option value="interior">Dining room</option>
                              <option value="drinks">Drinks</option>
                              <option value="events">Events</option>
                            </select>
                            <ActionButton label="Move photo up" onClick={() => moveGallery(image.id, -1)} disabled={index === 0}>↑</ActionButton>
                            <ActionButton label="Move photo down" onClick={() => moveGallery(image.id, 1)} disabled={index === draftGallery.length - 1}>↓</ActionButton>
                            <ActionButton label="Delete photo" onClick={() => deleteGallery(image.id)} danger>✕</ActionButton>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'homepage' && (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Homepage</p>
                  <h1 className="mt-1 font-display text-3xl font-semibold text-gray-900">The first photo people see</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Choose one active hero photo. Popular dishes are controlled from the Menu tab.
                  </p>
                </div>

                <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
                  <p className="font-semibold">How the homepage is built</p>
                  <p className="mt-1 text-xs leading-relaxed">
                    The active photo below appears beside the welcome text. The first four dishes marked
                    “Popular” in the Menu tab appear in the favourite dishes row.
                  </p>
                  <Link to="/" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-semibold text-brand-800 underline">
                    Open the homepage preview →
                  </Link>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={addHeroPhoto} className="btn-primary px-4 py-2.5 text-sm">
                    + Add homepage photo
                  </button>
                </div>

                {draftHero.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-surface-300 bg-white p-10 text-center">
                    <p className="text-4xl">🏠</p>
                    <h2 className="mt-3 font-display text-2xl font-semibold text-gray-900">No hero photo</h2>
                    <p className="mt-1 text-sm text-gray-500">Add one so the homepage has a beautiful first impression.</p>
                    <button type="button" onClick={addHeroPhoto} className="btn-primary mt-5">Add homepage photo</button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {draftHero.map((image, index) => (
                      <article key={image.id} className={`overflow-hidden rounded-2xl border bg-white shadow-soft ${image.active ? 'border-brand-400' : 'border-surface-200'}`}>
                        <button
                          type="button"
                          onClick={() =>
                            setPicker({
                              type: 'hero',
                              id: image.id,
                              value: image.src || '',
                              title: 'Change homepage photo',
                              aspect: '16 / 10',
                              maxWidth: 1600,
                              maxHeight: 1000,
                              quality: 0.8,
                            })
                          }
                          className="group relative block aspect-[16/10] w-full overflow-hidden bg-brand-50"
                          aria-label="Change homepage photo"
                        >
                          <FoodImage src={image.src} alt={image.alt || image.caption} fallback="🏮" className="h-full w-full object-cover" />
                          <span className="absolute inset-0 flex items-center justify-center bg-stone-950/0 text-sm font-semibold text-white opacity-0 transition-all group-hover:bg-stone-950/35 group-hover:opacity-100">
                            Change photo
                          </span>
                          {image.active && (
                            <span className="absolute left-3 top-3 rounded-full bg-brand-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-950">
                              Active hero
                            </span>
                          )}
                        </button>
                        <div className="space-y-2 p-3">
                          <input
                            value={image.caption || ''}
                            onChange={(event) => updateHero(image.id, { caption: event.target.value, alt: event.target.value || image.alt })}
                            placeholder="Caption shown on the photo"
                            className="w-full rounded-lg border border-surface-200 px-2.5 py-1.5 text-xs text-gray-700 focus:border-brand-500 focus:outline-none"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setHeroActive(image.id)}
                              disabled={image.active}
                              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold ${
                                image.active
                                  ? 'bg-brand-100 text-brand-800'
                                  : 'border border-surface-200 text-gray-600 hover:border-brand-300 hover:text-brand-700'
                              }`}
                            >
                              {image.active ? '★ Used on homepage' : 'Use on homepage'}
                            </button>
                            <ActionButton label="Move hero photo up" onClick={() => {
                              setDraftHero((prev) => {
                                const target = index - 1;
                                if (target < 0) return prev;
                                const next = [...prev];
                                [next[index], next[target]] = [next[target], next[index]];
                                return next;
                              });
                              markDirty();
                            }} disabled={index === 0}>↑</ActionButton>
                            <ActionButton label="Delete hero photo" onClick={() => deleteHero(image.id)} danger>✕</ActionButton>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Restaurant details</p>
                  <h1 className="mt-1 font-display text-3xl font-semibold text-gray-900">Keep the essentials current</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    These details appear across the website, print menu and WhatsApp links.
                  </p>
                </div>

                <section className="rounded-2xl border border-surface-200 bg-white p-5 shadow-soft">
                  <h2 className="font-display text-xl font-semibold text-gray-900">The basics</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="info-name" className="label">Restaurant name</label>
                      <input id="info-name" value={draftInfo.name || ''} onChange={(event) => updateInfo('name', event.target.value)} className="input-field py-2.5" />
                    </div>
                    <div>
                      <label htmlFor="info-tagline" className="label">Tagline</label>
                      <input id="info-tagline" value={draftInfo.tagline || ''} onChange={(event) => updateInfo('tagline', event.target.value)} className="input-field py-2.5" />
                    </div>
                    <div>
                      <label htmlFor="info-menu-title" className="label">Menu edition title</label>
                      <input id="info-menu-title" value={draftInfo.menuTitle || ''} onChange={(event) => updateInfo('menuTitle', event.target.value)} className="input-field py-2.5" placeholder="Bawarchi Puja Special" />
                    </div>
                    <div>
                      <label htmlFor="info-menu-subtitle" className="label">Menu edition subtitle</label>
                      <input id="info-menu-subtitle" value={draftInfo.menuSubtitle || ''} onChange={(event) => updateInfo('menuSubtitle', event.target.value)} className="input-field py-2.5" placeholder="Good Food · Great Mood" />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="info-address" className="label">Full address</label>
                      <input id="info-address" value={draftInfo.address || ''} onChange={(event) => updateInfo('address', event.target.value)} className="input-field py-2.5" />
                    </div>
                    <div>
                      <label htmlFor="info-short-address" className="label">Short address (print menu)</label>
                      <input id="info-short-address" value={draftInfo.shortAddress || ''} onChange={(event) => updateInfo('shortAddress', event.target.value)} className="input-field py-2.5" />
                    </div>
                    <div>
                      <label htmlFor="info-hours" className="label">Opening hours (display)</label>
                      <input id="info-hours" value={draftInfo.hours || ''} onChange={(event) => updateInfo('hours', event.target.value)} className="input-field py-2.5" />
                    </div>
                    <div>
                      <label htmlFor="info-open" className="label">Opens at (24h)</label>
                      <input id="info-open" type="number" min="0" max="23" value={draftInfo.opensAt ?? 8} onChange={(event) => updateInfo('opensAt', Number(event.target.value))} className="input-field py-2.5" />
                    </div>
                    <div>
                      <label htmlFor="info-close" className="label">Closes at (24h)</label>
                      <input id="info-close" type="number" min="1" max="24" value={draftInfo.closesAt ?? 22} onChange={(event) => updateInfo('closesAt', Number(event.target.value))} className="input-field py-2.5" />
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-surface-200 bg-white p-5 shadow-soft">
                  <h2 className="font-display text-xl font-semibold text-gray-900">Contact & ordering</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="info-phone" className="label">Phone (displayed)</label>
                      <input id="info-phone" value={draftInfo.phone || ''} onChange={(event) => updateInfo('phone', event.target.value)} className="input-field py-2.5" />
                    </div>
                    <div>
                      <label htmlFor="info-phone-raw" className="label">Phone link (with country code)</label>
                      <input id="info-phone-raw" value={draftInfo.phoneRaw || ''} onChange={(event) => updateInfo('phoneRaw', event.target.value)} className="input-field py-2.5" placeholder="+919366986853" />
                    </div>
                    <div>
                      <label htmlFor="info-phone2" className="label">Second phone (displayed)</label>
                      <input id="info-phone2" value={draftInfo.phone2 || ''} onChange={(event) => updateInfo('phone2', event.target.value)} className="input-field py-2.5" placeholder="+91 96122 81939" />
                    </div>
                    <div>
                      <label htmlFor="info-phone2-raw" className="label">Second phone link</label>
                      <input id="info-phone2-raw" value={draftInfo.phone2Raw || ''} onChange={(event) => updateInfo('phone2Raw', event.target.value)} className="input-field py-2.5" placeholder="+919612281939" />
                    </div>
                    <div>
                      <label htmlFor="info-whatsapp" className="label">WhatsApp number</label>
                      <input id="info-whatsapp" value={draftInfo.whatsapp || ''} onChange={(event) => updateInfo('whatsapp', event.target.value)} className="input-field py-2.5" placeholder="919366986853" />
                      <p className="mt-1 text-[10px] text-gray-400">Digits only, including country code. This powers all order buttons.</p>
                    </div>
                    <div>
                      <label htmlFor="info-rating" className="label">Google rating</label>
                      <input id="info-rating" value={draftInfo.rating || ''} onChange={(event) => updateInfo('rating', event.target.value)} className="input-field py-2.5" placeholder="4.3" />
                    </div>
                    <div>
                      <label htmlFor="info-reviews" className="label">Review count</label>
                      <input id="info-reviews" value={draftInfo.reviewCount || ''} onChange={(event) => updateInfo('reviewCount', event.target.value)} className="input-field py-2.5" placeholder="25+" />
                    </div>
                    <div>
                      <label htmlFor="info-since" className="label">Serving since</label>
                      <input id="info-since" value={draftInfo.since || ''} onChange={(event) => updateInfo('since', event.target.value)} className="input-field py-2.5" />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="info-announcement" className="label">Announcement line</label>
                      <input id="info-announcement" value={draftInfo.announcement || ''} onChange={(event) => updateInfo('announcement', event.target.value)} className="input-field py-2.5" />
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-surface-200 bg-white p-5 shadow-soft">
                  <h2 className="font-display text-xl font-semibold text-gray-900">Maps & social</h2>
                  <div className="mt-4 grid gap-4">
                    <div>
                      <label htmlFor="info-map" className="label">Google Maps embed URL</label>
                      <input id="info-map" value={draftInfo.mapsEmbedUrl || ''} onChange={(event) => updateInfo('mapsEmbedUrl', event.target.value)} className="input-field py-2.5 text-xs" />
                    </div>
                    <div>
                      <label htmlFor="info-directions" className="label">Directions URL</label>
                      <input id="info-directions" value={draftInfo.directionsUrl || ''} onChange={(event) => updateInfo('directionsUrl', event.target.value)} className="input-field py-2.5 text-xs" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="info-instagram" className="label">Instagram URL</label>
                        <input id="info-instagram" value={draftInfo.instagram || ''} onChange={(event) => updateInfo('instagram', event.target.value)} className="input-field py-2.5 text-xs" />
                      </div>
                      <div>
                        <label htmlFor="info-facebook" className="label">Facebook URL</label>
                        <input id="info-facebook" value={draftInfo.facebook || ''} onChange={(event) => updateInfo('facebook', event.target.value)} className="input-field py-2.5 text-xs" />
                      </div>
                    </div>
                  </div>
                </section>

                <div className="flex flex-col gap-2 rounded-2xl border border-surface-200 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-gray-500">
                    {dirty ? 'You have unsaved changes.' : 'All changes are saved.'}
                  </p>
                  <button type="button" onClick={handleSave} disabled={!dirty} className="btn-primary px-4 py-2 text-sm">
                    Save changes
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {notice && (
        <div
          className={`fixed bottom-5 right-5 z-[90] max-w-[calc(100vw-2.5rem)] rounded-xl border px-4 py-3 shadow-strong ${
            notice.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
          role={notice.type === 'error' ? 'alert' : 'status'}
        >
          <div className="flex items-start gap-2">
            <span className="text-sm" aria-hidden="true">{notice.type === 'error' ? '⚠' : '✓'}</span>
            <p className="text-sm font-medium">{notice.message}</p>
            <button type="button" onClick={() => setNotice(null)} className="ml-1 text-xs font-bold opacity-60 hover:opacity-100" aria-label="Dismiss notification">
              ✕
            </button>
          </div>
        </div>
      )}

      <ImagePicker
        open={Boolean(picker)}
        value={picker?.value || ''}
        title={picker?.title || 'Choose a photo'}
        aspect={picker?.aspect}
        maxWidth={picker?.maxWidth}
        maxHeight={picker?.maxHeight}
        quality={picker?.quality}
        onClose={() => setPicker(null)}
        onSave={handlePickerSave}
      />
    </div>
  );
}
