/**
 * GeminiKeyService: Manages Gemini AI API Key on the client side.
 *
 * - Stores the key in localStorage (BTI2026_GEMINI_API_KEY)
 * - Provides getKey() / saveKey() / clearKey()
 * - Syncs/validates with server endpoint GET/POST /api/config/gemini-key
 * - Injects x-gemini-api-key header into all /api/ai/* fetch calls
 */

const STORAGE_KEY = 'BTI2026_GEMINI_API_KEY';

type KeyStatus = 'unchecked' | 'valid' | 'invalid' | 'missing';

class GeminiKeyService {
  private key: string | null = null;
  private status: KeyStatus = 'unchecked';
  private listeners: Set<(status: KeyStatus) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.key = localStorage.getItem(STORAGE_KEY);
      if (this.key) {
        this.status = 'unchecked'; // Will be validated on first use
      } else {
        this.status = 'missing';
      }
    }
  }

  /** Return the locally stored key (may be null) */
  getKey(): string | null {
    return this.key;
  }

  /** Return current key status */
  getStatus(): KeyStatus {
    return this.status;
  }

  /** Whether there is any key configured (local or server-confirmed) */
  hasKey(): boolean {
    return !!this.key;
  }

  /** Save key to localStorage (does NOT push to server) */
  saveLocal(apiKey: string) {
    this.key = apiKey.trim();
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, this.key);
      } catch {}
    }
    this.status = 'unchecked';
    this.notifyListeners();
  }

  /** Clear key from localStorage */
  clearLocal() {
    this.key = null;
    this.status = 'missing';
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
    this.notifyListeners();
  }

  /** Build extra headers to inject into /api/* AI fetch calls */
  getAuthHeaders(): Record<string, string> {
    if (this.key) {
      return { 'x-gemini-api-key': this.key };
    }
    return {};
  }

  /**
   * Save key to BOTH localStorage AND the server .env file.
   * Returns { success, error }.
   */
  async saveToServer(apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/config/gemini-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        this.status = 'invalid';
        this.notifyListeners();
        return { success: false, error: data.error || 'Lỗi không xác định từ máy chủ.' };
      }
      // Successfully saved – also persist locally
      this.saveLocal(apiKey.trim());
      this.status = 'valid';
      this.notifyListeners();
      return { success: true };
    } catch (err: any) {
      this.status = 'invalid';
      this.notifyListeners();
      return { success: false, error: err?.message || 'Không thể kết nối đến máy chủ.' };
    }
  }

  /**
   * Check server for current key status (does server have a key?).
   * Also syncs status flag.
   */
  async checkServerStatus(): Promise<{ hasKey: boolean; maskedKey?: string }> {
    try {
      const res = await fetch('/api/config/gemini-key', {
        headers: this.getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.hasKey) {
        if (!this.key && data.maskedKey) {
          // Server has a key but we don't locally – mark valid for this session
          this.status = 'valid';
        } else if (this.key) {
          this.status = 'valid';
        }
        this.notifyListeners();
        return { hasKey: true, maskedKey: data.maskedKey };
      }
      if (!this.key) {
        this.status = 'missing';
        this.notifyListeners();
      }
      return { hasKey: false };
    } catch {
      return { hasKey: false };
    }
  }

  /**
   * Subscribe to status changes.
   * Returns an unsubscribe function.
   */
  subscribe(listener: (status: KeyStatus) => void): () => void {
    this.listeners.add(listener);
    // Immediately fire with current status
    setTimeout(() => listener(this.status), 0);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(l => {
      try { l(this.status); } catch {}
    });
  }
}

export const geminiKeyService = new GeminiKeyService();
export type { KeyStatus };
