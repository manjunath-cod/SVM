import fs from 'node:fs';
import path from 'node:path';

let loaded = false;

export function loadEnv(rootDir = process.cwd()) {
  if (loaded) return;
  const envFiles = ['.env', '.env.local'];
  for (const file of envFiles) {
    const envPath = path.resolve(rootDir, file);
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      } catch (err) {
        console.warn(`[env] Could not load ${file}:`, err.message);
      }
    }
  }
  loaded = true;
}

export function getGeminiApiKey() {
  loadEnv();
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
}

