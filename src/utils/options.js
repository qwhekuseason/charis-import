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
