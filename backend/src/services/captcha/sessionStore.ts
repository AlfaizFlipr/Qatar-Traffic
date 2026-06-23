import { ViolationSearchInput } from '../../types';
import { logger } from '../../utils/logger';

export type SessionMode = 'simulated' | 'live';

export interface CaptchaSession {
  id: string;
  mode: SessionMode;
  identifier: string;
  input: ViolationSearchInput;
  expiresAt: number;
  expectedCode?: string; // simulated mode
  context?: any; // live mode (Playwright BrowserContext — closed on destroy)
  page?: any; // live mode (Playwright Page)
  formContext?: string; // live mode: which form section (vehicle, personal, establishment)
}

const SESSION_TTL_MS = Number(process.env.CAPTCHA_TTL_MS || 3 * 60 * 1000);

class SessionStore {
  private sessions = new Map<string, CaptchaSession>();

  constructor() {
    // Periodically evict expired sessions and close their browsers.
    setInterval(() => this.sweep(), 60 * 1000).unref?.();
  }

  create(session: Omit<CaptchaSession, 'expiresAt'>): CaptchaSession {
    const full: CaptchaSession = { ...session, expiresAt: Date.now() + SESSION_TTL_MS };
    this.sessions.set(full.id, full);
    return full;
  }

  get(id: string): CaptchaSession | undefined {
    const s = this.sessions.get(id);
    if (!s) return undefined;
    if (Date.now() > s.expiresAt) {
      this.destroy(id);
      return undefined;
    }
    return s;
  }

  async destroy(id: string): Promise<void> {
    const s = this.sessions.get(id);
    if (!s) return;
    this.sessions.delete(id);
    if (s.context) {
      try {
        await s.context.close();
      } catch (err) {
        logger.warn('Failed closing context for session ' + id, err);
      }
    }
  }

  private sweep(): void {
    const now = Date.now();
    for (const [id, s] of this.sessions) {
      if (now > s.expiresAt) void this.destroy(id);
    }
  }
}

export const sessionStore = new SessionStore();
export const ttlMs = SESSION_TTL_MS;
