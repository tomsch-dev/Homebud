"""
Receipt scanning endpoint — uses GPT-4o-mini vision to extract
grocery items (name, quantity, unit, price, discount) from a receipt photo.
"""

import base64
import json
import logging
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from app.config import settings
from app.middleware.auth import require_premium

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/receipt", tags=["receipt-scan"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE = 10 * 1024 * 1024  # 10 MB


class ReceiptItem(BaseModel):
    name: str
    quantity: float = 1
    unit: str = "pieces"
    price_per_unit: float = 0
    discount: float = 0
    category: Optional[str] = None


class ReceiptScanResult(BaseModel):
    store_name: Optional[str] = None
    trip_date: Optional[str] = None
    currency: str = "EUR"
    items: list[ReceiptItem]


class EatingOutScanResult(BaseModel):
    restaurant_name: Optional[str] = None
    expense_date: Optional[str] = None
    amount: float = 0
    currency: str = "EUR"
    meal_type: Optional[str] = None


SYSTEM_PROMPTS = {
    "en": """You are a receipt parser. Extract JSON from a grocery receipt image.

Format: {store_name, trip_date (YYYY-MM-DD), currency, items: [{name, quantity, unit, price_per_unit, discount, category}]}
category: dairy|meat|vegetables|fruits|grains|beverages|condiments|snacks|frozen|other

Step 1: Read EVERY line of the receipt top to bottom. Count all item lines.
Step 2: For each item, determine the correct price structure. There are only 3 types:

TYPE A — MULTI-PACK: Identifiable by "N x price" on receipt.
  Receipt: "4 x 1.00    4.00"
  → quantity=4, unit="pieces", price_per_unit=1.00

TYPE B — LOOSE WEIGHED ITEM: Identifiable by a SEPARATE line with "kg x EUR/kg" or "g x EUR/g".
  Receipt: Line 1 "Zucchini  1.28" + Line 2 "0.428 kg x 2.99 EUR/kg"
  → quantity=0.428, unit="kg", price_per_unit=2.99 (PER-KILO price, NOT the line total!)

TYPE C — NORMAL SINGLE ITEM: Everything else. Even if the name contains a weight!
  Receipt: "Protein Broccoli 400g  2.99" → quantity=1, unit="pieces", price_per_unit=2.99
  Receipt: "Mozzarella 125g  1.29" → quantity=1, unit="pieces", price_per_unit=1.29
  The weight in the name is just the package size, NOT a weighed item!
  An item is ONLY weighed if a separate "x EUR/kg" line exists.

DISCOUNTS: Discount lines (e.g. "-0.30", "discount") appear directly BELOW the affected item.
  → Set discount on the item ABOVE. price_per_unit stays unchanged.

DUPLICATES — CRITICAL: If a product name appears MULTIPLE times on the receipt, each occurrence is a SEPARATE purchase. Output EACH as a separate JSON entry, even if name and price are identical.

CATEGORIES — MANDATORY: You MUST assign a category to EVERY item. Pick the best match:
  dairy = milk, cheese, yogurt, butter, cream, eggs
  meat = chicken, beef, pork, sausage, ham, turkey, mince
  seafood = fish, shrimp, salmon, tuna
  vegetables = salad, tomato, cucumber, pepper, onion, carrot, broccoli, zucchini, potato
  fruits = apple, banana, orange, berries, grapes, lemon, mango
  grains = bread, pasta, rice, flour, cereal, oats, noodles
  beverages = water, juice, soda, beer, wine, coffee, tea
  condiments = sauce, ketchup, mustard, oil, vinegar, spice, salt, pepper, dressing
  snacks = chips, chocolate, candy, cookies, nuts, crackers
  frozen = frozen pizza, ice cream, frozen vegetables, frozen meals
  other = anything that does not clearly fit above
  Never leave category empty or null.

Clean up abbreviated names to be human-readable.
Ignore: subtotal, total, payment, tax, change, receipt footer.

Step 3: Verify your JSON item count matches the counted item lines. If not, you missed something.

Output ONLY valid JSON. Omit fields that are 0 or null (except category — always include it).""",

    "de": """Du bist ein Kassenbonparser. Extrahiere JSON aus einem Kassenbon-Bild.

Format: {store_name, trip_date (YYYY-MM-DD), currency, items: [{name, quantity, unit, price_per_unit, discount, category}]}
category: dairy|meat|vegetables|fruits|grains|beverages|condiments|snacks|frozen|other

EINHEITEN: Verwende deutsche Einheiten: "Stück" (nicht "pieces"), "kg", "g", "l", "ml".

Schritt 1: Lies JEDE Zeile des Bons von oben nach unten. Zähle alle Artikelzeilen.
Schritt 2: Für jeden Artikel bestimme die richtige Preisstruktur:

Es gibt nur 3 Typen:

TYP A — STÜCKWARE MIT MULTIPLIKATOR: Erkennbar an "N x Preis" auf dem Bon.
  Bon: "4 x 1,00    4,00"
  → quantity=4, unit="Stück", price_per_unit=1.00

TYP B — LOSE WIEGEWARE: Erkennbar daran, dass eine SEPARATE Zeile mit "kg x EUR/kg" oder "g x EUR/g" existiert.
  Bon: Zeile 1 "Zucchini    1,28" + Zeile 2 "0,428 kg x 2,99 EUR/kg"
  → quantity=0.428, unit="kg", price_per_unit=2.99 (KILOPREIS, nicht Zeilenbetrag!)

TYP C — NORMALER EINZELARTIKEL: Alles andere. Auch wenn im Namen eine Gewichtsangabe steht!
  Bon: "Protein Broccoli 400g    2,99" → quantity=1, unit="Stück", price_per_unit=2.99
  Bon: "Mozzarella 125g    1,29" → quantity=1, unit="Stück", price_per_unit=1.29
  Die Grammzahl im Namen ist nur die Packungsgröße, KEIN Wiegeartikel!
  Ein Artikel ist NUR Wiegeware wenn eine extra Zeile "x EUR/kg" vorhanden ist.

RABATTE: Rabattzeilen (z.B. "-0,30", "Rabatt") stehen direkt UNTER dem betroffenen Artikel.
  → Setze discount beim Artikel DARÜBER. price_per_unit bleibt unverändert.

DUPLIKATE — EXTREM WICHTIG: Wenn ein Produktname MEHRFACH auf dem Bon steht, ist jedes Vorkommen ein EIGENER Kauf. Gib JEDEN als separaten JSON-Eintrag aus, auch wenn Name und Preis identisch sind. Beispiel: "Creme z.Kochen" steht 2x auf dem Bon → 2 Einträge im JSON.

KATEGORIEN — PFLICHT: Du MUSST jedem Artikel eine Kategorie zuweisen. Wähle die passendste:
  dairy = Milch, Käse, Joghurt, Butter, Sahne, Eier, Quark
  meat = Hähnchen, Rind, Schwein, Wurst, Schinken, Hackfleisch
  seafood = Fisch, Garnelen, Lachs, Thunfisch
  vegetables = Salat, Tomate, Gurke, Paprika, Zwiebel, Karotte, Brokkoli, Zucchini, Kartoffel
  fruits = Apfel, Banane, Orange, Beeren, Trauben, Zitrone, Mango
  grains = Brot, Pasta, Reis, Mehl, Müsli, Haferflocken, Nudeln
  beverages = Wasser, Saft, Limo, Bier, Wein, Kaffee, Tee
  condiments = Soße, Ketchup, Senf, Öl, Essig, Gewürz, Salz, Pfeffer, Dressing
  snacks = Chips, Schokolade, Bonbons, Kekse, Nüsse, Cracker
  frozen = Tiefkühlpizza, Eis, Tiefkühlgemüse, Fertiggerichte
  other = alles was nicht eindeutig in eine Kategorie passt
  category darf NIEMALS leer oder null sein.

Bereinige abgekürzte Namen (z.B. "KPur.H.Brustfilet" → "Hähnchen Brustfilet").
Ignoriere: Summe, Gesamt, Zahlungsart, MwSt, Wechselgeld, Bontext.

Schritt 3: Prüfe ob die Anzahl deiner JSON-items mit der Anzahl gezählter Artikelzeilen übereinstimmt. Wenn nicht, hast du etwas vergessen.

Gib NUR gültiges JSON aus. Lasse Felder weg die 0 oder null sind (außer category — immer angeben).""",
}


