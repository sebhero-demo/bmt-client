# 🚀 BMT — Setup & Secrets

## GitHub OAuth (för Google Calendar)
1. Gå till: https://console.cloud.google.com/apis/credentials
2. Creates → OAuth client ID
3. **Authorized redirect URIs:**
   - `http://localhost:5174/oauth/callback`
   - `https://sebhero-demo.github.io/bmt-client/oauth/callback`
4. Kopiera `Client ID` och `Client secret`
5. Lägg i `.env`:
   ```
   VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   VITE_GOOGLE_CLIENT_SECRET=xxx
   ```

## Google Keep/Drive (framtida)
- Samma projekt, lägg till scopes:
  - `https://www.googleapis.com/auth/keep`
  - `https://www.googleapis.com/auth/drive.file`

## Release
```bash
# Bygg för prod
npm run build
# Deployas automatic via GitHub Actions
```

## Lokal kör
```bash
npm run dev  # webb
# eller
bun run .    # desktop (TBD)
```