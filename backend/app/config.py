from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://kitchen_user:kitchen_pass@localhost:5432/kitchen_helper"
    secret_key: str = "change_me_in_production"

    logto_endpoint: str = ""
    logto_app_id: str = ""
    logto_api_resource: str = ""
    logto_m2m_app_id: str = ""
    logto_m2m_app_secret: str = ""
    logto_management_api_resource: str = ""

    openai_api_key: str = ""

    frontend_url: str = "http://localhost:3000"
    default_currency: str = "EUR"


settings = Settings()
