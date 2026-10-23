import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../components/Header';
import { useSiteData } from '../context/SiteDataContext';
import FoodImage from '../components/FoodImage';
import { formatINR, parsePrice } from '../utils/price';
import { buildCheckoutMessage, buildWhatsAppUrl } from '../utils/whatsapp';
import { requestOtp, verifyOtp } from '../utils/authApi';
import {
  getOrderServiceStatus,
  lookupCustomer,
  submitOnlineOrder,
} from '../utils/orderApi';

const PROFILE_KEY = 'nb2_customer_profiles';
const SESSION_KEY = 'nb2_customer_session';
const TOKEN_KEY = 'nb2_customer_token';
const TOKEN_EXPIRY_KEY = 'nb2_customer_token_expiry';
const HISTORY_KEY = 'nb2_my_orders';

function normalizePhone(value = '') {
  let digits = String(value).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 10);
}

function validPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

function readProfiles() {
  try {
    const data = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

function readHistory() {
  try {
    const data = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveProfile(phone, profile) {
  if (!validPhone(phone)) return;
  try {
    const profiles = readProfiles();
    profiles[phone] = { ...profile, updatedAt: new Date().toISOString() };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
    sessionStorage.setItem(SESSION_KEY, phone);
  } catch {
    // The order can still continue if browser storage is unavailable.
  }
}

function readVerifiedSession() {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY) || '';
    const expiry = Number(sessionStorage.getItem(TOKEN_EXPIRY_KEY) || 0);
    const phone = normalizePhone(sessionStorage.getItem(SESSION_KEY) || '');
    if (token && validPhone(phone) && expiry > Date.now()) {
      return { token, expiry, phone };
    }
  } catch {
    // Ignore.
  }
  return null;
}

function saveVerifiedSession(phone, token, expiresAt) {
  try {
    sessionStorage.setItem(SESSION_KEY, phone);
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(expiresAt));
  } catch {
    // Ignore.
  }
}

function clearVerifiedSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch {
    // Ignore.
  }
}

function saveHistory(order) {
  try {
    const history = readHistory();
    const next = [order, ...history.filter((entry) => entry.id !== order.id)].slice(0, 20);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // Ignore.
  }
}

