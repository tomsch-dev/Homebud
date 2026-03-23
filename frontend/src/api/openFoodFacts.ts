export interface OpenFoodFactsProduct {
  name: string;
  quantity_str?: string;
  category?: string;
  calories_kcal?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  image_url?: string;
}

const CATEGORY_MAP: Record<string, string> = {
  'en:dairies': 'dairy', 'en:milks': 'dairy', 'en:cheeses': 'dairy', 'en:yogurts': 'dairy',
  'en:meats': 'meat', 'en:poultry': 'meat', 'en:beef': 'meat', 'en:pork': 'meat',
  'en:fishes': 'seafood', 'en:seafood': 'seafood',
  'en:vegetables': 'vegetables', 'en:canned-vegetables': 'vegetables',
  'en:fruits': 'fruits', 'en:dried-fruits': 'fruits',
  'en:cereals-and-potatoes': 'grains', 'en:breads': 'grains', 'en:pastas': 'grains', 'en:rices': 'grains',
  'en:beverages': 'beverages', 'en:waters': 'beverages', 'en:juices': 'beverages',
  'en:condiments': 'condiments', 'en:sauces': 'condiments', 'en:spices': 'condiments',
  'en:snacks': 'snacks', 'en:chips': 'snacks', 'en:chocolates': 'snacks', 'en:biscuits': 'snacks',
  'en:frozen-foods': 'frozen', 'en:ice-creams': 'frozen',
};

function mapCategory(tags: string[]): string | undefined {
  for (const tag of tags) {
    for (const [key, value] of Object.entries(CATEGORY_MAP)) {
      if (tag.includes(key.replace('en:', ''))) return value;
    }
  }
  return undefined;
}

export async function lookupBarcode(barcode: string): Promise<OpenFoodFactsProduct | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,quantity,categories_tags,nutriments,image_front_small_url`,
      { signal: controller.signal },
    );
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const n = p.nutriments || {};

    return {
      name: p.product_name || '',
      quantity_str: p.quantity || undefined,
      category: mapCategory(p.categories_tags || []),
      calories_kcal: n['energy-kcal_100g'] ?? undefined,
      protein_g: n.proteins_100g ?? undefined,
      carbs_g: n.carbohydrates_100g ?? undefined,
      fat_g: n.fat_100g ?? undefined,
      image_url: p.image_front_small_url ?? undefined,
    };
  } catch {
    clearTimeout(timeout);
    return null;
  }
}
