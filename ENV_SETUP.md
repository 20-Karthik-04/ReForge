# Environment Variables Setup

## Backend Configuration

The backend requires the following environment variables to be configured. Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

### Required Variables

- **LLM_API_KEY**: Your API key for the Large Language Model service (OpenAI, Anthropic, etc.)
  - Obtain from your LLM provider's dashboard
  - Keep this secret and never commit to version control
  
- **LLM_API_URL**: The endpoint URL for your LLM service
  - Default: `https://api.openai.com/v1/chat/completions`
  
- **LLM_MODEL**: The model to use for redesign planning
  - Default: `gpt-4`
  - Options: `gpt-4`, `gpt-3.5-turbo`, `claude-3-opus-20240229`, etc.

### Optional Variables

- **PORT**: Backend server port (default: 3001)
- **FRONTEND_URL**: Frontend application URL for CORS (default: http://localhost:5173)
- **CRAWLER_TIMEOUT**: HTTP request timeout in milliseconds (default: 30000)
- **CRAWLER_USER_AGENT**: User agent string for web crawling (default: ReForge/1.0)

## Frontend Configuration

The frontend will automatically connect to the backend at `http://localhost:3001` during development.

For production builds, set the `VITE_API_URL` environment variable in `frontend/.env.production`:

```env
VITE_API_URL=https://your-backend-api.com
```

## Security Notes

- Never commit your `.env` file to version control
- Rotate API keys regularly
- Use different API keys for development and production
- Monitor your LLM API usage to avoid unexpected costs
