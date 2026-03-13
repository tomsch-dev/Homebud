from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import food_items, nutrition, recipes, ai, grocery, eating_out, spending, users

app = FastAPI(title="Kitchen Helper API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api")
app.include_router(food_items.router, prefix="/api")
app.include_router(nutrition.router, prefix="/api")
app.include_router(recipes.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(grocery.router, prefix="/api")
app.include_router(eating_out.router, prefix="/api")
app.include_router(spending.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
