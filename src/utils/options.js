// Choices a buyer makes on a product — e.g. [{ name: 'Size', values: ['S', 'M', 'L'] }].
// The admin sets them per product; the buyer picks one value for each before adding to cart.

// The product's options, ignoring any that are half filled in.
export const productOptions = (product) =>
  (Array.isArray(product?.options) ? product.options : [])
    .filter((o) => o && o.name && Array.isArray(o.values) && o.values.length > 0);

// True when every option has a valid choice.
export const selectionComplete = (product, selected) =>
  productOptions(product).every((o) => o.values.includes(selected?.[o.name]));

// Just the product's options, in the product's order: { Size: 'M', Colour: 'Black' }.
export const cleanSelection = (product, selected) => {
  const out = {};
  productOptions(product).forEach((o) => {
    if (o.values.includes(selected?.[o.name])) out[o.name] = selected[o.name];
  });
  return out;
};

// "Size: M · Colour: Black" — shown under the item name in the cart, orders and messages.
export const optionsLabel = (options) =>
  Object.entries(options || {}).map(([name, value]) => `${name}: ${value}`).join(' · ');

// One cart line per product + choice, so "T-shirt, M" and "T-shirt, L" are separate lines.
export const lineIdOf = (item) => {
  const label = Object.entries(item?.options || {}).map(([k, v]) => `${k}=${v}`).join(';');
  return item?.lineId || `${item?.product?.id}${label ? `|${label}` : ''}`;
};

// What the admin typed in a choice box → the separate choices buyers pick from.
// Commas, slashes, semicolons, new lines and a spaced dash ("Gold - Black", "Gold- Black") all split;
// a dash inside a word ("Off-white", "T-shirt") does not.
export const splitChoices = (text) =>
  [...new Set(String(text || '')
    .split(/[,/;\n|]|\s-\s*|\s*-\s/)
    .map((v) => v.trim().replace(/\s+/g, ' '))
    .filter(Boolean))];

// ---- Prices that depend on a choice (e.g. each Size has its own price) ----
// The admin can give ONE option's choices their own prices: { name: 'Size', values: [...], prices: { '50cm': 120, '70cm': 180 } }.
// Choices without a price use the product's normal price.
const round2 = (n) => Math.round(n * 100) / 100;
export const pricedOption = (product) =>
  productOptions(product).find((o) => o.prices && typeof o.prices === 'object' && Object.values(o.prices).some((p) => Number(p) > 0));

// Shop price (and crossed-out "was" price) for the buyer's choices. During a deal every choice
// gets the same % off, so the deal still means what the admin set.
export const priceFor = (product, selected) => {
  const now = Number(product?.price) || 0;
  const was = Number(product?.originalPrice) > now ? Number(product.originalPrice) : null;
  const option = pricedOption(product);
  const list = Number(product?.listPrice ?? product?.price) || 0;
  const own = option ? Number(option.prices[selected?.[option.name]]) : 0;
  if (!(own > 0) || !(list > 0) || own === list) return { price: now, was };
  const ratio = own / list;
  return { price: round2(now * ratio), was: was ? round2(was * ratio) : null };
};

// Cheapest and dearest choice, for "From GH₵…" on product cards.
export const priceRange = (product) => {
  const option = pricedOption(product);
  if (!option) return { min: Number(product?.price) || 0, max: Number(product?.price) || 0, varies: false };
  const all = option.values.map((v) => priceFor(product, { [option.name]: v }).price);
  const min = Math.min(...all);
  const max = Math.max(...all);
  return { min, max, varies: max > min };
};
