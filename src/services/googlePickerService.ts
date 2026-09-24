import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { PickedDriveFile } from '../types';

export interface GooglePickerOptions {
  viewId?: 'ALL' | 'SPREADSHEETS' | 'DOCS' | 'DOCS_IMAGES' | 'DOCS_VIDEOS' | 'PDFS' | 'FOLDERS';
  multiselect?: boolean;
  title?: string;
  mimeTypes?: string;
  includeFolders?: boolean;
}

let cachedAccessToken: string | null = null;
let apiLoadPromise: Promise<void> | null = null;

const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly'
];

/**
 * Ensures Google API client (`gapi`) and the Picker library are loaded in the browser.
 */
export async function loadPickerApi(): Promise<void> {
  if (typeof window === 'undefined') return;

  if (window.google?.picker) {
    return;
  }

  if (apiLoadPromise) {
    return apiLoadPromise;
  }

  apiLoadPromise = new Promise<void>((resolve, reject) => {
    const initPicker = () => {
      if (!window.gapi) {
        reject(new Error('Google API Client (gapi) could not be loaded.'));
        return;
      }
      window.gapi.load('picker', {
        callback: () => {
          resolve();
        },
        onerror: () => {
          reject(new Error('Failed to load Google Picker component.'));
        },
        timeout: 10000,
        ontimeout: () => {
          reject(new Error('Timed out waiting for Google Picker component.'));
        }
      });
    };

    if (window.gapi) {
      initPicker();
    } else {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => initPicker();
      script.onerror = () => reject(new Error('Failed to load https://apis.google.com/js/api.js'));
      document.head.appendChild(script);
    }
  });

  return apiLoadPromise;
}

