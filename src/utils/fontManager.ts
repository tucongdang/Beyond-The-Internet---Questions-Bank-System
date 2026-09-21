/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BTI 2026 - Font Management Engine
 * Handles custom font uploads (.ttf, .otf, .woff, .woff2) via IndexedDB & FontFace API,
 * as well as curated Vietnamese Google Fonts presets.
 */

export interface PresetFont {
  id: string;
  name: string;
  fontFamily: string;
  googleFontFamily?: string;
  googleFontUrl?: string;
  category: 'sans' | 'serif' | 'mono';
  description: string;
}

export interface CustomFontRecord {
  id: string;
  fontName: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  buffer: ArrayBuffer;
  updatedAt: number;
}

export interface ActiveFontState {
  mode: 'preset' | 'custom';
  presetId?: string;
  fontName: string;
  fontFamily: string;
  customFileName?: string;
  customFileSize?: number;
}

export const PRESET_FONTS: PresetFont[] = [
  {
    id: 'svn_gilroy',
    name: 'SVN-Gilroy (Mặc định)',
    fontFamily: "'SVN-Gilroy', 'Gilroy', 'Lexend', sans-serif",
    category: 'sans',
    description: 'Gilroy Việt hóa chuẩn 100% tiếng Việt, ưu tiên nét Medium dày dặn rõ nét'
  },
  {
    id: 'lexend',
    name: 'Lexend',
    fontFamily: "'Lexend'",
    category: 'sans',
    description: 'Tối ưu hoá thị giác và tốc độ đọc'
  },
  {
    id: 'be_vietnam_pro',
    name: 'Be Vietnam Pro',
    fontFamily: "'Be Vietnam Pro'",
    googleFontFamily: 'Be+Vietnam+Pro:wght@300;400;500;600;700;800',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800&display=swap',
    category: 'sans',
    description: 'Thiết kế chuẩn quốc tế dành riêng cho hệ chữ tiếng Việt có dấu'
  },
  {
    id: 'inter',
    name: 'Inter',
    fontFamily: "'Inter'",
    googleFontFamily: 'Inter:wght@300;400;500;600;700;800',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
    category: 'sans',
    description: 'Bộ font UI hiện đại, chuẩn mực cho ứng dụng công nghệ cao'
  },
  {
    id: 'roboto',
    name: 'Roboto',
    fontFamily: "'Roboto'",
    googleFontFamily: 'Roboto:wght@300;400;500;700;900',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap',
    category: 'sans',
    description: 'Thân thiện, rõ ràng và phổ biến trên mọi nền tảng Android / Web'
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    fontFamily: "'Montserrat'",
    googleFontFamily: 'Montserrat:wght@300;400;500;600;700;800',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap',
    category: 'sans',
    description: 'Hình học mạnh mẽ, sang trọng và cá tính cho tiêu đề'
  },
  {
    id: 'nunito',
    name: 'Nunito',
    fontFamily: "'Nunito'",
    googleFontFamily: 'Nunito:wght@300;400;600;700;800',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap',
    category: 'sans',
    description: 'Nét chữ bo tròn mềm mại, tạo cảm giác thân mật và dễ chịu'
  },
  {
    id: 'playfair',
    name: 'Playfair Display',
    fontFamily: "'Playfair Display'",
    googleFontFamily: 'Playfair+Display:ital,wght@0,400;0,600;0,700;1,400',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap',
    category: 'serif',
    description: 'Kiểu chữ có chân cổ điển, trang trọng cho văn bản học thuật và đề thi'
  },
  {
    id: 'fira_code',
    name: 'Fira Code',
    fontFamily: "'Fira Code'",
    googleFontFamily: 'Fira+Code:wght@400;500;600;700',
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&display=swap',
    category: 'mono',
    description: 'Phông đơn cách chuyên dụng cho công nghệ số, lập trình và mã đề'
  }
];

const DB_NAME = 'bti_fonts_db';
const DB_VERSION = 1;
const STORE_NAME = 'custom_fonts';
const ACTIVE_FONT_KEY = 'active_custom_font';

