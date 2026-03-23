export interface OpenFoodFactsProduct {
  name: string;
  brand?: string;
  quantity?: number;
  quantity_unit?: string;
  quantity_str?: string;
  category?: string;
  calories_kcal?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  image_url?: string;
}

// Maps OFF category tags to our app categories.
// Uses keyword matching against the tag hierarchy — more specific tags are checked first
// because OFF returns them ordered from general to specific.
const KEYWORD_TO_CATEGORY: [RegExp, string][] = [
  // Dairy
  [/dairy|dairies|milk|cheese|yogurt|butter|cream|fromage|lait/, 'dairy'],
  // Meat
  [/meat|poultry|chicken|beef|pork|lamb|sausage|ham|salami|turkey/, 'meat'],
  // Seafood
  [/fish|seafood|shrimp|salmon|tuna|crab|lobster|mussel/, 'seafood'],
  // Vegetables
  [/vegetable|salad|carrot|potato|tomato|onion|pepper|broccoli|spinach|legume|bean/, 'vegetables'],
  // Fruits
  [/fruit|apple|banana|orange|berry|grape|melon|mango|pineapple|lemon/, 'fruits'],
  // Grains / Bread / Pasta
  [/bread|pasta|rice|cereal|grain|flour|noodle|oat|wheat|bakery|baguette/, 'grains'],
  // Beverages
  [/beverage|water|juice|soda|coffee|tea|drink|beer|wine|alcohol|energy-drink/, 'beverages'],
  // Condiments / Sauces
  [/condiment|sauce|ketchup|mustard|mayonnaise|spice|vinegar|dressing|oil|seasoning/, 'condiments'],
  // Snacks / Sweets
  [/snack|sweet|chocolate|candy|biscuit|cookie|cake|chip|crisp|cracker|confection|gummi|bonbon/, 'snacks'],
  // Frozen
  [/frozen|ice-cream|gelato|sorbet/, 'frozen'],
];

function mapCategory(tags: string[]): string | undefined {
  // Join all tags into one string for efficient matching
  const joined = tags.join(' ').toLowerCase();
  for (const [pattern, category] of KEYWORD_TO_CATEGORY) {
    if (pattern.test(joined)) return category;
  }
  return undefined;
}

// Parse quantity string like "500 ml", "1.5 l", "300g" into number + unit
function parseQuantity(quantityStr?: string, productQty?: number, productUnit?: string): { quantity?: number; unit?: string } {
  // Prefer structured fields
  if (productQty && productUnit) {
    const unit = normalizeUnit(productUnit);
    return { quantity: productQty, unit };
  }
  // Fall back to parsing the string
  if (quantityStr) {
    const match = quantityStr.match(/^([\d.,]+)\s*(g|kg|ml|l|cl|oz|lb|pieces?|stk|stück)$/i);
    if (match) {
      const num = parseFloat(match[1].replace(',', '.'));
      const unit = normalizeUnit(match[2]);
      if (!isNaN(num)) return { quantity: num, unit };
    }
  }
  return {};
}

function normalizeUnit(raw: string): string {
  const u = raw.toLowerCase().trim();
  const map: Record<string, string> = {
    'g': 'g', 'kg': 'kg', 'ml': 'ml', 'l': 'l', 'cl': 'ml',
    'oz': 'oz', 'lb': 'lb',
    'piece': 'pieces', 'pieces': 'pieces', 'stk': 'pieces', 'stück': 'pieces',
  };
  return map[u] || 'pieces';
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export async function lookupBarcode(barcode: string): Promise<OpenFoodFactsProduct | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,brands,quantity,product_quantity,product_quantity_unit,categories_tags,nutriments,image_front_small_url`,
      { signal: controller.signal },
    );
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const n = p.nutriments || {};
    const { quantity, unit } = parseQuantity(p.quantity, p.product_quantity, p.product_quantity_unit);

    // Build a useful display name: "Brand - Product Name" or just product name
    const brand = p.brands?.split(',')[0]?.trim();
    const productName = p.product_name || '';
    const displayName = brand && productName && !productName.toLowerCase().includes(brand.toLowerCase())
      ? `${brand} ${productName}`
      : productName || brand || '';

    return {
      name: displayName,
      brand: brand || undefined,
      quantity,
      quantity_unit: unit,
      quantity_str: p.quantity || undefined,
      category: mapCategory(p.categories_tags || []),
      calories_kcal: n['energy-kcal_100g'] != null ? round1(n['energy-kcal_100g']) : undefined,
      protein_g: n.proteins_100g != null ? round1(n.proteins_100g) : undefined,
      carbs_g: n.carbohydrates_100g != null ? round1(n.carbohydrates_100g) : undefined,
      fat_g: n.fat_100g != null ? round1(n.fat_100g) : undefined,
      image_url: p.image_front_small_url ?? undefined,
    };
  } catch {
    clearTimeout(timeout);
    return null;
  }
}