export const googlePickerService = {
  /**
   * Get the current OAuth access token if available
   */
  getAccessToken(): string | null {
    if (cachedAccessToken) return cachedAccessToken;
    const stored = sessionStorage.getItem('bti_google_access_token');
    if (stored) {
      cachedAccessToken = stored;
      return stored;
    }
    return null;
  },

  /**
   * Set or override the access token
   */
  setAccessToken(token: string | null) {
    cachedAccessToken = token;
    if (token) {
      sessionStorage.setItem('bti_google_access_token', token);
    } else {
      sessionStorage.removeItem('bti_google_access_token');
    }
  },

  /**
   * Check if user is authenticated with Drive scopes
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },

  /**
   * Authenticate user with Google OAuth requesting Drive scopes
   */
  async authenticate(forceNew = false): Promise<string> {
    if (!forceNew) {
      const currentToken = this.getAccessToken();
      if (currentToken) return currentToken;
    }

    const provider = new GoogleAuthProvider();
    DRIVE_SCOPES.forEach(scope => provider.addScope(scope));
    provider.setCustomParameters({
      prompt: 'consent',
      access_type: 'offline'
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        this.setAccessToken(credential.accessToken);
        return credential.accessToken;
      }
      throw new Error('Không nhận được Access Token từ Google.');
    } catch (err: any) {
      console.error('Google Drive authentication error:', err);
      throw err;
    }
  },

  /**
   * Sign out Google session and clear token
   */
  async signOut(): Promise<void> {
    this.setAccessToken(null);
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Error during sign out:', e);
    }
  },

  /**
   * Get current Google user info
   */
  getCurrentUser() {
    return auth.currentUser;
  },

  /**
   * Open the Google Picker dialog
   */
  async openPicker(options: GooglePickerOptions = {}): Promise<PickedDriveFile[] | null> {
    // 1. Ensure picker script is loaded
    await loadPickerApi();

    // 2. Ensure we have an active access token
    let token = this.getAccessToken();
    if (!token) {
      token = await this.authenticate();
    }

    // 3. Resolve iframe ancestor origin or window origin as specified in guidelines
    const pickerOrigin =
      window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
        ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
        : window.location.origin;

    return new Promise<PickedDriveFile[] | null>((resolve, reject) => {
      try {
        const pickerModule = (window as any).google?.picker;
        if (!pickerModule) {
          reject(new Error('Google Picker library is not ready.'));
          return;
        }

        // Configure the appropriate view
        let view: any;
        switch (options.viewId) {
          case 'SPREADSHEETS':
            view = new pickerModule.DocsView(pickerModule.ViewId.SPREADSHEETS);
            view.setMode(pickerModule.DocsViewMode.LIST);
            break;
          case 'DOCS_IMAGES':
            view = new pickerModule.DocsView(pickerModule.ViewId.DOCS_IMAGES);
            break;
          case 'DOCS_VIDEOS':
            view = new pickerModule.DocsView(pickerModule.ViewId.DOCS_VIDEOS);
            break;
          case 'PDFS':
            view = new pickerModule.DocsView(pickerModule.ViewId.PDFS);
            break;
          case 'DOCS':
            view = new pickerModule.DocsView(pickerModule.ViewId.DOCS);
            break;
          case 'FOLDERS':
            view = new pickerModule.DocsView(pickerModule.ViewId.FOLDERS);
            view.setIncludeFolders(true);
            view.setSelectFolderEnabled(true);
            break;
          case 'ALL':
          default:
            view = new pickerModule.DocsView(pickerModule.ViewId.DOCS);
            break;
        }

        if (options.mimeTypes && view.setMimeTypes) {
          view.setMimeTypes(options.mimeTypes);
        }

        if (options.includeFolders !== undefined && view.setIncludeFolders) {
          view.setIncludeFolders(options.includeFolders);
        }

        const builder = new pickerModule.PickerBuilder()
          .addView(view)
          .setOAuthToken(token)
          .setOrigin(pickerOrigin)
          .setTitle(options.title || 'Chọn tệp từ Google Drive (Beyond The Internet 2026)');

        // Enable common features
        if (pickerModule.Feature?.SUPPORT_DRIVES) {
          builder.enableFeature(pickerModule.Feature.SUPPORT_DRIVES);
        }

        if (options.multiselect && pickerModule.Feature?.MULTISELECT_ENABLED) {
          builder.enableFeature(pickerModule.Feature.MULTISELECT_ENABLED);
        }

        builder.setCallback((data: any) => {
          if (data.action === pickerModule.Action.PICKED) {
            const rawDocs: any[] = data.docs || [];
            const files: PickedDriveFile[] = rawDocs.map((doc: any) => {
              const file: PickedDriveFile = {
                id: doc.id || doc[pickerModule.Document.ID],
                name: doc.name || doc[pickerModule.Document.NAME] || 'Untitled',
                mimeType: doc.mimeType || doc[pickerModule.Document.MIME_TYPE] || '',
                url: doc.url || doc[pickerModule.Document.URL] || `https://drive.google.com/file/d/${doc.id}/view`,
                embedUrl: doc.embedUrl || doc[pickerModule.Document.EMBED_URL],
                iconUrl: doc.iconUrl || doc[pickerModule.Document.ICON_URL],
                sizeBytes: doc.sizeBytes || doc[pickerModule.Document.SIZE_BYTES],
                lastEditedUtc: doc.lastEditedUtc || doc[pickerModule.Document.LAST_EDITED_UTC],
                description: doc.description
              };
              return file;
            });
            if (files.length > 0) {
              console.log('Selected file metadata:', files[0]);
              console.log('[Google Picker Service] All selected files metadata:', files);
            }
            resolve(files);
          } else if (data.action === pickerModule.Action.CANCEL) {
            resolve(null);
          }
        });

        const picker = builder.build();
        picker.setVisible(true);
      } catch (err) {
        console.error('Failed to construct Google Picker widget:', err);
        reject(err);
      }
    });
  },

  /**
   * Fetches metadata for a selected Google Drive file
   */
  async getFileMetadata(fileId: string): Promise<any> {
    const token = await this.authenticate();
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,description`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to fetch file metadata: ${err}`);
    }

    return await res.json();
  },

  /**
   * Downloads or exports the content of a file from Google Drive.
   * Handles Google Sheets by exporting as XLSX or CSV, and standard files via alt=media.
   */
  async downloadFileContent(fileId: string, mimeType?: string): Promise<{ blob: Blob; arrayBuffer: ArrayBuffer; text: string }> {
    const token = await this.authenticate();
    let url: string;

    if (mimeType === 'application/vnd.google-apps.spreadsheet') {
      // Export Google Sheet to Excel .xlsx format
      url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`;
    } else if (mimeType === 'application/vnd.google-apps.document') {
      // Export Google Doc to plain text
      url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
    } else {
      // Download standard file
      url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    }

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Tải tệp từ Google Drive thất bại: ${err}`);
    }

    const blob = await res.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const text = await blob.text();

    return { blob, arrayBuffer, text };
  },

  /**
   * Creates a direct image thumbnail or preview URL using the Google Drive access token or web view link
   */
  async getDirectImageUrl(fileId: string): Promise<string> {
    try {
      const meta = await this.getFileMetadata(fileId);
      if (meta.thumbnailLink) {
        // High-res thumbnail
        return meta.thumbnailLink.replace(/=s\d+/, '=s1600');
      }
      if (meta.webContentLink) {
        return meta.webContentLink;
      }
      // Fallback Google Drive direct embed format
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    } catch {
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
  }
};
