import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useCart } from '../components/Header';
import { useSiteData } from '../context/SiteDataContext';
import { useLanguage } from '../context/LanguageContext';
import FoodImage from '../components/FoodImage';
import { formatINR, getPriceOptions, parsePrice } from '../utils/price';
import { buildCheckoutMessage, buildWhatsAppUrl } from '../utils/whatsapp';
import { requestOtp, verifyOtp } from '../utils/authApi';
import {
  getLoyalty,
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

const SCHEDULE_TIMES = Array.from({ length: 28 }, (_, index) => {
  const minutes = 8 * 60 + index * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
});

function buildScheduledIso(date, time) {
  if (!date || !time) return '';
  const value = new Date(`${date}T${time}:00+05:30`);
  return Number.isNaN(value.getTime()) ? '' : value.toISOString();
}

function istDateInput(date = new Date()) {
  // en-CA gives YYYY-MM-DD, which is what <input type="date"> expects.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function buildUpiUri({ upiId, upiName, amount, orderId }) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: upiName || 'New Bawarchi 2',
    am: String(amount),
    cu: 'INR',
    tn: `Order ${orderId}`,
  });
  return `upi://pay?${params.toString()}`;
}

export default function Order() {
  const { cart, cartTotal, addManyToCart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { restaurantInfo, siteConfig, allItems, isSoldOut } = useSiteData();
  const { t, language } = useLanguage();
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
  const [deliveryZoneId, setDeliveryZoneId] = useState(
    () => siteConfig.deliveryZones[0]?.id || '',
  );
  const [scheduleMode, setScheduleMode] = useState('asap');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [prepMinutes, setPrepMinutes] = useState(siteConfig.prepTimes[0] || 20);
  const [paymentMethod, setPaymentMethod] = useState('pay_later');
  const [useReward, setUseReward] = useState(false);
  const [loyalty, setLoyalty] = useState(null);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const deliveryZone =
    siteConfig.deliveryZones.find((zone) => zone.id === deliveryZoneId) ||
    siteConfig.deliveryZones[0] ||
    null;
  const deliveryFee = profile.orderType === 'delivery' ? Number(deliveryZone?.fee) || 0 : 0;
  const rewardDiscount =
    useReward && loyalty?.rewardAvailable
      ? Math.min(Number(loyalty.reward) || 0, cartTotal)
      : 0;
  const orderTotal = Math.max(0, cartTotal + deliveryFee - rewardDiscount);
  const scheduledFor = scheduleMode === 'scheduled'
    ? buildScheduledIso(scheduledDate, scheduledTime)
    : '';
  const unavailableInCart = cart.filter((item) => isSoldOut(item.id));
  const upiReady = Boolean(siteConfig.payment.upiEnabled && siteConfig.payment.upiId);
  const minScheduleDate = istDateInput();
  const maxScheduleDate = istDateInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const checkoutMessage = useMemo(
    () =>
      buildCheckoutMessage(
        {
          cart,
          customer: { name: profile.name, phone, address: profile.address },
          orderType: profile.orderType,
          notes: profile.notes,
          deliveryZone: deliveryZone?.name || '',
          deliveryFee,
          discount: rewardDiscount,
          total: orderTotal,
          scheduledFor: scheduleMode === 'scheduled' ? scheduledFor : null,
          prepMinutes,
          paymentMethod: upiReady ? paymentMethod : 'pay_later',
        },
        restaurantInfo,
      ),
    [
      cart,
      phone,
      profile,
      restaurantInfo,
      deliveryZone,
      deliveryFee,
      rewardDiscount,
      orderTotal,
      scheduleMode,
      scheduledFor,
      prepMinutes,
      upiReady,
      paymentMethod,
    ],
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

  useEffect(() => {
    if (!siteConfig.deliveryZones.some((zone) => zone.id === deliveryZoneId)) {
      setDeliveryZoneId(siteConfig.deliveryZones[0]?.id || '');
    }
    if (!siteConfig.prepTimes.includes(prepMinutes)) {
      setPrepMinutes(siteConfig.prepTimes[0] || 20);
    }
    if (!upiReady && paymentMethod === 'upi') setPaymentMethod('pay_later');
  }, [siteConfig, deliveryZoneId, prepMinutes, upiReady, paymentMethod]);

  useEffect(() => {
    if (!loggedIn || !authToken || !validPhone(phone) || !service?.database) {
      setLoyalty(null);
      return undefined;
    }
    let cancelled = false;
    getLoyalty(phone, authToken).then((result) => {
      if (cancelled) return;
      setLoyalty(result.ok ? result.data?.loyalty || null : null);
    });
    return () => {
      cancelled = true;
    };
  }, [loggedIn, authToken, phone, service?.database]);

  const updateProfile = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const handleRequestOtp = async (event) => {
    event?.preventDefault();
    if (otpBusy) return;

    const digits = normalizePhone(phone);
    if (!validPhone(digits)) {
      setError(
        t(
          'order.error.phone',
          'Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.',
        ),
      );
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
      setError(
        result.error ||
          t(
            'order.error.sendCode',
            'Could not send the code. Please try again or order on WhatsApp.',
          ),
      );
      if (result.data?.otpConfigured === false) setOtpUnavailable(true);
      if (result.data?.retryAfter) setResendIn(Number(result.data.retryAfter) || 0);
      return;
    }

    setOtpStep('code');
    setOtpCode('');
    setDevCode(result.data?.devCode || '');
    setOtpNotice(
      t('order.otpSent', result.data?.message || 'A 6-digit code was sent to your WhatsApp.'),
    );
    setResendIn(Number(result.data?.resendAfter) || 30);
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    if (otpBusy) return;

    const digits = normalizePhone(phone);
    const code = String(otpCode).replace(/\D/g, '');
    if (!validPhone(digits)) {
      setError(t('order.error.mobile', 'Enter a valid mobile number.'));
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError(t('order.error.otp', 'Enter the 6-digit code from WhatsApp.'));
      return;
    }

    setError('');
    setOtpBusy(true);
    const result = await verifyOtp(digits, code);
    setOtpBusy(false);

    if (!result.ok) {
      setError(
        result.error || t('order.error.verify', 'That code could not be verified. Please try again.'),
      );
      return;
    }

    if (!result.data?.token) {
      setError(
        t(
          'order.error.session',
          'The login service did not return a session. Please request a new code.',
        ),
      );
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
    setOtpNotice(
      t('order.verifiedDetails', 'Number verified. Your details are ready below.'),
    );

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
    setLoyalty(null);
    setUseReward(false);
    setPaymentMethod('pay_later');
    setProfile((current) => ({ ...current, name: '', address: '' }));
  };

  const handleUseWhatsAppInstead = () => {
    clearVerifiedSession();
    setAuthToken('');
    setDirectWhatsApp(true);
    setLoggedIn(true);
    setOtpStep('verified');
    setOtpNotice(
      t(
        'order.directWhatsAppNotice',
        'Continuing without OTP. Your order will open in WhatsApp and will not appear in the kitchen dashboard.',
      ),
    );
    setError('');
  };

  const validateForm = () => {
    if (!validPhone(phone)) return t('order.error.mobile', 'Enter a valid mobile number.');
    if (profile.name.trim().length < 2) return t('order.error.name', 'Please enter your name.');
    if (profile.orderType === 'delivery' && profile.address.trim().length < 8) {
      return t(
        'order.error.address',
        'Please add a delivery address with a nearby landmark.',
      );
    }
    if (!consent) {
      return t(
        'order.error.consent',
        'Please agree to be contacted on WhatsApp about this order.',
      );
    }
    if (!cart.length) return t('order.error.emptyCart', 'Your basket is empty.');
    if (unavailableInCart.length) {
      return `${unavailableInCart[0].name} is sold out right now. Please remove it from your basket.`;
    }
    if (profile.orderType === 'delivery' && !deliveryZone) {
      return t('order.error.zone', 'Please choose a delivery area.');
    }
    if (scheduleMode === 'scheduled') {
      if (!scheduledDate || !scheduledTime) {
        return t(
          'order.error.schedule',
          'Please choose the date and time for your scheduled order.',
        );
      }
      const when = new Date(scheduledFor);
      if (Number.isNaN(when.getTime()) || when.getTime() < Date.now() + 10 * 60 * 1000) {
        return t(
          'order.error.scheduleTime',
          'Scheduled orders must be at least 10 minutes from now.',
        );
      }
    }
    if (useReward && !loyalty?.rewardAvailable) {
      return t(
        'order.error.reward',
        'That loyalty reward is not available right now.',
      );
    }
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
      orderType: profile.orderType,
      subtotal: cartTotal,
      deliveryFee,
      discount: rewardDiscount,
      total: orderTotal,
      scheduledFor: scheduledFor || null,
      prepMinutes,
      createdAt: new Date().toISOString(),
      items: cart.map((item) => ({
        id: String(item.id),
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
      deliveryZoneId: profile.orderType === 'delivery' ? deliveryZoneId : '',
      scheduledFor: scheduleMode === 'scheduled' ? scheduledFor : null,
      prepMinutes,
      paymentMethod: upiReady ? paymentMethod : 'pay_later',
      useLoyaltyReward: Boolean(useReward && loyalty?.rewardAvailable),
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
      setError(
        result.error ||
          t(
            'order.error.place',
            'The order could not be placed. Please try again or use WhatsApp.',
          ),
      );
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

  const reorderOrder = (order) => {
    const entries = [];
    const skipped = [];
    (order.items || []).forEach((line) => {
      const item =
        allItems.find((candidate) => String(candidate.id) === String(line.id)) ||
        allItems.find((candidate) => candidate.name === line.name);
      if (!item || isSoldOut(item.id)) {
        skipped.push(line.name);
        return;
      }
      const options = getPriceOptions(item);
      const chosen =
        options.find((option) => option.label === line.portion) || options[0];
      entries.push({
        item: {
          ...item,
          image: item.image || item.categoryImage,
          price: chosen?.display || item.price,
          portion: options.length > 1 ? chosen?.label || '' : '',
          cartKey: `${item.id}-${chosen?.label || 'Regular'}`,
        },
        quantity: Number(line.quantity) || 1,
      });
    });

    if (!entries.length) {
      setError(
        t(
          'order.error.unavailable',
          'Those dishes are not available on today’s menu. Please choose something else.',
        ),
      );
      return;
    }
    addManyToCart(entries);
    setError(
      skipped.length
        ? `${skipped.join(', ')} ${skipped.length === 1 ? 'is' : 'are'} sold out and was not added.`
        : '',
    );
  };

  const successTotal = success?.total ?? success?.subtotal ?? 0;
  const successUpiUri =
    success?.paymentMethod === 'upi' && siteConfig.payment.upiId
      ? buildUpiUri({
          upiId: siteConfig.payment.upiId,
          upiName: siteConfig.payment.upiName,
          amount: successTotal,
          orderId: success.id,
        })
      : '';

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
                      ? t('order.orderSentKitchen', 'Order sent to the kitchen')
                      : t('order.orderSaved', 'Order saved')}
                  </p>
                  <h1 className="mt-1 font-display text-3xl font-semibold text-gray-900">
                    {t('order.thankYou', 'Thank you, {name}!').replace(
                      '{name}',
                      profile.name || 'friend',
                    )}
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    {t('order.orderWord', 'Order')}{' '}
                    <strong className="text-gray-800">{success.id}</strong>
                    {success.createdAt
                      ? ` · ${new Date(success.createdAt).toLocaleString(
                          language === 'bn' ? 'bn-IN' : 'en-IN',
                          {
                            timeZone: 'Asia/Kolkata',
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          },
                        )}`
                      : ''}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 rounded-2xl bg-surface-50 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    {t('order.orderTypeLabel', 'Order type')}
                  </p>
                  <p className="mt-0.5 font-semibold text-gray-900">
                    {success.orderType === 'delivery'
                      ? t('order.delivery', 'Home delivery')
                      : t('order.pickup', 'Pickup')}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    {t('common.total', 'Total')}
                  </p>
                  <p className="mt-0.5 font-semibold text-brand-800">
                    {formatINR(success.total ?? success.subtotal)}
                  </p>
                </div>
                {success.scheduledFor ? (
                  <div className="sm:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      {t('order.scheduledFor', 'Scheduled for')}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-700">
                      {new Date(success.scheduledFor).toLocaleString(
                        language === 'bn' ? 'bn-IN' : 'en-IN',
                        {
                          timeZone: 'Asia/Kolkata',
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        },
                      )}
                    </p>
                  </div>
                ) : success.readyAt ? (
                  <div className="sm:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      {t('order.expectedReady', 'Expected ready')}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-700">
                      {t('order.aboutMinutes', 'About {minutes} minutes').replace(
                        '{minutes}',
                        success.prepMinutes || prepMinutes,
                      )}{' '}
                      ·{' '}
                      {new Date(success.readyAt).toLocaleTimeString(
                        language === 'bn' ? 'bn-IN' : 'en-IN',
                        {
                          timeZone: 'Asia/Kolkata',
                          timeStyle: 'short',
                        },
                      )}
                    </p>
                  </div>
                ) : null}
                {success.address && (
                  <div className="sm:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      {t('order.addressLabel', 'Address')}
                    </p>
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

              <div className="mt-4 space-y-1.5 border-t border-surface-200 pt-4 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>{t('common.subtotal', 'Subtotal')}</span>
                  <span>{formatINR(success.subtotal || 0)}</span>
                </div>
                {Number(success.deliveryFee) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>{t('common.deliveryFee', 'Delivery fee')}</span>
                    <span>{formatINR(success.deliveryFee)}</span>
                  </div>
                )}
                {Number(success.discount) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>{t('common.discount', 'Loyalty reward')}</span>
                    <span>−{formatINR(success.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-dashed border-surface-300 pt-2 text-base font-bold text-gray-900">
                  <span>{t('common.total', 'Total')}</span>
                  <span>{formatINR(successTotal)}</span>
                </div>
              </div>

              {success.id && !String(success.id).startsWith('WA-') && (
                <Link
                  to={`/track/${success.id}`}
                  className="mt-5 flex w-full items-center justify-center rounded-xl border-2 border-brand-300 bg-brand-50 px-5 py-3 text-sm font-bold text-brand-800 hover:bg-brand-100"
                >
                  {t('order.trackLive', 'Track this order live')} →
                </Link>
              )}

              {successUpiUri && (
                <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-center">
                  <p className="text-sm font-bold text-sky-950">{t('order.upi', 'Pay by UPI')}</p>
                  <p className="mt-1 text-xs text-sky-800">
                    {t(
                      'order.upiScanHelp',
                      'Scan with any UPI app, or open the payment link on this phone.',
                    )}
                  </p>
                  <div className="mx-auto mt-3 w-fit rounded-2xl bg-white p-3 shadow-sm">
                    <QRCodeSVG value={successUpiUri} size={164} level="M" />
                  </div>
                  <a
                    href={successUpiUri}
                    className="mt-3 inline-flex items-center justify-center rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-800"
                  >
                    {t('order.openUpi', 'Open UPI app · {amount}').replace(
                      '{amount}',
                      formatINR(successTotal),
                    )}
                  </a>
                  <p className="mt-2 text-[11px] text-sky-700">
                    {t(
                      'order.upiVerifyHelp',
                      'Payment is verified by the kitchen. Keep the UPI confirmation handy.',
                    )}
                  </p>
                </div>
              )}

              {loyalty?.enabled && (
                <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-brand-900">
                      {t('order.loyalty', 'Loyalty card')}
                    </p>
                    <span className="text-xs font-semibold text-brand-700">
                      {loyalty.stamps}/{loyalty.target} {t('order.rewardProgress', 'stamps')}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    {Array.from({ length: loyalty.target }, (_, index) => (
                      <span
                        key={index}
                        className={`flex h-8 flex-1 items-center justify-center rounded-lg text-xs font-bold ${
                          index < loyalty.stamps
                            ? 'bg-brand-600 text-white'
                            : 'border border-brand-200 bg-white text-brand-300'
                        }`}
                      >
                        {index < loyalty.stamps ? '★' : '·'}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-brand-800">
                    {loyalty.rewardAvailable
                      ? `${t('order.rewardReady', 'Your reward is ready')}: ${formatINR(
                          loyalty.reward,
                        )} ${t('order.off', 'off')}`
                      : t('order.loyaltyHelp', loyalty.description)
                          .replace('{target}', loyalty.target)
                          .replace('{reward}', formatINR(loyalty.reward))}
                  </p>
                </div>
              )}

              {fallback && (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">
                    {t('order.oneMoreTap', 'One more tap to alert the kitchen')}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-800">
                    {t(
                      'order.oneMoreTapHelp',
                      'Your order is saved in the kitchen dashboard. Open WhatsApp and press send so the team gets the alert immediately.',
                    )}
                  </p>
                  <a
                    href={fallback.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center justify-center rounded-xl bg-[#1f9d55] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#178247]"
                  >
                    {t('order.openWhatsAppAlert', 'Open WhatsApp alert')}
                  </a>
                </div>
              )}

              <div className="mt-7 flex flex-col gap-2 sm:flex-row">
                <Link to="/menu" className="btn-primary flex-1" onClick={startAnother}>
                  {t('order.orderSomethingElse', 'Order something else')}
                </Link>
                <a href={`tel:${restaurantInfo.phoneRaw}`} className="btn-secondary flex-1">
                  {t('order.callKitchen', 'Call the kitchen')}
                </a>
              </div>
              <p className="mt-4 text-center text-xs text-gray-500">
                {t('order.deliveryNote', restaurantInfo.deliveryNote)}
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
            {t('menu.title', restaurantInfo.menuTitle)} ·{' '}
            {t('order.eyebrow', 'Online order')}
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-gray-900 md:text-5xl">
            {t('order.heading', 'Let’s get your order to the kitchen.')}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-gray-600">
            {t(
              'order.intro',
              'Verify your mobile number with a one-time code, choose pickup or delivery, and we’ll take it from there.',
            )}
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
                  ? t(
                      'order.service.liveOtp',
                      'Online ordering is live. Verify your number with a WhatsApp OTP — the kitchen receives the order automatically.',
                    )
                  : t(
                      'order.service.liveFallback',
                      'Online ordering is live. Your order will be saved for the kitchen; tap the WhatsApp link to alert them instantly.',
                    )
                : t(
                    'order.service.noOtp',
                    'Online ordering is live, but OTP delivery is not configured yet. Use WhatsApp to send your order for now.',
                  )
              : t(
                  'order.service.offline',
                  'Online checkout is not connected yet. Your order will open in WhatsApp for you to send.',
                )}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-soft sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
                    {t('order.step1', 'Step 1')}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-gray-900">
                    {t('order.verifyHeading', 'Verify your mobile')}
                  </h2>
                </div>
                {loggedIn && (
                  <button
                    type="button"
                    onClick={handleChangeNumber}
                    className="text-xs font-semibold text-brand-700 hover:underline"
                  >
                    {t('order.changeNumber', 'Change number')}
                  </button>
                )}
              </div>

              {!loggedIn ? (
                <div className="mt-5">
                  {otpStep === 'phone' ? (
                    <>
                      <label htmlFor="customer-phone" className="label">
                        {t('order.mobileLabel', 'Your mobile number')}
                      </label>
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
                        {otpBusy
                          ? t('order.sendingCode', 'Sending code…')
                          : t('order.sendOtp', 'Send OTP on WhatsApp')}
                      </button>
                      <p className="mt-3 text-xs leading-relaxed text-gray-500">
                        {t(
                          'order.otpHelp',
                          'We’ll send a 6-digit code to this number on WhatsApp. The code expires in 5 minutes. Standard WhatsApp message rates may apply.',
                        )}
                      </p>

                      {(otpUnavailable || (serviceLoaded && service?.otp === false)) && (
                        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                          <p className="text-xs font-semibold text-amber-900">
                            {t('order.otpNotConfigured', 'OTP delivery is not configured yet')}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-amber-800">
                            {t(
                              'order.otpNotConfiguredHelp',
                              'You can still order by sending your basket to the restaurant on WhatsApp.',
                            )}
                          </p>
                          <button
                            type="button"
                            onClick={handleUseWhatsAppInstead}
                            className="mt-2 text-xs font-bold text-amber-900 underline"
                          >
                            {t('order.whatsapp', 'Order on WhatsApp instead')}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-50 px-4 py-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                            {t('order.codeSentTo', 'Code sent to')}
                          </p>
                          <p className="text-sm font-semibold text-gray-900">+91 {phone}</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleChangeNumber}
                          className="text-xs font-semibold text-brand-700 hover:underline"
                        >
                          {t('order.change', 'Change')}
                        </button>
                      </div>

                      <label htmlFor="otp-code" className="label mt-4">
                        {t('order.otpLabel', '6-digit OTP')}
                      </label>
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
                        {otpBusy
                          ? t('order.verifying', 'Verifying…')
                          : t('order.verifyContinue', 'Verify and continue')}
                      </button>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={handleRequestOtp}
                          disabled={otpBusy || resendIn > 0}
                          className="text-xs font-semibold text-brand-700 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
                        >
                          {resendIn > 0
                            ? t('order.resendIn', 'Resend code in {seconds}s').replace(
                                '{seconds}',
                                resendIn,
                              )
                            : t('order.resend', 'Resend code')}
                        </button>
                        <button
                          type="button"
                          onClick={handleUseWhatsAppInstead}
                          className="text-xs font-semibold text-emerald-700 hover:underline"
                        >
                          {t('order.whatsapp', 'Order on WhatsApp instead')}
                        </button>
                      </div>

                      {devCode && (
                        <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-700">
                            {t('order.devMode', 'Development mode only')}
                          </p>
                          <p className="mt-1 text-sm text-sky-900">
                            {t('order.devCode', 'Your test code is')}{' '}
                            <strong className="text-base tracking-[0.2em]">{devCode}</strong>
                          </p>
                          <p className="mt-1 text-[11px] leading-relaxed text-sky-700">
                            {t(
                              'order.devHelp',
                              'This appears because no WhatsApp OTP template is configured locally. Production never shows the code on screen.',
                            )}
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
                          {t('order.continuingNoOtp', 'Continuing without OTP')}
                        </p>
                        <p className="text-xs text-amber-800">
                          {t(
                            'order.continuingNoOtpHelp',
                            '+91 {phone} · your order will open in WhatsApp and will not appear in the kitchen dashboard.',
                          ).replace('{phone}', phone)}
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
                            ? t('order.welcomeBack', 'Welcome back, {name}').replace(
                                '{name}',
                                profile.name.split(' ')[0] || 'friend',
                              )
                            : t('order.numberVerified', 'Number verified')}
                        </p>
                        <p className="text-xs text-emerald-800">
                          {t('order.verifiedOtp', '+91 {phone} · verified with OTP').replace(
                            '{phone}',
                            phone,
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <label htmlFor="customer-name" className="label">
                      {t('order.name', 'Your name')}
                    </label>
                    <input
                      id="customer-name"
                      value={profile.name}
                      onChange={(event) => updateProfile('name', event.target.value)}
                      placeholder={t('order.namePlaceholder', 'Full name')}
                      className="input-field"
                      autoComplete="name"
                    />
                  </div>

                  <fieldset className="mt-4">
                    <legend className="label">
                      {t('order.orderTypeQuestion', 'How would you like it?')}
                    </legend>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      {[
                        {
                          id: 'pickup',
                          title: t('order.pickup', 'Pickup'),
                          copy: t('order.pickupCopy', 'College Square'),
                        },
                        {
                          id: 'delivery',
                          title: t('order.delivery', 'Delivery'),
                          copy: t('order.deliveryCopy', 'Around Belonia'),
                        },
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
                      <label htmlFor="customer-address" className="label">
                        {t('order.deliveryAddress', 'Delivery address')}
                      </label>
                      <textarea
                        id="customer-address"
                        value={profile.address}
                        onChange={(event) => updateProfile('address', event.target.value)}
                        placeholder={t(
                          'order.addressPlaceholder',
                          'House / road, landmark, Belonia',
                        )}
                        rows={3}
                        className="input-field resize-y"
                        autoComplete="street-address"
                      />
                      <p className="mt-1 text-[11px] text-gray-500">
                        {t('order.deliveryNote', restaurantInfo.deliveryNote)}
                      </p>
                    </div>
                  )}

                  {profile.orderType === 'delivery' && (
                    <div className="mt-4">
                      <label htmlFor="delivery-zone" className="label">
                        {t('order.zone', 'Delivery area')}
                      </label>
                      <select
                        id="delivery-zone"
                        value={deliveryZoneId}
                        onChange={(event) => {
                          setDeliveryZoneId(event.target.value);
                          setError('');
                        }}
                        className="input-field mt-1"
                      >
                        {siteConfig.deliveryZones.map((zone) => (
                          <option key={zone.id} value={zone.id}>
                            {zone.name} · {zone.fee > 0 ? formatINR(zone.fee) : t('order.free', 'Free')}
                          </option>
                        ))}
                      </select>
                      {deliveryZone?.areas && (
                        <p className="mt-1 text-[11px] text-gray-500">{deliveryZone.areas}</p>
                      )}
                    </div>
                  )}

                  <div className="mt-4">
                    <label htmlFor="order-notes" className="label">
                      {t('order.notes', 'Notes for the kitchen (optional)')}
                    </label>
                    <textarea
                      id="order-notes"
                      value={profile.notes}
                      onChange={(event) => updateProfile('notes', event.target.value)}
                      placeholder={t(
                        'order.notesPlaceholder',
                        'Spice level, extra chutney, delivery instructions…',
                      )}
                      rows={2}
                      className="input-field resize-y"
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-surface-200 bg-surface-50 p-4">
                    <p className="text-sm font-bold text-gray-900">
                      {t('order.scheduleSection', 'When should we prepare it?')}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {[
                        { id: 'asap', label: t('order.asap', 'As soon as possible') },
                        { id: 'scheduled', label: t('order.schedule', 'Schedule for later') },
                      ].map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setScheduleMode(option.id);
                            setError('');
                          }}
                          className={`rounded-xl border-2 px-3 py-2.5 text-xs font-semibold ${
                            scheduleMode === option.id
                              ? 'border-brand-600 bg-white text-brand-800'
                              : 'border-surface-200 bg-white text-gray-600 hover:border-brand-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {scheduleMode === 'asap' ? (
                      <div className="mt-3">
                        <label htmlFor="prep-minutes" className="text-xs font-semibold text-gray-600">
                          {t('order.prep', 'Preparation time')}
                        </label>
                        <select
                          id="prep-minutes"
                          value={prepMinutes}
                          onChange={(event) => setPrepMinutes(Number(event.target.value))}
                          className="input-field mt-1 py-2.5 text-sm"
                        >
                          {siteConfig.prepTimes.map((minutes) => (
                            <option key={minutes} value={minutes}>
                              {t('order.aboutMinutes', 'About {minutes} minutes').replace(
                                '{minutes}',
                                minutes,
                              )}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div>
                          <label htmlFor="scheduled-date" className="text-xs font-semibold text-gray-600">
                            {t('order.date', 'Date')}
                          </label>
                          <input
                            id="scheduled-date"
                            type="date"
                            min={minScheduleDate}
                            max={maxScheduleDate}
                            value={scheduledDate}
                            onChange={(event) => setScheduledDate(event.target.value)}
                            className="input-field mt-1 py-2.5 text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="scheduled-time" className="text-xs font-semibold text-gray-600">
                            {t('order.timeIst', 'Time (IST)')}
                          </label>
                          <select
                            id="scheduled-time"
                            value={scheduledTime}
                            onChange={(event) => setScheduledTime(event.target.value)}
                            className="input-field mt-1 py-2.5 text-sm"
                          >
                            <option value="">{t('order.chooseTime', 'Choose a time')}</option>
                            {SCHEDULE_TIMES.map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                    <p className="mt-2 text-[11px] text-gray-500">
                      {t(
                        'order.kitchenHours',
                        'Kitchen hours: 8:00 AM – 10:00 PM. Scheduled orders must be at least 10 minutes ahead.',
                      )}
                    </p>
                  </div>

                  {loyalty?.enabled && (
                    <div className="mt-4 rounded-2xl border border-brand-200 bg-brand-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-brand-900">
                          {t('order.loyalty', 'Loyalty card')}
                        </p>
                        <span className="text-xs font-semibold text-brand-700">
                          {loyalty.stamps}/{loyalty.target}
                        </span>
                      </div>
                      <div className="mt-2 flex gap-1.5">
                        {Array.from({ length: loyalty.target }, (_, index) => (
                          <span
                            key={index}
                            className={`flex h-8 flex-1 items-center justify-center rounded-lg text-xs font-bold ${
                              index < loyalty.stamps
                                ? 'bg-brand-600 text-white'
                                : 'border border-brand-200 bg-white text-brand-300'
                            }`}
                          >
                            {index < loyalty.stamps ? '★' : '·'}
                          </span>
                        ))}
                      </div>
                      {loyalty.rewardAvailable ? (
                        <label className="mt-3 flex items-start gap-2 text-sm text-brand-900">
                          <input
                            type="checkbox"
                            checked={useReward}
                            onChange={(event) => setUseReward(event.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-brand-300 text-brand-600"
                          />
                          <span>
                            {t('order.useReward', 'Use my reward on this order')} ·{' '}
                            {formatINR(loyalty.reward)} {t('order.off', 'off')}
                          </span>
                        </label>
                      ) : (
                        <p className="mt-2 text-[11px] text-brand-800">
                          {t('order.loyaltyHelp', loyalty.description)
                            .replace('{target}', loyalty.target)
                            .replace('{reward}', formatINR(loyalty.reward))}
                        </p>
                      )}
                    </div>
                  )}

                  <fieldset className="mt-4">
                    <legend className="label">{t('order.payment', 'Payment')}</legend>
                    <div className="mt-1 grid gap-2">
                      <label
                        className={`flex cursor-pointer items-start gap-2 rounded-xl border-2 p-3 ${
                          paymentMethod === 'pay_later'
                            ? 'border-brand-600 bg-brand-50'
                            : 'border-surface-200 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment-method"
                          checked={paymentMethod === 'pay_later'}
                          onChange={() => setPaymentMethod('pay_later')}
                          className="mt-0.5"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-gray-900">
                            {t('order.payLater', 'Pay at pickup / delivery')}
                          </span>
                          <span className="block text-[11px] text-gray-500">
                            {t(
                              'order.payLaterCopy',
                              'Cash or UPI at the counter. No payment is collected on this website.',
                            )}
                          </span>
                        </span>
                      </label>
                      {upiReady && (
                        <label
                          className={`flex cursor-pointer items-start gap-2 rounded-xl border-2 p-3 ${
                            paymentMethod === 'upi'
                              ? 'border-sky-600 bg-sky-50'
                              : 'border-surface-200 bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="payment-method"
                            checked={paymentMethod === 'upi'}
                            onChange={() => setPaymentMethod('upi')}
                            className="mt-0.5"
                          />
                          <span>
                            <span className="block text-sm font-semibold text-gray-900">
                              {t('order.upi', 'Pay by UPI now')}
                            </span>
                            <span className="block text-[11px] text-gray-500">
                              {t(
                                'order.upiCopy',
                                'Scan the QR after placing the order · {name}',
                              ).replace('{name}', siteConfig.payment.upiName)}
                            </span>
                          </span>
                        </label>
                      )}
                    </div>
                  </fieldset>

                  {unavailableInCart.length > 0 && (
                    <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
                      {unavailableInCart.length === 1
                        ? t(
                            'order.soldOutOne',
                            '{item} sold out. Remove it before placing the order.',
                          ).replace('{item}', unavailableInCart[0].name)
                        : t(
                            'order.soldOutMany',
                            '{items} sold out. Remove them before placing the order.',
                          ).replace(
                            '{items}',
                            unavailableInCart.map((item) => item.name).join(', '),
                          )}
                    </p>
                  )}

                  {recentOrders.length > 0 && (
                    <div className="mt-4 rounded-xl bg-surface-50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        {t('order.recentOnNumber', 'Recent orders on this number')}
                      </p>
                      <ul className="mt-2 space-y-2 text-xs text-gray-600">
                        {recentOrders.slice(0, 3).map((order) => (
                          <li key={order.id} className="rounded-xl border border-surface-200 bg-white p-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-gray-900">{order.id}</span>
                              <span className="capitalize">
                                {order.status === 'cancelled'
                                  ? t('track.cancelledStatus', 'Cancelled')
                                  : t(
                                      `track.step.${order.status || 'new'}`,
                                      String(order.status || 'new').replace(/-/g, ' '),
                                    )}
                              </span>
                            </div>
                            <div className="mt-1.5 flex items-center justify-between gap-2">
                              <span className="font-medium text-gray-700">
                                {formatINR(order.total ?? order.subtotal ?? 0)}
                              </span>
                              <div className="flex items-center gap-2">
                                {!String(order.id).startsWith('WA-') && (
                                  <Link
                                    to={`/track/${order.id}`}
                                    className="font-semibold text-brand-700 hover:underline"
                                  >
                                    {t('order.track', 'Track')}
                                  </Link>
                                )}
                                <button
                                  type="button"
                                  onClick={() => reorderOrder(order)}
                                  className="rounded-lg bg-brand-600 px-2.5 py-1 font-semibold text-white hover:bg-brand-700"
                                >
                                  {t('order.reorder', 'Reorder')}
                                </button>
                              </div>
                            </div>
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
                  {t('order.step2', 'Step 2')}
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-gray-900">
                  {t('order.confirmHeading', 'Confirm your order')}
                </h2>
                <label className="mt-4 flex items-start gap-3 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>
                    {t(
                      'order.consent',
                      'I agree to be contacted on WhatsApp about this order and understand that the kitchen will confirm availability, timing and delivery charges.',
                    )}
                  </span>
                </label>

                {error && (
                  <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    cart.length === 0 ||
                    !serviceLoaded ||
                    unavailableInCart.length > 0
                  }
                  className="btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {!serviceLoaded
                    ? t('order.checkingService', 'Checking order service…')
                    : submitting
                      ? t('order.sendingOrder', 'Sending your order…')
                      : service?.database && !directWhatsApp
                        ? `${t('order.place', 'Place order')} · ${formatINR(orderTotal)}`
                        : `${t('order.whatsapp', 'Send order on WhatsApp')} · ${formatINR(orderTotal)}`}
                </button>
                <p className="mt-2 text-center text-[11px] text-gray-500">
                  {upiReady
                    ? t(
                        'order.payNowHelp',
                        'Pay now by UPI or choose cash / UPI at pickup or delivery.',
                      )
                    : t(
                        'order.payLaterHelp',
                        'Pay at pickup or on delivery. No online payment is collected.',
                      )}
                </p>
              </section>
            )}

            {fallback && (
              <section
                id="order-fallback"
                className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-soft sm:p-6"
              >
                <h2 className="font-display text-2xl font-semibold text-amber-950">
                  {t('order.finishWhatsApp', 'Finish your order on WhatsApp')}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-amber-900">
                  {t(
                    'order.finishWhatsAppHelp',
                    'Your basket and details are ready. Open WhatsApp and press send so our kitchen gets the order.',
                  )}
                </p>
                <a
                  href={fallback.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#1f9d55] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#178247]"
                >
                  {t('order.openWhatsAppOrder', 'Open WhatsApp with my order')}
                </a>
                <button
                  type="button"
                  onClick={handleFallbackConfirmed}
                  className="mt-2 w-full rounded-xl border border-amber-300 bg-white px-5 py-3 text-sm font-semibold text-amber-900 hover:bg-amber-100"
                >
                  {t('order.sentOrder', 'I’ve sent the order')}
                </button>
              </section>
            )}
          </form>

          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-soft sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-semibold text-gray-900">
                  {t('cart.title', 'Your basket')}
                </h2>
                <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-800">
                  {itemCount}{' '}
                  {itemCount === 1
                    ? t('order.itemsSingular', 'item')
                    : t('order.itemsPlural', 'items')}
                </span>
              </div>

              {cart.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-4xl">🛍️</p>
                  <p className="mt-3 font-semibold text-gray-900">
                    {t('order.basketEmptyTitle', 'Your basket is empty')}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {t(
                      'order.basketEmptyHelp',
                      'Add a biryani, roll or momo plate and come back here.',
                    )}
                  </p>
                  <Link to="/menu" className="btn-primary mt-5">
                    {t('order.browseMenu', 'Browse the menu')}
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
                                <p className="text-xs text-gray-500">
                                  {formatINR(parsePrice(item.price))} {t('order.each', 'each')}
                                </p>
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

                  <div className="mt-4 space-y-1.5 border-t border-dashed border-surface-300 pt-4 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>{t('common.subtotal', 'Subtotal')}</span>
                      <span>{formatINR(cartTotal)}</span>
                    </div>
                    {profile.orderType === 'delivery' && (
                      <div className="flex justify-between text-gray-600">
                        <span>
                          {t('common.deliveryFee', 'Delivery fee')}
                          {deliveryZone ? ` · ${deliveryZone.name}` : ''}
                        </span>
                        <span>
                          {deliveryFee > 0 ? formatINR(deliveryFee) : t('order.free', 'Free')}
                        </span>
                      </div>
                    )}
                    {rewardDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>{t('common.discount', 'Loyalty reward')}</span>
                        <span>−{formatINR(rewardDiscount)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-surface-200 pt-2 text-lg font-semibold text-gray-900">
                      <span>{t('common.total', 'Total')}</span>
                      <span>{formatINR(orderTotal)}</span>
                    </div>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
                    {t(
                      'order.pricesNote',
                      'Prices are in INR. Delivery fees are set by the kitchen for your chosen area.',
                    )}
                  </p>
                  {unavailableInCart.length > 0 && (
                    <p className="mt-2 rounded-lg bg-rose-50 px-2 py-1.5 text-[11px] font-semibold text-rose-700">
                      {t('order.removeSoldOut', 'Remove sold-out items to continue.')}
                    </p>
                  )}
                  <Link to="/menu" className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">
                    {t('order.addMore', '+ Add more items')}
                  </Link>
                </>
              )}
            </section>

            <section className="mt-4 rounded-2xl border border-surface-200 bg-white p-4 text-sm text-gray-600 shadow-soft">
              <p className="font-semibold text-gray-900">
                {t('order.needHelp', 'Need help with your order?')}
              </p>
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
                  {t('order.messageWhatsApp', 'Message us on WhatsApp')}
                </a>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
