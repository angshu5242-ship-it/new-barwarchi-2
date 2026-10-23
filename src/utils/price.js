/** Extract the first number from display prices like "₹180/₹320". */
export function parsePrice(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const match = String(value ?? '').replace(/,/g, '').match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

export function formatINR(value) {
  const number = Number(value) || 0;
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(number)}`;
}

export function averagePrice(items = []) {
  const prices = items.map((item) => parsePrice(item.price)).filter((price) => price > 0);
  if (!prices.length) return 0;
  return Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
}

/**
 * Turn "₹180/₹320" into selectable portion options.
 * Most dishes use half/full; a few use piece counts.
 */
export function getPriceOptions(itemOrPrice) {
  const price = typeof itemOrPrice === 'string' ? itemOrPrice : itemOrPrice?.price;
  const description = typeof itemOrPrice === 'object' ? itemOrPrice?.description ?? '' : '';
  const values = String(price ?? '').match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];

  if (!values.length) return [{ label: 'Regular', value: 0, display: String(price ?? '') }];
  if (values.length === 1) {
    return [{ label: 'Regular', value: values[0], display: formatINR(values[0]) }];
  }

  let labels = ['Half', 'Full'];
  const customLabels = typeof itemOrPrice === 'object' ? itemOrPrice?.portionLabels : null;
  if (Array.isArray(customLabels) && customLabels.length >= 2) {
    labels = customLabels.map(String);
  } else if (/2\s*pcs/i.test(description)) {
    labels = ['2 pcs', '4 pcs'];
  } else if (/3\s*pcs/i.test(description)) {
    labels = ['3 pcs', '6 pcs'];
  } else if (/6\s*\/?\s*12/i.test(description)) {
    labels = ['6 pcs', '12 pcs'];
  } else if (/\bregular\b/i.test(description) && /\blarge\b/i.test(description)) {
    labels = ['Regular', 'Large'];
  }

  return values.slice(0, 2).map((value, index) => ({
    label: labels[index] || (index === 0 ? 'Regular' : 'Large'),
    value,
    display: formatINR(value),
  }));
}
