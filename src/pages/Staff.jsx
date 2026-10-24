import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSiteData } from '../context/SiteDataContext';
import { formatINR } from '../utils/price';
import {
  getStaffOrders,
  getStaffSession,
  sendStaffReviewRequest,
  setStaffItemAvailability,
  staffLogin,
  updateStaffOrderStatus,
  updateStaffPaymentStatus,
} from '../utils/staffApi';

const TOKEN_KEY = 'nb2_staff_token';
const SEEN_KEY = 'nb2_staff_seen_orders';
const POLL_MS = 20000;

const ORDER_STATUSES = [
  { id: 'new', label: 'New' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'ready', label: 'Ready' },
  { id: 'out-for-delivery', label: 'Out for delivery' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const ACTIVE_STATUSES = ['new', 'confirmed', 'preparing', 'ready', 'out-for-delivery'];
const FILTERS = [
  { id: 'active', label: 'Active' },
  { id: 'new', label: 'New' },
  { id: 'all', label: 'All' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const statusLabel = (status) =>
  ORDER_STATUSES.find((entry) => entry.id === status)?.label || status;

const statusClass = (status) => {
  if (status === 'new') return 'bg-amber-100 text-amber-900 border-amber-200';
  if (status === 'confirmed') return 'bg-sky-100 text-sky-900 border-sky-200';
  if (status === 'preparing') return 'bg-orange-100 text-orange-900 border-orange-200';
  if (status === 'ready') return 'bg-emerald-100 text-emerald-900 border-emerald-200';
  if (status === 'out-for-delivery') return 'bg-violet-100 text-violet-900 border-violet-200';
  if (status === 'completed') return 'bg-surface-100 text-gray-700 border-surface-200';
  if (status === 'cancelled') return 'bg-rose-100 text-rose-900 border-rose-200';
  return 'bg-surface-100 text-gray-700 border-surface-200';
};

function formatWhen(value) {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function printKOT(order, restaurantName) {
  const win = window.open('', '_blank', 'width=420,height=680');
  if (!win) return false;
  const items = (order.items || [])
    .map(
      (item) =>
        `<tr><td class="qty">${escapeHtml(item.quantity)}×</td><td>${escapeHtml(item.name)}${
          item.portion ? `<div class="small">${escapeHtml(item.portion)}</div>` : ''
        }</td></tr>`,
    )
    .join('');
  const when = order.scheduledFor
    ? new Date(order.scheduledFor).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : order.prepMinutes
      ? `ASAP · about ${escapeHtml(order.prepMinutes)} min`
      : 'ASAP';
  win.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>KOT ${escapeHtml(order.id)}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body { width: 72mm; margin: 0; font-family: "Courier New", monospace; color: #000; font-size: 11px; }
  h1 { margin: 0; text-align: center; font-size: 15px; letter-spacing: .5px; }
  .sub { text-align: center; font-size: 10px; margin-top: 2px; }
  .rule { border-top: 1px dashed #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; gap: 6px; }
  .big { font-size: 13px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; }
  td { vertical-align: top; padding: 3px 0; border-bottom: 1px dotted #999; }
  td.qty { width: 24px; font-weight: 700; }
  .small { font-size: 9px; }
  .note { border: 1px solid #000; padding: 4px; margin-top: 6px; font-weight: 700; }
  .center { text-align: center; }
</style>
</head>
<body>
  <h1>${escapeHtml(restaurantName)}</h1>
  <div class="sub">KITCHEN ORDER TICKET</div>
  <div class="rule"></div>
  <div class="row"><span class="big">${escapeHtml(order.id)}</span><span>${escapeHtml(order.orderType === 'delivery' ? 'DELIVERY' : 'PICKUP')}</span></div>
  <div class="row"><span>${escapeHtml(formatWhen(order.createdAt))}</span><span>${escapeHtml(when)}</span></div>
  <div class="rule"></div>
  <table>${items}</table>
  ${order.notes ? `<div class="note">NOTE: ${escapeHtml(order.notes)}</div>` : ''}
  <div class="rule"></div>
  <div class="row"><span>${escapeHtml(order.customerName)}</span><span>${escapeHtml(order.customerPhone)}</span></div>
  ${order.orderType === 'delivery' && order.address ? `<div class="small">${escapeHtml(order.address)}</div>` : ''}
  <div class="rule"></div>
  <div class="row"><span>PAYMENT</span><span>${escapeHtml((order.paymentMethod || 'pay_later') === 'upi' ? 'UPI' : 'PAY LATER')} · ${escapeHtml(order.paymentStatus || 'pending')}</span></div>
  <div class="center small" style="margin-top:8px">Printed ${escapeHtml(new Date().toLocaleTimeString('en-IN'))}</div>
</body>
</html>`);
  win.document.close();
  win.focus();
  window.setTimeout(() => win.print(), 300);
  return true;
}

function readSeen() {
  try {
    const raw = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
    return new Set(Array.isArray(raw) ? raw.slice(-200) : []);
  } catch {
    return new Set();
  }
}

function writeSeen(seen) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-200)));
  } catch {
    // Notification tracking still works for this tab.
  }
}

export default function Staff() {
  const { restaurantInfo, allItems, categories, soldOut, refreshSiteConfig } = useSiteData();
  const [token, setToken] = useState(() => {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || '';
    } catch {
      return '';
    }
  });
  const [staff, setStaff] = useState(null);
  const [checking, setChecking] = useState(Boolean(token));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('active');
  const [updatingId, setUpdatingId] = useState('');
  const [newCount, setNewCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
  });
  const [soundOn, setSoundOn] = useState(() => {
    try {
      return localStorage.getItem('nb2_staff_sound') !== 'off';
    } catch {
      return true;
    }
  });
  const [availabilityBusy, setAvailabilityBusy] = useState('');
  const [availabilityQuery, setAvailabilityQuery] = useState('');
  const [paymentBusy, setPaymentBusy] = useState('');
  const [reviewBusy, setReviewBusy] = useState('');
  const seenRef = useRef(readSeen());
  const initialLoadRef = useRef(true);
  const audioRef = useRef(null);

  const clearSession = useCallback(() => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignore storage errors.
    }
    setToken('');
    setStaff(null);
    setOrders([]);
    setNewCount(0);
    initialLoadRef.current = true;
  }, []);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    getStaffSession(token).then((result) => {
      if (cancelled) return;
      setChecking(false);
      if (!result.ok) {
        clearSession();
        setLoginError(
          result.status === 401
            ? 'Your staff session expired. Please sign in again.'
            : result.error || 'Could not verify the staff session.',
        );
        return;
      }
      setStaff(result.data?.staff || null);
    });
    return () => {
      cancelled = true;
    };
  }, [token, clearSession]);

  const chimeNow = useCallback(async () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioRef.current) audioRef.current = new AudioCtx();
      const ctx = audioRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      const now = ctx.currentTime;
      [
        { at: 0, frequency: 880 },
        { at: 0.18, frequency: 1174.66 },
        { at: 0.36, frequency: 1396.91 },
      ].forEach(({ at, frequency }) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, now + at);
        gain.gain.exponentialRampToValueAtTime(0.22, now + at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.28);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(now + at);
        oscillator.stop(now + at + 0.3);
      });
    } catch {
      // Audio is a convenience; the on-screen alert still works.
    }
  }, []);

  const playChime = useCallback(() => {
    if (soundOn) chimeNow();
  }, [soundOn, chimeNow]);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    try {
      localStorage.setItem('nb2_staff_sound', next ? 'on' : 'off');
    } catch {
      // Ignore storage restrictions.
    }
    if (next) chimeNow();
    setNotice(next ? 'New-order sound is on.' : 'New-order sound is off.');
    window.setTimeout(() => setNotice(''), 3000);
  };

  const showBrowserNotification = useCallback((order) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    try {
      const notification = new Notification(`New order ${order.id}`, {
        body: `${order.customerName || 'Customer'} · ${formatINR(order.subtotal)} · ${
          order.orderType === 'delivery' ? 'Delivery' : 'Pickup'
        }`,
        tag: order.id,
      });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch {
      // Some browsers require a service worker; the in-page alert still shows.
    }
  }, []);

  const loadOrders = useCallback(
    async ({ silent = false } = {}) => {
      if (!token) return;
      if (!silent) setLoading(true);
      setError('');
      const result = await getStaffOrders(token);
      if (!silent) setLoading(false);

      if (result.status === 401) {
        clearSession();
        setLoginError('Your staff session expired. Please sign in again.');
        return;
      }
      if (!result.ok) {
        setError(result.error || 'Could not load orders.');
        return;
      }

      const list = Array.isArray(result.data?.orders) ? result.data.orders : [];
      setOrders(list);
      setLastUpdated(new Date());

      if (initialLoadRef.current) {
        initialLoadRef.current = false;
        list.forEach((order) => seenRef.current.add(order.id));
        writeSeen(seenRef.current);
        return;
      }

      const fresh = list.filter(
        (order) => order.status === 'new' && !seenRef.current.has(order.id),
      );
      if (!fresh.length) return;

      fresh.forEach((order) => seenRef.current.add(order.id));
      writeSeen(seenRef.current);
      setNewCount((count) => count + fresh.length);
      showBrowserNotification(fresh[0]);
      playChime();
    },
    [token, clearSession, showBrowserNotification, playChime],
  );

  useEffect(() => {
    if (!staff || !token) return undefined;
    loadOrders();
    const timer = window.setInterval(() => loadOrders({ silent: true }), POLL_MS);
    return () => window.clearInterval(timer);
  }, [staff, token, loadOrders]);

  useEffect(() => {
    if (newCount > 0) {
      document.title = `🔔 ${newCount} new order${newCount === 1 ? '' : 's'} · Staff`;
    } else {
      document.title = `Staff orders · ${restaurantInfo.name}`;
    }
    return () => {
      document.title = "New Bawarchi 2 - Belonia's Favorite Restaurant | South Tripura";
    };
  }, [newCount, restaurantInfo.name]);

  const activeOrders = useMemo(
    () => orders.filter((order) => ACTIVE_STATUSES.includes(order.status)),
    [orders],
  );
  const newOrders = useMemo(
    () => orders.filter((order) => order.status === 'new'),
    [orders],
  );
  const completedToday = useMemo(() => {
    const today = new Date().toDateString();
    return orders.filter(
      (order) =>
        order.status === 'completed' &&
        order.updatedAt &&
        new Date(order.updatedAt).toDateString() === today,
    ).length;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    if (filter === 'active') return activeOrders;
    if (filter === 'new') return newOrders;
    if (filter === 'all') return orders;
    return orders.filter((order) => order.status === filter);
  }, [filter, orders, activeOrders, newOrders]);

  const soldOutSet = useMemo(() => new Set((soldOut || []).map(String)), [soldOut]);
  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  const availabilityItems = useMemo(() => {
    const query = availabilityQuery.trim().toLowerCase();
    return allItems.filter(
      (item) =>
        !query ||
        item.name.toLowerCase().includes(query) ||
        String(categoryNames.get(item.categoryId) || '').toLowerCase().includes(query),
    );
  }, [allItems, availabilityQuery, categoryNames]);

  const handleLogin = async (event) => {
    event.preventDefault();
    if (loggingIn) return;
    setLoggingIn(true);
    setLoginError('');
    const result = await staffLogin(username, password);
    setLoggingIn(false);
    if (!result.ok) {
      setLoginError(result.error || 'Could not sign in.');
      return;
    }
    const nextToken = result.data?.token;
    if (!nextToken) {
      setLoginError('The staff service did not return a session. Please try again.');
      return;
    }
    try {
      sessionStorage.setItem(TOKEN_KEY, nextToken);
    } catch {
      // The session still works in this tab.
    }
    setToken(nextToken);
    setStaff(result.data?.staff || null);
    setPassword('');
    initialLoadRef.current = true;
    setNewCount(0);
  };

  const handleLogout = () => {
    clearSession();
    setLoginError('');
  };

  const handleStatus = async (orderId, status) => {
    if (!token || updatingId) return;
    setUpdatingId(orderId);
    setError('');
    const result = await updateStaffOrderStatus(orderId, status, token);
    setUpdatingId('');
    if (result.status === 401) {
      clearSession();
      setLoginError('Your staff session expired. Please sign in again.');
      return;
    }
    if (!result.ok) {
      setError(result.error || 'Could not update that order.');
      return;
    }
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? { ...order, status: result.data?.order?.status || status, updatedAt: new Date().toISOString() }
          : order,
      ),
    );
    setNotice(`Order ${orderId} marked ${statusLabel(status).toLowerCase()}.`);
    window.setTimeout(() => setNotice(''), 3500);
  };

  const handleAvailability = async (itemId, nextSoldOut) => {
    if (!token || availabilityBusy) return;
    setAvailabilityBusy(itemId);
    setError('');
    const result = await setStaffItemAvailability(itemId, nextSoldOut, token);
    setAvailabilityBusy('');
    if (result.status === 401) {
      clearSession();
      setLoginError('Your staff session expired. Please sign in again.');
      return;
    }
    if (!result.ok) {
      setError(result.error || 'Could not update availability.');
      return;
    }
    await refreshSiteConfig();
    setNotice(nextSoldOut ? 'Marked sold out for today.' : 'Item is available again.');
    window.setTimeout(() => setNotice(''), 3000);
  };

  const handlePayment = async (orderId, paymentStatus) => {
    if (!token || paymentBusy) return;
    setPaymentBusy(orderId);
    setError('');
    const result = await updateStaffPaymentStatus(orderId, paymentStatus, token);
    setPaymentBusy('');
    if (result.status === 401) {
      clearSession();
      setLoginError('Your staff session expired. Please sign in again.');
      return;
    }
    if (!result.ok) {
      setError(result.error || 'Could not update payment.');
      return;
    }
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              paymentStatus: result.data?.order?.paymentStatus || paymentStatus,
              updatedAt: new Date().toISOString(),
            }
          : order,
      ),
    );
    setNotice(`Payment marked ${paymentStatus}.`);
    window.setTimeout(() => setNotice(''), 3000);
  };

  const handleReview = async (order) => {
    if (!token || reviewBusy) return;
    setReviewBusy(order.id);
    setError('');
    const popup = window.open('', '_blank');
    const result = await sendStaffReviewRequest(order.id, token);
    setReviewBusy('');
    if (result.status === 401) {
      popup?.close();
      clearSession();
      setLoginError('Your staff session expired. Please sign in again.');
      return;
    }
    if (!result.ok) {
      popup?.close();
      setError(result.error || 'Could not prepare the review request.');
      return;
    }
    if (popup && result.data?.url) {
      popup.location.href = result.data.url;
    }
    setOrders((current) =>
      current.map((entry) =>
        entry.id === order.id
          ? { ...entry, reviewRequestedAt: new Date().toISOString() }
          : entry,
      ),
    );
    setNotice(`Review request ready for ${order.id}.`);
    window.setTimeout(() => setNotice(''), 3500);
  };

  const handlePrintKot = (order) => {
    if (!printKOT(order, restaurantInfo.name)) {
      setError('Allow pop-ups to print the kitchen ticket.');
    }
  };

  const markAllSeen = () => {
    orders.forEach((order) => seenRef.current.add(order.id));
    writeSeen(seenRef.current);
    setNewCount(0);
  };

  const enableNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      setNotice('Browser notifications are on while this staff screen stays open.');
      window.setTimeout(() => setNotice(''), 4000);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50 px-4">
        <div className="rounded-2xl border border-surface-200 bg-white px-6 py-5 text-sm font-medium text-gray-600 shadow-soft">
          Checking staff session…
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-[#fffdf8] to-accent-50 px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <Link to="/" className="inline-flex items-center gap-3" aria-label={`${restaurantInfo.name} home`}>
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 font-display text-2xl font-bold text-stone-950 shadow-medium">
                N2
              </span>
              <span className="text-left">
                <span className="block font-display text-2xl font-semibold text-gray-900">
                  {restaurantInfo.name}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
                  Staff order screen
                </span>
              </span>
            </Link>
          </div>

          <form onSubmit={handleLogin} className="rounded-3xl border border-surface-200 bg-white p-6 shadow-strong sm:p-8">
            <h1 className="font-display text-2xl font-semibold text-gray-900">Staff sign in</h1>
            <p className="mt-1 text-sm text-gray-500">
              Use the staff account given by the owner. This screen shows new orders and lets you
              update their status.
            </p>

            {loginError && (
              <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700" role="alert">
                {loginError}
              </p>
            )}

            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="staff-username" className="label">Username</label>
                <input
                  id="staff-username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  className="input-field mt-1.5"
                  placeholder="staff"
                  required
                />
              </div>
              <div>
                <label htmlFor="staff-password" className="label">Password</label>
                <input
                  id="staff-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  className="input-field mt-1.5"
                  placeholder="Your staff password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingIn ? 'Signing in…' : 'Open order screen'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-500">
            Owner? <Link to="/admin123" className="font-semibold text-brand-700 hover:underline">Admin panel</Link>
            <span className="mx-2 text-surface-400">·</span>
            <a href={`tel:${restaurantInfo.phoneRaw}`} className="font-semibold text-brand-700 hover:underline">
              Call the kitchen
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="border-b border-surface-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-3" aria-label={`${restaurantInfo.name} home`}>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 font-display text-lg font-bold text-stone-950">
                N2
              </span>
              <span>
                <span className="block font-display text-lg font-semibold text-gray-900">
                  Staff orders
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                  {restaurantInfo.name} · Live kitchen
                </span>
              </span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-2 py-2 text-xs font-semibold text-gray-500 hover:text-rose-600 sm:hidden"
            >
              Log out
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
              Live · every 20s
            </span>
            <span className="hidden text-xs text-gray-500 sm:inline">
              {staff.displayName || staff.username}
            </span>
            <button
              type="button"
              onClick={toggleSound}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                soundOn
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-surface-200 text-gray-600 hover:bg-surface-100'
              }`}
              aria-pressed={soundOn}
            >
              {soundOn ? '🔊 Sound on' : '🔇 Sound off'}
            </button>
            {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
              <button
                type="button"
                onClick={enableNotifications}
                className="rounded-lg border border-surface-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-surface-100"
              >
                🔔 Enable alerts
              </button>
            )}
            <button
              type="button"
              onClick={() => loadOrders()}
              disabled={loading}
              className="rounded-lg border border-surface-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-surface-100 disabled:opacity-60"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <Link
              to="/menu"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-lg border border-surface-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-surface-100 md:inline-flex"
            >
              View menu
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="hidden rounded-lg px-2 py-2 text-xs font-semibold text-gray-500 hover:text-rose-600 sm:inline-flex"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {newCount > 0 && (
          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-amber-900">
              🔔 {newCount} new order{newCount === 1 ? '' : 's'} arrived since you last checked.
            </p>
            <button
              type="button"
              onClick={markAllSeen}
              className="rounded-lg bg-amber-900 px-3 py-2 text-xs font-bold text-white hover:bg-amber-800"
            >
              Mark all seen
            </button>
          </div>
        )}

        {notice && (
          <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
            {error}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">New</p>
            <p className="mt-1 font-display text-3xl font-semibold text-amber-900">{newOrders.length}</p>
          </div>
          <div className="rounded-2xl border border-surface-200 bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">Active</p>
            <p className="mt-1 font-display text-3xl font-semibold text-gray-900">{activeOrders.length}</p>
          </div>
          <div className="rounded-2xl border border-surface-200 bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">Completed today</p>
            <p className="mt-1 font-display text-3xl font-semibold text-gray-900">{completedToday}</p>
          </div>
        </div>

        <details className="mt-5 rounded-2xl border border-surface-200 bg-white shadow-soft">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
            <span>
              <span className="block text-sm font-bold text-gray-900">Today&apos;s availability</span>
              <span className="text-xs text-gray-500">
                {soldOutSet.size
                  ? `${soldOutSet.size} item${soldOutSet.size === 1 ? '' : 's'} sold out`
                  : 'Everything is available'}
              </span>
            </span>
            <span className="rounded-full bg-surface-100 px-3 py-1 text-[11px] font-semibold text-gray-600">
              Tap to manage
            </span>
          </summary>
          <div className="border-t border-surface-200 p-4">
            <label htmlFor="availability-search" className="sr-only">Search menu items</label>
            <input
              id="availability-search"
              type="search"
              value={availabilityQuery}
              onChange={(event) => setAvailabilityQuery(event.target.value)}
              placeholder="Search dishes…"
              className="input-field py-2 text-sm"
            />
            <p className="mt-2 text-[11px] text-gray-500">
              Sold-out dishes are hidden from ordering and blocked at checkout. Changes apply immediately.
            </p>
            <div className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {availabilityItems.map((item) => {
                const isOut = soldOutSet.has(String(item.id));
                return (
                  <label
                    key={item.id}
                    className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs ${
                      isOut
                        ? 'border-rose-200 bg-rose-50 text-rose-900'
                        : 'border-surface-200 bg-white text-gray-700'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{item.name}</span>
                      <span className="text-[10px] text-gray-400">
                        {categoryNames.get(item.categoryId) || item.categoryId}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={isOut}
                      disabled={availabilityBusy === String(item.id)}
                      onChange={(event) => handleAvailability(String(item.id), event.target.checked)}
                      className="h-4 w-4 flex-shrink-0 rounded border-surface-300 text-rose-600"
                      aria-label={`Mark ${item.name} sold out`}
                    />
                  </label>
                );
              })}
            </div>
            {!availabilityItems.length && (
              <p className="mt-3 text-sm text-gray-500">No dishes match that search.</p>
            )}
          </div>
        </details>

        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-surface-200 bg-white p-3 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 overflow-x-auto">
            {FILTERS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setFilter(entry.id)}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                  filter === entry.id
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-100 text-gray-600 hover:bg-brand-100 hover:text-brand-800'
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-400">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Loading…'}
          </p>
        </div>

        {loading && !orders.length ? (
          <div className="mt-8 rounded-2xl border border-surface-200 bg-white py-16 text-center text-sm text-gray-500">
            Loading orders…
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-surface-300 bg-white py-16 text-center">
            <p className="text-4xl">🍽️</p>
            <h2 className="mt-3 font-display text-2xl font-semibold text-gray-900">No orders here</h2>
            <p className="mt-1 text-sm text-gray-500">
              New orders will appear automatically, and the staff WhatsApp numbers get an alert.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {visibleOrders.map((order) => (
              <article
                key={order.id}
                className={`rounded-2xl border bg-white p-4 shadow-soft sm:p-5 ${
                  order.status === 'new' ? 'border-amber-300' : 'border-surface-200'
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-xl font-semibold text-gray-900">{order.id}</h2>
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusClass(order.status)}`}>
                        {statusLabel(order.status)}
                      </span>
                      <span className="rounded-full bg-surface-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600">
                        {order.orderType === 'delivery' ? 'Delivery' : 'Pickup'}
                      </span>
                      {order.scheduledFor ? (
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-800">
                          Scheduled · {formatWhen(order.scheduledFor)}
                        </span>
                      ) : (
                        <span className="rounded-full bg-surface-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600">
                          ~{order.prepMinutes || 20} min
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          order.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.paymentStatus === 'refunded'
                              ? 'bg-surface-200 text-gray-700'
                              : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {order.paymentMethod === 'upi' ? 'UPI' : 'Pay later'} ·{' '}
                        {order.paymentStatus || 'pending'}
                      </span>
                      {order.loyaltyRewardUsed && (
                        <span className="rounded-full bg-brand-100 px-2.5 py-1 text-[10px] font-semibold text-brand-800">
                          ★ Reward used
                        </span>
                      )}
                      {order.phoneVerified && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                          ✓ Phone verified
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{formatWhen(order.createdAt)}</p>
                  </div>
                  <p className="font-display text-2xl font-semibold text-brand-800">
                    {formatINR(order.total ?? order.subtotal)}
                  </p>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_1fr]">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {order.customerName}
                      <span className="ml-2 text-sm font-normal text-gray-500">{order.customerPhone}</span>
                    </p>
                    {order.orderType === 'delivery' ? (
                      <p className="mt-1 text-sm text-gray-600">{order.address || 'No address provided'}</p>
                    ) : (
                      <p className="mt-1 text-sm text-gray-600">Pickup from College Square, Belonia</p>
                    )}
                    {order.orderType === 'delivery' && (
                      <p className="mt-1 text-[11px] font-semibold text-gray-500">
                        {order.deliveryZone || 'Delivery area not set'}
                        {Number(order.deliveryFee) > 0
                          ? ` · fee ${formatINR(order.deliveryFee)}`
                          : ' · free delivery'}
                      </p>
                    )}
                    {order.notes && (
                      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        <span className="font-semibold">Note:</span> {order.notes}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a href={`tel:+91${order.customerPhone}`} className="btn-outline px-3 py-1.5 text-xs">
                        Call customer
                      </a>
                      <a
                        href={`https://wa.me/91${order.customerPhone}?text=${encodeURIComponent(
                          `Hello ${order.customerName}, this is ${restaurantInfo.name} about your order ${order.id}.`,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                      >
                        WhatsApp customer
                      </a>
                    </div>
                  </div>

                  <div className="rounded-xl bg-surface-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">Items</p>
                    <ul className="mt-2 space-y-1.5">
                      {order.items.map((item, index) => (
                        <li key={`${order.id}-${item.id}-${index}`} className="flex justify-between gap-3 text-sm">
                          <span className="text-gray-700">
                            {item.quantity}× {item.name}
                            {item.portion ? <span className="text-gray-400"> · {item.portion}</span> : null}
                          </span>
                          <span className="flex-shrink-0 font-medium text-gray-900">
                            {formatINR(item.price * item.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 space-y-1 border-t border-surface-200 pt-2 text-[11px] text-gray-500">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatINR(order.subtotal)}</span>
                      </div>
                      {Number(order.deliveryFee) > 0 && (
                        <div className="flex justify-between">
                          <span>Delivery fee</span>
                          <span>{formatINR(order.deliveryFee)}</span>
                        </div>
                      )}
                      {Number(order.discount) > 0 && (
                        <div className="flex justify-between text-emerald-700">
                          <span>Loyalty reward</span>
                          <span>−{formatINR(order.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-dashed border-surface-300 pt-1 text-xs font-bold text-gray-900">
                        <span>Total</span>
                        <span>{formatINR(order.total ?? order.subtotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-dashed border-surface-200 pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePrintKot(order)}
                      className="rounded-xl border border-surface-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-brand-300 hover:text-brand-800"
                    >
                      🖨️ Print KOT
                    </button>
                    {order.paymentStatus !== 'paid' && order.paymentStatus !== 'refunded' && (
                      <button
                        type="button"
                        onClick={() => handlePayment(order.id, 'paid')}
                        disabled={paymentBusy === order.id}
                        className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800 hover:bg-sky-100 disabled:opacity-60"
                      >
                        {paymentBusy === order.id ? 'Saving…' : '✓ Mark paid'}
                      </button>
                    )}
                    {order.paymentStatus === 'paid' && order.paymentMethod === 'upi' && (
                      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-800">
                        UPI verified
                      </span>
                    )}
                    {order.status === 'completed' && !order.reviewRequestedAt && (
                      <button
                        type="button"
                        onClick={() => handleReview(order)}
                        disabled={reviewBusy === order.id}
                        className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-100 disabled:opacity-60"
                      >
                        {reviewBusy === order.id ? 'Preparing…' : '⭐ Ask for Google review'}
                      </button>
                    )}
                    {order.reviewRequestedAt && (
                      <span className="rounded-full bg-surface-100 px-3 py-1.5 text-[11px] font-semibold text-gray-600">
                        Review requested
                      </span>
                    )}
                    {!String(order.id).startsWith('WA-') && (
                      <Link
                        to={`/track/${order.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-surface-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-surface-100"
                      >
                        Customer tracking
                      </Link>
                    )}
                  </div>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                      Update status
                      <select
                        value={order.status}
                        onChange={(event) => handleStatus(order.id, event.target.value)}
                        disabled={updatingId === order.id}
                        className="input-field w-auto py-2 text-xs font-semibold"
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status.id} value={status.id}>{status.label}</option>
                        ))}
                      </select>
                    </label>
                    {order.status !== 'completed' && order.status !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => handleStatus(order.id, 'completed')}
                        disabled={updatingId === order.id}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {updatingId === order.id ? 'Saving…' : 'Mark completed'}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-[11px] text-gray-400">
          Staff alerts are sent on WhatsApp to active staff numbers. Keep this screen open for
          browser notifications, or rely on WhatsApp when the screen is closed.
        </p>
      </main>
    </div>
  );
}