// Open IndexedDB instance safely
function openFontsDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Store custom font record in IndexedDB
async function saveCustomFontToDB(record: CustomFontRecord): Promise<void> {
  const db = await openFontsDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Retrieve custom font record from IndexedDB
async function getCustomFontFromDB(id: string = ACTIVE_FONT_KEY): Promise<CustomFontRecord | null> {
  try {
    const db = await openFontsDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

// Delete custom font from IndexedDB
async function removeCustomFontFromDB(id: string = ACTIVE_FONT_KEY): Promise<void> {
  try {
    const db = await openFontsDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}
}

// Ensure Google Font link is dynamically appended
function ensureGoogleFontLoaded(font: PresetFont): void {
  if (!font.googleFontUrl || typeof document === 'undefined') return;

  const existingLink = document.getElementById(`google-font-${font.id}`);
  if (existingLink) return;

  const link = document.createElement('link');
  link.id = `google-font-${font.id}`;
  link.rel = 'stylesheet';
  link.href = font.googleFontUrl;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

// Apply CSS variable to root element
function applyFontCSSVariable(fontFamilyValue: string): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--app-font-family', fontFamilyValue);
  root.style.setProperty('--font-sans', `${fontFamilyValue}, ui-sans-serif, system-ui, sans-serif`);
  window.dispatchEvent(new Event('fontchange'));
}

/**
 * Get current active font metadata
 */
export function getActiveFont(): ActiveFontState {
  if (typeof localStorage === 'undefined') {
    return {
      mode: 'preset',
      presetId: 'svn_gilroy',
      fontName: 'SVN-Gilroy',
      fontFamily: "'SVN-Gilroy', 'Gilroy', 'Lexend', sans-serif"
    };
  }

  const mode = (localStorage.getItem('bti_font_mode') as 'preset' | 'custom') || 'preset';

  if (mode === 'custom') {
    const fontName = localStorage.getItem('bti_custom_font_name') || 'CustomFont';
    const customFileName = localStorage.getItem('bti_custom_font_filename') || 'font.ttf';
    const customFileSize = Number(localStorage.getItem('bti_custom_font_size') || 0);

    return {
      mode: 'custom',
      fontName,
      fontFamily: `'${fontName}', 'SVN-Gilroy', 'Lexend', sans-serif`,
      customFileName,
      customFileSize
    };
  }

  let presetId = localStorage.getItem('bti_font_preset_id') || 'svn_gilroy';
  if (presetId === 'gilroy') presetId = 'svn_gilroy';
  const preset = PRESET_FONTS.find(f => f.id === presetId) || PRESET_FONTS[0];

  return {
    mode: 'preset',
    presetId: preset.id,
    fontName: preset.name,
    fontFamily: preset.fontFamily
  };
}

/**
 * Apply a preset font across the entire application
 */
export async function applyPresetFont(presetId: string): Promise<void> {
  const preset = PRESET_FONTS.find(f => f.id === presetId) || PRESET_FONTS[0];

  if (preset.googleFontUrl) {
    ensureGoogleFontLoaded(preset);
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('bti_font_mode', 'preset');
    localStorage.setItem('bti_font_preset_id', preset.id);
  }

  applyFontCSSVariable(preset.fontFamily);
}

/**
 * Upload and register a custom font file (.ttf, .otf, .woff, .woff2)
 */
export async function uploadAndApplyCustomFont(file: File, customName?: string): Promise<ActiveFontState> {
  if (typeof window === 'undefined' || !('FontFace' in window)) {
    throw new Error('Trình duyệt không hỗ trợ nạp font động qua FontFace API.');
  }

  // Derive clean font name from file name
  const rawBaseName = file.name.replace(/\.[^/.]+$/, '').trim();
  const fontName = (customName?.trim() || rawBaseName || 'UserCustomFont').replace(/[^a-zA-Z0-9_\-\s]/g, '');

  // Read binary ArrayBuffer
  const buffer = await file.arrayBuffer();

  // Load into FontFace API
  const fontFace = new FontFace(fontName, buffer);
  await fontFace.load();

  // Add to document fonts
  document.fonts.add(fontFace);

  // Persist to IndexedDB
  const record: CustomFontRecord = {
    id: ACTIVE_FONT_KEY,
    fontName,
    fileName: file.name,
    fileType: file.type || 'font/ttf',
    fileSize: file.size,
    buffer,
    updatedAt: Date.now()
  };

  await saveCustomFontToDB(record);

  // Update localStorage pointers
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('bti_font_mode', 'custom');
    localStorage.setItem('bti_custom_font_name', fontName);
    localStorage.setItem('bti_custom_font_filename', file.name);
    localStorage.setItem('bti_custom_font_size', String(file.size));
  }

  const fontFamilyValue = `'${fontName}', 'Lexend', sans-serif`;
  applyFontCSSVariable(fontFamilyValue);

  return {
    mode: 'custom',
    fontName,
    fontFamily: fontFamilyValue,
    customFileName: file.name,
    customFileSize: file.size
  };
}

/**
 * Reset application font back to default SVN-Gilroy
 */
export async function resetToDefaultFont(): Promise<void> {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('bti_font_mode', 'preset');
    localStorage.setItem('bti_font_preset_id', 'svn_gilroy');
    localStorage.removeItem('bti_custom_font_name');
    localStorage.removeItem('bti_custom_font_filename');
    localStorage.removeItem('bti_custom_font_size');
  }

  await removeCustomFontFromDB();
  applyFontCSSVariable("'SVN-Gilroy', 'Gilroy', 'Lexend', sans-serif");
}

/**
 * Initialize font on application startup
 */
export async function initFont(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const active = getActiveFont();

    if (active.mode === 'custom') {
      const record = await getCustomFontFromDB();
      if (record && record.buffer) {
        const fontFace = new FontFace(record.fontName, record.buffer);
        await fontFace.load();
        document.fonts.add(fontFace);
        applyFontCSSVariable(`'${record.fontName}', 'SVN-Gilroy', 'Lexend', sans-serif`);
        return;
      }
    }

    // Fallback or preset mode
    const preset = PRESET_FONTS.find(f => f.id === active.presetId) || PRESET_FONTS[0];
    if (preset.googleFontUrl) {
      ensureGoogleFontLoaded(preset);
    }
    applyFontCSSVariable(preset.fontFamily);
  } catch (err) {
    console.warn('Could not initialize custom font, falling back to SVN-Gilroy', err);
    applyFontCSSVariable("'SVN-Gilroy', 'Gilroy', 'Lexend', sans-serif");
  }
}
