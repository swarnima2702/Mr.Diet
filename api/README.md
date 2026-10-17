# Backend setup

1. Copy `config/config.example.php` to `config/config.php`.
2. Configure the database and external-service credentials. Never commit `config.php`.
3. Import `schema.sql` into a fresh `mrdietweb` database.
4. Apply each SQL file under `migrations/`.
5. From the repository root, start PHP with `php -S 127.0.0.1:8000`.

The frontend development server proxies `/api` requests to this PHP process.

## AI providers

The diet generator reads these keys from the `settings` table:

- `ai_provider`: `openai` or `gemini`
- `openai_api_key` and `openai_model`
- `gemini_api_key` and `gemini_model`

Run `migrations/add_ai_provider_settings.sql` before enabling Gemini in the admin panel.