@router.post("/scan", response_model=ReceiptScanResult)
async def scan_receipt(
    file: UploadFile = File(...),
    currency: str = Form("EUR"),
    lang: str = Form("en"),
    _user: str = Depends(require_premium),
):
    """Upload a receipt image and extract grocery items via GPT-4o-mini vision."""
    if not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="OpenAI API key not configured (set OPENAI_API_KEY)")

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {file.content_type}")

    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

    b64 = base64.b64encode(contents).decode("utf-8")
    mime_type = file.content_type or "image/jpeg"

    content = None
    try:
        import httpx

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-4o",
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPTS.get(lang, SYSTEM_PROMPTS["en"])},
                        {"role": "user", "content": [
                            {"type": "image_url", "image_url": {
                                "url": f"data:{mime_type};base64,{b64}",
                                "detail": "high",
                            }},
                            {"type": "text", "text": f"Parse this grocery receipt. Default currency: {currency}. Extract every single item — do not stop early."},
                        ]},
                    ],
                    "max_tokens": 4096,
                    "temperature": 0.1,
                },
            )
            resp.raise_for_status()
            data = resp.json()

        content = data["choices"][0]["message"]["content"]

        # Strip markdown code fences if present
        if content.startswith("```"):
            content = content.split("\n", 1)[1] if "\n" in content else content[3:]
            if content.endswith("```"):
                content = content[:-3]

        content = content.strip()
        try:
            parsed = json.loads(content)
        except json.JSONDecodeError:
            content = re.sub(r',\s*([}\]])', r'\1', content)
            parsed = json.loads(content)

        # Post-process items
        if "items" in parsed:
            merged = []
            for item in parsed["items"]:
                price = item.get("price_per_unit", 0)
                if price < 0 and merged:
                    # Negative price = discount line, attach to previous item
                    merged[-1]["discount"] = merged[-1].get("discount", 0) + abs(price)
                else:
                    merged.append(item)
            for item in merged:
                # Ensure all discounts are positive absolute values
                if "discount" in item and item["discount"] != 0:
                    item["discount"] = round(abs(item["discount"]), 2)
                # Round prices to 2 decimals, keep quantity at full precision
                if "price_per_unit" in item:
                    item["price_per_unit"] = round(item["price_per_unit"], 2)
            parsed["items"] = merged

        return ReceiptScanResult(**parsed)

    except httpx.HTTPStatusError as e:
        logger.error(f"OpenAI API error: {e.response.status_code} {e.response.text[:300]}")
        raise HTTPException(status_code=502, detail="Receipt scanning failed — OpenAI API error")
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        logger.error(f"Failed to parse response: {e}\nRaw: {content[:500] if content else 'N/A'}")
        raise HTTPException(status_code=502, detail="Receipt scanning failed — could not parse response")
    except Exception as e:
        logger.error(f"Receipt scanning failed: {e}")
        raise HTTPException(status_code=502, detail="Receipt scanning failed")


