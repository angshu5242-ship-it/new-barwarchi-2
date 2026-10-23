import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSiteData } from '../context/SiteDataContext';
import { formatINR } from '../utils/price';
import {
  getStaffOrders,
  getStaffSession,
  staffLogin,
  updateStaffOrderStatus,
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
  const { restaurantInfo } = useSiteData();
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
  const seenRef = useRef(readSeen());
  const initialLoadRef = useRef(true);

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
    },
    [token, clearSession, showBrowserNotification],
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
                      {order.phoneVerified && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                          ✓ Phone verified
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{formatWhen(order.createdAt)}</p>
                  </div>
                  <p className="font-display text-2xl font-semibold text-brand-800">
                    {formatINR(order.subtotal)}
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
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 border-t border-dashed border-surface-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
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
