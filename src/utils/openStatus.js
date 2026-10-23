/**
 * The kitchen is open every day from 8 AM to 10 PM (Belonia local time).
 * This is intentionally simple: the site is for a single-location restaurant.
 */
export function getOpenStatus(now = new Date(), info = { opensAt: 8, closesAt: 22 }) {
  const hour = now.getHours() + now.getMinutes() / 60;
  const { opensAt = 8, closesAt = 22 } = info;
  const isOpen = hour >= opensAt && hour < closesAt;

  if (isOpen) {
    return {
      isOpen: true,
      label: 'Open now',
      detail: closesAt === 22 ? 'Closes at 10 PM' : 'Kitchen is taking orders',
    };
  }

  if (hour < opensAt) {
    return { isOpen: false, label: 'Closed now', detail: 'Opens at 8 AM' };
  }

  return { isOpen: false, label: 'Closed now', detail: 'Opens tomorrow at 8 AM' };
}
