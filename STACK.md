# Technology Stack

## Runtime

| Technology | Version | Purpose |
|---|---:|---|
| React | 19 | UI |
| Vite | 6 | Build and development server |
| Firebase Web SDK | 12 | Auth, Firestore, Storage |

## Configuration

| Variable | Required for cloud mode |
|---|---|
| `VITE_FIREBASE_API_KEY` | Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes |
| `VITE_FIREBASE_PROJECT_ID` | Yes |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes |
| `VITE_FIREBASE_APP_ID` | Yes |

`.env` is ignored by git. Use `.env.example` as the shareable template.

## Validation

- `npm run build` validates the production Vite bundle.
- Firebase rules and indexes are deployed separately with the Firebase CLI.
