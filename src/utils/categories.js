// Turns a category name like "Food & Snacks" into its URL slug "food-snacks".
export const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Products from the database only carry the category *name*; older local data also has a slug.
export const productCategorySlug = (product) => product?.categorySlug || slugify(product?.category);
