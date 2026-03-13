from openai import AsyncOpenAI
from app.config import settings

_client: AsyncOpenAI | None = None


def get_openai_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


async def get_recipe_recommendations(fridge_contents: str) -> list[dict]:
    client = get_openai_client()

    prompt = f"""You are a helpful chef assistant. Based on the following ingredients in the user's kitchen, suggest 3 delicious recipes they can make. Prioritize ingredients that expire soon.

Kitchen contents:
{fridge_contents}

For each recipe provide:
- name, description, servings, prepTimeMin, cookTimeMin
- ingredients: list of {{name, quantity, unit}}
- steps: list of {{stepNumber, instruction}}

Respond ONLY with a JSON object: {{"recipes": [...]}}"""

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.7,
    )

    import json
    content = response.choices[0].message.content or "{}"
    parsed = json.loads(content)
    return parsed.get("recipes", [])