EATING_OUT_PROMPTS = {
    "en": """You are a restaurant bill parser. Extract JSON from a restaurant/cafe receipt image.

Format: {"restaurant_name": "...", "expense_date": "YYYY-MM-DD", "amount": 0.00, "currency": "EUR", "meal_type": "lunch"}

meal_type must be one of: breakfast, lunch, dinner, coffee, snack, other
- Determine based on time of day if shown, or items ordered (e.g. coffee+pastry = coffee, full meal = lunch/dinner)

amount should be the TOTAL paid (including tip if shown on receipt).
Clean up abbreviated restaurant names to be readable.

Output ONLY valid JSON.""",

    "de": """Du bist ein Restaurantbon-Parser. Extrahiere JSON aus einem Restaurant-/Café-Kassenbon.

Format: {"restaurant_name": "...", "expense_date": "YYYY-MM-DD", "amount": 0.00, "currency": "EUR", "meal_type": "lunch"}

meal_type muss eins von sein: breakfast, lunch, dinner, coffee, snack, other
- Bestimme anhand der Uhrzeit oder der bestellten Artikel (z.B. Kaffee+Gebäck = coffee, ganzes Essen = lunch/dinner)

amount soll der GESAMTBETRAG sein (inkl. Trinkgeld falls auf dem Bon).
Bereinige abgekürzte Restaurantnamen.

Gib NUR gültiges JSON aus.""",
}


@router.post("/scan-eating-out", response_model=EatingOutScanResult)
async def scan_eating_out_receipt(
    file: UploadFile = File(...),
    currency: str = Form("EUR"),
    lang: str = Form("en"),
    _user: str = Depends(require_premium),
):
    """Upload a restaurant receipt image and extract expense details via GPT-4o vision."""
    if not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="OpenAI API key not configured")

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {file.content_type}")

    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="Image too large (max 10MB)")

    b64 = base64.b64encode(contents).decode("utf-8")
    mime_type = file.content_type or "image/jpeg"

    content = None
    try:
        import httpx

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-4o",
                    "messages": [
                        {"role": "system", "content": EATING_OUT_PROMPTS.get(lang, EATING_OUT_PROMPTS["en"])},
                        {"role": "user", "content": [
                            {"type": "image_url", "image_url": {
                                "url": f"data:{mime_type};base64,{b64}",
                                "detail": "low",
                            }},
                            {"type": "text", "text": f"Parse this restaurant/cafe receipt. Default currency: {currency}."},
                        ]},
                    ],
                    "max_tokens": 512,
                    "temperature": 0.1,
                },
            )
            resp.raise_for_status()
            data = resp.json()

        content = data["choices"][0]["message"]["content"]

        if content.startswith("```"):
            content = content.split("\n", 1)[1] if "\n" in content else content[3:]
            if content.endswith("```"):
                content = content[:-3]

        content = content.strip()
        try:
            parsed = json.loads(content)
        except json.JSONDecodeError:
            content = re.sub(r',\s*([}\]])', r'\1', content)
            parsed = json.loads(content)

        return EatingOutScanResult(**parsed)

    except httpx.HTTPStatusError as e:
        logger.error(f"OpenAI API error: {e.response.status_code} {e.response.text[:300]}")
        raise HTTPException(status_code=502, detail="Receipt scanning failed — OpenAI API error")
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        logger.error(f"Failed to parse response: {e}\nRaw: {content[:500] if content else 'N/A'}")
        raise HTTPException(status_code=502, detail="Receipt scanning failed — could not parse response")
    except Exception as e:
        logger.error(f"Receipt scanning failed: {e}")
        raise HTTPException(status_code=502, detail="Receipt scanning failed")
