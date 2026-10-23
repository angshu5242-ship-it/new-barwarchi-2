/**
 * OTP delivery can run in two ways:
 *  - WhatsApp Cloud API with an approved OTP template (production)
 *  - development mode, which shows/logs the code and never runs on Vercel
 */
export function otpDevModeEnabled() {
  if (process.env.OTP_DEV_MODE === 'true') return true;
  if (process.env.OTP_DEV_MODE === 'false') return false;
  return process.env.NODE_ENV !== 'production' && !process.env.VERCEL;
}

export function otpDeliveryConfigured() {
  return Boolean(
    process.env.WHATSAPP_TOKEN &&
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      process.env.WHATSAPP_OTP_TEMPLATE_NAME,
  );
}

export function otpConfigured() {
  return otpDevModeEnabled() || otpDeliveryConfigured();
}