export default function Order() {
  const { cart, cartTotal, removeFromCart, updateQuantity, clearCart } = useCart();
  const { restaurantInfo } = useSiteData();
  const [phone, setPhone] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [knownCustomer, setKnownCustomer] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [otpStep, setOtpStep] = useState('phone');
  const [otpCode, setOtpCode] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpNotice, setOtpNotice] = useState('');
  const [devCode, setDevCode] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [otpUnavailable, setOtpUnavailable] = useState(false);
  const [directWhatsApp, setDirectWhatsApp] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    orderType: 'pickup',
    address: '',
    notes: '',
  });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [service, setService] = useState(null);
  const [serviceLoaded, setServiceLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [fallback, setFallback] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const checkoutMessage = useMemo(
    () =>
      buildCheckoutMessage(
        {
          cart,
          customer: { name: profile.name, phone, address: profile.address },
          orderType: profile.orderType,
          notes: profile.notes,
        },
        restaurantInfo,
      ),
    [cart, phone, profile, restaurantInfo],
  );
  const whatsappFallback = useMemo(
    () => buildWhatsAppUrl(restaurantInfo.whatsapp, checkoutMessage),
    [checkoutMessage, restaurantInfo.whatsapp],
  );

  useEffect(() => {
    document.title = `Order online | ${restaurantInfo.name}`;
    return () => {
      document.title = `${restaurantInfo.name} - Belonia's Favorite Restaurant | South Tripura`;
    };
  }, [restaurantInfo.name]);

  useEffect(() => {
    let cancelled = false;
    getOrderServiceStatus().then((result) => {
      if (cancelled) return;
      setService(result.data?.service || { database: false, whatsapp: false, otp: false });
      setServiceLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const session = readVerifiedSession();
    if (session) {
      const local = readProfiles()[session.phone];
      setPhone(session.phone);
      setAuthToken(session.token);
      setLoggedIn(true);
      setOtpStep('verified');
      setKnownCustomer(Boolean(local?.name));
      if (local) {
        setProfile((current) => ({
          ...current,
          name: local.name || '',
          orderType: local.orderType || 'pickup',
          address: local.address || '',
          notes: local.notes || '',
        }));
      }
      return;
    }

    try {
      const savedPhone = normalizePhone(sessionStorage.getItem(SESSION_KEY) || '');
      if (validPhone(savedPhone)) setPhone(savedPhone);
    } catch {
      // Ignore.
    }
  }, []);

  useEffect(() => {
    if (!loggedIn || !validPhone(phone)) return undefined;
    const timer = window.setTimeout(() => {
      saveProfile(phone, {
        name: profile.name.trim(),
        orderType: profile.orderType,
        address: profile.orderType === 'delivery' ? profile.address.trim() : '',
        notes: profile.notes.trim(),
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [loggedIn, phone, profile]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = window.setTimeout(() => {
      setResendIn((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  useEffect(() => {
    if (!loggedIn || !validPhone(phone) || !service?.database) return;
    let cancelled = false;
    lookupCustomer(phone).then((result) => {
      if (cancelled || !result.ok) return;
      if (result.data?.orders) setRecentOrders(result.data.orders);
      if (result.data?.customer?.name) {
        setKnownCustomer(true);
        setProfile((current) =>
          current.name ? current : { ...current, name: result.data.customer.name },
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loggedIn, phone, service?.database]);

  const updateProfile = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const handleRequestOtp = async (event) => {
    event?.preventDefault();
    if (otpBusy) return;

    const digits = normalizePhone(phone);
    if (!validPhone(digits)) {
      setError('Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.');
      return;
    }

    setPhone(digits);
    setError('');
    setOtpNotice('');
    setDevCode('');
    setOtpUnavailable(false);
    setOtpBusy(true);

    const result = await requestOtp(digits);
    setOtpBusy(false);

    if (!result.ok) {
      setError(result.error || 'Could not send the code. Please try again or order on WhatsApp.');
      if (result.data?.otpConfigured === false) setOtpUnavailable(true);
      if (result.data?.retryAfter) setResendIn(Number(result.data.retryAfter) || 0);
      return;
    }

    setOtpStep('code');
    setOtpCode('');
    setDevCode(result.data?.devCode || '');
    setOtpNotice(result.data?.message || 'A 6-digit code was sent to your WhatsApp.');
    setResendIn(Number(result.data?.resendAfter) || 30);
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    if (otpBusy) return;

    const digits = normalizePhone(phone);
    const code = String(otpCode).replace(/\D/g, '');
    if (!validPhone(digits)) {
      setError('Enter a valid mobile number.');
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from WhatsApp.');
      return;
    }

    setError('');
    setOtpBusy(true);
    const result = await verifyOtp(digits, code);
    setOtpBusy(false);

    if (!result.ok) {
      setError(result.error || 'That code could not be verified. Please try again.');
      return;
    }

    if (!result.data?.token) {
      setError('The login service did not return a session. Please request a new code.');
      return;
    }

    const expiresAt = result.data.expiresAt
      ? new Date(result.data.expiresAt).getTime()
      : Date.now() + 24 * 60 * 60 * 1000;

    setAuthToken(result.data.token);
    saveVerifiedSession(digits, result.data.token, expiresAt);
    setLoggedIn(true);
    setOtpStep('verified');
    setDirectWhatsApp(false);
    setOtpCode('');
    setDevCode('');
    setResendIn(0);
    setError('');
    setOtpNotice('Number verified. Your details are ready below.');

    const local = readProfiles()[digits];
    setKnownCustomer(Boolean(local?.name));
    if (local) {
      setProfile((current) => ({
        ...current,
        name: local.name || current.name,
        orderType: local.orderType || current.orderType,
        address: local.address || current.address,
        notes: local.notes || current.notes,
      }));
    }
  };

  const handleChangeNumber = () => {
    clearVerifiedSession();
    setPhone('');
    setLoggedIn(false);
    setKnownCustomer(false);
    setAuthToken('');
    setRecentOrders([]);
    setOtpStep('phone');
    setOtpCode('');
    setOtpBusy(false);
    setOtpNotice('');
    setDevCode('');
    setResendIn(0);
    setOtpUnavailable(false);
    setDirectWhatsApp(false);
    setError('');
    setProfile((current) => ({ ...current, name: '', address: '' }));
  };

  const handleUseWhatsAppInstead = () => {
    clearVerifiedSession();
    setAuthToken('');
    setDirectWhatsApp(true);
    setLoggedIn(true);
    setOtpStep('verified');
    setOtpNotice(
      'Continuing without OTP. Your order will open in WhatsApp and will not appear in the kitchen dashboard.',
    );
    setError('');
  };

  const validateForm = () => {
    if (!validPhone(phone)) return 'Enter a valid mobile number.';
    if (profile.name.trim().length < 2) return 'Please enter your name.';
    if (profile.orderType === 'delivery' && profile.address.trim().length < 8) {
      return 'Please add a delivery address with a nearby landmark.';
    }
    if (!consent) return 'Please agree to be contacted on WhatsApp about this order.';
    if (!cart.length) return 'Your basket is empty.';
    return '';
  };

  const persistCustomer = () => {
    saveProfile(phone, {
      name: profile.name.trim(),
      orderType: profile.orderType,
      address: profile.orderType === 'delivery' ? profile.address.trim() : '',
      notes: profile.notes.trim(),
    });
  };

  const saveOrderHistory = (orderId, status = 'sent') => {
    saveHistory({
      id: orderId,
      status,
      subtotal: cartTotal,
      createdAt: new Date().toISOString(),
      items: cart.map((item) => ({
        name: item.name,
        portion: item.portion || '',
        quantity: item.quantity,
        price: parsePrice(item.price),
      })),
    });
  };

  const prepareFallback = () => {
    persistCustomer();
    setFallback({
      url: whatsappFallback,
      message: checkoutMessage,
    });
    window.setTimeout(() => {
      document.getElementById('order-fallback')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const problem = validateForm();
    if (problem) {
      setError(problem);
      return;
    }

    setError('');
    setSubmitting(true);

    if (directWhatsApp || !service?.database) {
      prepareFallback();
      setSubmitting(false);
      return;
    }

    const payload = {
      customer: {
        name: profile.name.trim(),
        phone,
        orderType: profile.orderType,
        address: profile.orderType === 'delivery' ? profile.address.trim() : '',
      },
      notes: profile.notes.trim(),
      authToken,
      items: cart.map((item) => ({
        id: String(item.id),
        name: item.name,
        portion: item.portion || '',
        price: parsePrice(item.price),
        quantity: item.quantity,
      })),
    };

    const result = await submitOnlineOrder(payload);
    setSubmitting(false);

    if (!result.ok) {
      if (result.status === 401) {
        clearVerifiedSession();
        setAuthToken('');
        setLoggedIn(false);
        setOtpStep('phone');
        setOtpNotice('');
        setOtpCode('');
        setDevCode('');
      }
      setError(result.error || 'The order could not be placed. Please try again or use WhatsApp.');
      return;
    }

    persistCustomer();
    saveOrderHistory(result.data.order.id, result.data.order.status || 'new');
    clearCart();
    setSuccess(result.data.order);
    setFallback(
      result.data.notify?.sent
        ? null
        : { url: result.data.fallbackUrl || whatsappFallback, message: checkoutMessage },
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFallbackConfirmed = () => {
    const previewId = `WA-${String(Date.now()).slice(-6)}`;
    persistCustomer();
    saveOrderHistory(previewId, 'sent on WhatsApp');
    const preview = {
      id: previewId,
      status: 'sent on WhatsApp',
      subtotal: cartTotal,
      orderType: profile.orderType,
      address: profile.address,
      createdAt: new Date().toISOString(),
      items: cart.map((item) => ({
        name: item.name,
        portion: item.portion || '',
        quantity: item.quantity,
        price: parsePrice(item.price),
      })),
      notify: { sent: true },
    };
    clearCart();
    setFallback(null);
    setSuccess(preview);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startAnother = () => {
    setSuccess(null);
    setFallback(null);
    setError('');
    setConsent(false);
    setRecentOrders([]);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-surface-50 pb-16 pt-24 md:pt-32">
        <div className="section-container">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-strong sm:p-9">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-800">
                  ✓
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                    {success.notify?.sent || success.whatsappSent
                      ? 'Order sent to the kitchen'
                      : 'Order saved'}
                  </p>
                  <h1 className="mt-1 font-display text-3xl font-semibold text-gray-900">
                    Thank you, {profile.name || 'friend'}!
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Order <strong className="text-gray-800">{success.id}</strong>
                    {success.createdAt
                      ? ` · ${new Date(success.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}`
                      : ''}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 rounded-2xl bg-surface-50 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Order type</p>
                  <p className="mt-0.5 font-semibold text-gray-900">
                    {success.orderType === 'delivery' ? 'Home delivery' : 'Pickup'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Total</p>
                  <p className="mt-0.5 font-semibold text-brand-800">{formatINR(success.subtotal)}</p>
                </div>
                {success.address && (
                  <div className="sm:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Address</p>
                    <p className="mt-0.5 text-sm text-gray-700">{success.address}</p>
                  </div>
                )}
              </div>

              <div className="mt-5 space-y-2 border-t border-surface-200 pt-5">
                {success.items?.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-700">
                      {item.quantity} × {item.name}
                      {item.portion ? ` (${item.portion})` : ''}
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatINR((item.price || 0) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {fallback && (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">
                    One more tap to alert the kitchen
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-800">
                    Your order is saved in the kitchen dashboard. Open WhatsApp and press send so the
                    team gets the alert immediately.
                  </p>
                  <a
                    href={fallback.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center justify-center rounded-xl bg-[#1f9d55] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#178247]"
                  >
                    Open WhatsApp alert
                  </a>
                </div>
              )}

              <div className="mt-7 flex flex-col gap-2 sm:flex-row">
                <Link to="/menu" className="btn-primary flex-1" onClick={startAnother}>
                  Order something else
                </Link>
                <a href={`tel:${restaurantInfo.phoneRaw}`} className="btn-secondary flex-1">
                  Call the kitchen
                </a>
              </div>
              <p className="mt-4 text-center text-xs text-gray-500">
                {restaurantInfo.deliveryNote}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 pb-16 pt-20 md:pt-28">
      <div className="section-container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
            {restaurantInfo.menuTitle} · Online order
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-gray-900 md:text-5xl">
            Let’s get your order to the kitchen.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-gray-600">
            Verify your mobile number with a one-time code, choose pickup or delivery, and we’ll take
            it from there.
          </p>
        </div>

        {serviceLoaded && (
          <div
            className={`mx-auto mt-6 max-w-3xl rounded-xl border px-4 py-3 text-center text-xs font-medium ${
              service?.database && service?.otp
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-900'
            }`}
          >
            {service?.database
              ? service.otp
                ? service.whatsapp
                  ? 'Online ordering is live. Verify your number with a WhatsApp OTP — the kitchen receives the order automatically.'
                  : 'Online ordering is live. Your order will be saved for the kitchen; tap the WhatsApp link to alert them instantly.'
                : 'Online ordering is live, but OTP delivery is not configured yet. Use WhatsApp to send your order for now.'
              : 'Online checkout is not connected yet. Your order will open in WhatsApp for you to send.'}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-soft sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
                    Step 1
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-gray-900">
                    Verify your mobile
                  </h2>
                </div>
                {loggedIn && (
                  <button
                    type="button"
                    onClick={handleChangeNumber}
                    className="text-xs font-semibold text-brand-700 hover:underline"
                  >
                    Change number
                  </button>
                )}
              </div>

              {!loggedIn ? (
                <div className="mt-5">
                  {otpStep === 'phone' ? (
                    <>
                      <label htmlFor="customer-phone" className="label">Your mobile number</label>
                      <div className="flex overflow-hidden rounded-xl border border-surface-300 bg-white focus-within:border-brand-500">
                        <span className="flex items-center border-r border-surface-200 bg-surface-50 px-3 text-sm font-semibold text-gray-500">
                          +91
                        </span>
                        <input
                          id="customer-phone"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          value={phone}
                          onChange={(event) => {
                            setPhone(normalizePhone(event.target.value));
                            setError('');
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              handleRequestOtp(event);
                            }
                          }}
                          placeholder="98765 43210"
                          className="min-w-0 flex-1 px-3 py-3 text-base text-gray-900 focus:outline-none"
                          autoFocus
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        disabled={otpBusy}
                        className="btn-primary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {otpBusy ? 'Sending code…' : 'Send OTP on WhatsApp'}
                      </button>
                      <p className="mt-3 text-xs leading-relaxed text-gray-500">
                        We’ll send a 6-digit code to this number on WhatsApp. The code expires in
                        5 minutes. Standard WhatsApp message rates may apply.
                      </p>

                      {(otpUnavailable || (serviceLoaded && service?.otp === false)) && (
                        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                          <p className="text-xs font-semibold text-amber-900">
                            OTP delivery is not configured yet
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-amber-800">
                            You can still order by sending your basket to the restaurant on WhatsApp.
                          </p>
                          <button
                            type="button"
                            onClick={handleUseWhatsAppInstead}
                            className="mt-2 text-xs font-bold text-amber-900 underline"
                          >
                            Order on WhatsApp instead
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-50 px-4 py-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                            Code sent to
                          </p>
                          <p className="text-sm font-semibold text-gray-900">+91 {phone}</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleChangeNumber}
                          className="text-xs font-semibold text-brand-700 hover:underline"
                        >
                          Change
                        </button>
                      </div>

                      <label htmlFor="otp-code" className="label mt-4">6-digit OTP</label>
                      <input
                        id="otp-code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={otpCode}
                        onChange={(event) => {
                          setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6));
                          setError('');
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            handleVerifyOtp(event);
                          }
                        }}
                        placeholder="123456"
                        className="input-field text-center text-2xl font-semibold tracking-[0.45em]"
                        autoFocus
                      />

                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={otpBusy || otpCode.length !== 6}
                        className="btn-primary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {otpBusy ? 'Verifying…' : 'Verify and continue'}
                      </button>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={handleRequestOtp}
                          disabled={otpBusy || resendIn > 0}
                          className="text-xs font-semibold text-brand-700 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
                        >
                          {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
                        </button>
                        <button
                          type="button"
                          onClick={handleUseWhatsAppInstead}
                          className="text-xs font-semibold text-emerald-700 hover:underline"
                        >
                          Order on WhatsApp instead
                        </button>
                      </div>

                      {devCode && (
                        <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-700">
                            Development mode only
                          </p>
                          <p className="mt-1 text-sm text-sky-900">
                            Your test code is{' '}
                            <strong className="text-base tracking-[0.2em]">{devCode}</strong>
                          </p>
                          <p className="mt-1 text-[11px] leading-relaxed text-sky-700">
                            This appears because no WhatsApp OTP template is configured locally.
                            Production never shows the code on screen.
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {otpStep === 'code' && otpNotice && (
                    <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                      {otpNotice}
                    </p>
                  )}

                  {error && (
                    <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
                      {error}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-5">
                  {directWhatsApp ? (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
                        !
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-amber-900">
                          Continuing without OTP
                        </p>
                        <p className="text-xs text-amber-800">
                          +91 {phone} · your order will open in WhatsApp and will not appear in the
                          kitchen dashboard.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm text-white">
                        ✓
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-emerald-900">
                          {knownCustomer
                            ? `Welcome back, ${profile.name.split(' ')[0] || 'friend'}`
                            : 'Number verified'}
                        </p>
                        <p className="text-xs text-emerald-800">+91 {phone} · verified with OTP</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <label htmlFor="customer-name" className="label">Your name</label>
                    <input
                      id="customer-name"
                      value={profile.name}
                      onChange={(event) => updateProfile('name', event.target.value)}
                      placeholder="Full name"
                      className="input-field"
                      autoComplete="name"
                    />
                  </div>

                  <fieldset className="mt-4">
                    <legend className="label">How would you like it?</legend>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      {[
                        { id: 'pickup', title: 'Pickup', copy: 'College Square' },
                        { id: 'delivery', title: 'Delivery', copy: 'Around Belonia' },
                      ].map((option) => (
                        <label
                          key={option.id}
                          className={`cursor-pointer rounded-xl border-2 p-3 transition-colors ${
                            profile.orderType === option.id
                              ? 'border-brand-600 bg-brand-50'
                              : 'border-surface-200 bg-white hover:border-brand-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="order-type"
                            value={option.id}
                            checked={profile.orderType === option.id}
                            onChange={() => updateProfile('orderType', option.id)}
                            className="sr-only"
                          />
                          <span className="block text-sm font-semibold text-gray-900">{option.title}</span>
                          <span className="mt-0.5 block text-[11px] text-gray-500">{option.copy}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {profile.orderType === 'delivery' && (
                    <div className="mt-4">
                      <label htmlFor="customer-address" className="label">Delivery address</label>
                      <textarea
                        id="customer-address"
                        value={profile.address}
                        onChange={(event) => updateProfile('address', event.target.value)}
                        placeholder="House / road, landmark, Belonia"
                        rows={3}
                        className="input-field resize-y"
                        autoComplete="street-address"
                      />
                      <p className="mt-1 text-[11px] text-gray-500">{restaurantInfo.deliveryNote}</p>
                    </div>
                  )}

                  <div className="mt-4">
                    <label htmlFor="order-notes" className="label">Notes for the kitchen (optional)</label>
                    <textarea
                      id="order-notes"
                      value={profile.notes}
                      onChange={(event) => updateProfile('notes', event.target.value)}
                      placeholder="Spice level, extra chutney, delivery instructions…"
                      rows={2}
                      className="input-field resize-y"
                    />
                  </div>

                  {recentOrders.length > 0 && (
                    <div className="mt-4 rounded-xl bg-surface-50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        Recent orders on this number
                      </p>
                      <ul className="mt-1.5 space-y-1 text-xs text-gray-600">
                        {recentOrders.slice(0, 3).map((order) => (
                          <li key={order.id} className="flex justify-between gap-2">
                            <span>{order.id}</span>
                            <span>{order.status} · {formatINR(order.subtotal)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </section>

            {loggedIn && (
              <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-soft sm:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
                  Step 2
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-gray-900">
                  Confirm your order
                </h2>
                <label className="mt-4 flex items-start gap-3 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>
                    I agree to be contacted on WhatsApp about this order and understand that the
                    kitchen will confirm availability, timing and delivery charges.
                  </span>
                </label>

                {error && (
                  <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || cart.length === 0 || !serviceLoaded}
                  className="btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {!serviceLoaded
                    ? 'Checking order service…'
                    : submitting
                      ? 'Sending your order…'
                      : service?.database && !directWhatsApp
                        ? `Place order · ${formatINR(cartTotal)}`
                        : `Send order on WhatsApp · ${formatINR(cartTotal)}`}
                </button>
                <p className="mt-2 text-center text-[11px] text-gray-500">
                  Pay at pickup or on delivery. No online payment is collected.
                </p>
              </section>
            )}

            {fallback && (
              <section
                id="order-fallback"
                className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-soft sm:p-6"
              >
                <h2 className="font-display text-2xl font-semibold text-amber-950">
                  Finish your order on WhatsApp
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-amber-900">
                  Your basket and details are ready. Open WhatsApp and press send so our kitchen gets
                  the order.
                </p>
                <a
                  href={fallback.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#1f9d55] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#178247]"
                >
                  Open WhatsApp with my order
                </a>
                <button
                  type="button"
                  onClick={handleFallbackConfirmed}
                  className="mt-2 w-full rounded-xl border border-amber-300 bg-white px-5 py-3 text-sm font-semibold text-amber-900 hover:bg-amber-100"
                >
                  I’ve sent the order
                </button>
              </section>
            )}
          </form>

          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-soft sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-semibold text-gray-900">Your basket</h2>
                <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-800">
                  {itemCount} item{itemCount === 1 ? '' : 's'}
                </span>
              </div>

              {cart.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-4xl">🛍️</p>
                  <p className="mt-3 font-semibold text-gray-900">Your basket is empty</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Add a biryani, roll or momo plate and come back here.
                  </p>
                  <Link to="/menu" className="btn-primary mt-5">
                    Browse the menu
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mt-4 space-y-3">
                    {cart.map((item) => {
                      const key = item.cartKey ?? item.id;
                      return (
                        <div key={key} className="flex gap-3 rounded-2xl border border-surface-200 p-3">
                          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-brand-50">
                            <FoodImage
                              src={item.image}
                              alt={item.name}
                              fallback={item.vegetarian ? '🥬' : '🍗'}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-900">
                                  {item.name}
                                  {item.portion && (
                                    <span className="ml-1 font-normal text-gray-500">({item.portion})</span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500">{formatINR(parsePrice(item.price))} each</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFromCart(key)}
                                className="rounded p-1 text-gray-400 hover:text-rose-600"
                                aria-label={`Remove ${item.name}`}
                              >
                                ✕
                              </button>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(key, item.quantity - 1)}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-300 text-gray-600 hover:border-brand-500 hover:text-brand-700"
                                  aria-label={`Decrease ${item.name}`}
                                >
                                  −
                                </button>
                                <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(key, item.quantity + 1)}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-300 text-gray-600 hover:border-brand-500 hover:text-brand-700"
                                  aria-label={`Increase ${item.name}`}
                                >
                                  +
                                </button>
                              </div>
                              <span className="text-sm font-semibold text-brand-800">
                                {formatINR(parsePrice(item.price) * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-dashed border-surface-300 pt-4 text-lg font-semibold text-gray-900">
                    <span>Total</span>
                    <span>{formatINR(cartTotal)}</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
                    Delivery charges, if any, are confirmed on WhatsApp. Prices are in INR.
                  </p>
                  <Link to="/menu" className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">
                    + Add more items
                  </Link>
                </>
              )}
            </section>

            <section className="mt-4 rounded-2xl border border-surface-200 bg-white p-4 text-sm text-gray-600 shadow-soft">
              <p className="font-semibold text-gray-900">Need help with your order?</p>
              <div className="mt-2 space-y-1">
                <a href={`tel:${restaurantInfo.phoneRaw}`} className="block text-brand-700 hover:underline">
                  {restaurantInfo.phone}
                </a>
                {restaurantInfo.phone2 && (
                  <a href={`tel:${restaurantInfo.phone2Raw}`} className="block text-brand-700 hover:underline">
                    {restaurantInfo.phone2}
                  </a>
                )}
                <a
                  href={buildWhatsAppUrl(restaurantInfo.whatsapp, `Hello ${restaurantInfo.name}! I need help with an order.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-emerald-700 hover:underline"
                >
                  Message us on WhatsApp
                </a>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
