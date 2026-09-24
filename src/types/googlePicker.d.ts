// Global TypeScript definitions for Google Picker API and Google API Client
declare namespace google {
  namespace picker {
    enum Action {
      CANCEL = 'cancel',
      PICKED = 'picked',
      LOADED = 'loaded'
    }

    enum ViewId {
      ALL = 'all',
      DOCS = 'docs',
      DOCS_IMAGES = 'docs-images',
      DOCS_IMAGES_AND_VIDEOS = 'docs-images-and-videos',
      DOCS_VIDEOS = 'docs-videos',
      DOCUMENTS = 'documents',
      DRAWINGS = 'drawings',
      FOLDERS = 'folders',
      FORMS = 'forms',
      PDFS = 'pdfs',
      PRESENTATIONS = 'presentations',
      SPREADSHEETS = 'spreadsheets'
    }

    enum Feature {
      MINE_ONLY = 'mineOnly',
      MULTISELECT_ENABLED = 'multiselectEnabled',
      NAV_HIDDEN = 'navHidden',
      SIMPLE_UPLOAD_ENABLED = 'simpleUploadEnabled',
      SUPPORT_DRIVES = 'supportDrives'
    }

    enum Document {
      ICON_URL = 'iconUrl',
      ID = 'id',
      IS_FOLDER = 'isFolder',
      LAST_EDITED_UTC = 'lastEditedUtc',
      MIME_TYPE = 'mimeType',
      NAME = 'name',
      SERVICE_ID = 'serviceId',
      SIZE_BYTES = 'sizeBytes',
      THUMBNAILS = 'thumbnails',
      TYPE = 'type',
      URL = 'url',
      EMBED_URL = 'embedUrl'
    }

    class Picker {
      setVisible(visible: boolean): void;
      dispose(): void;
      isVisible(): boolean;
    }

    class PickerBuilder {
      constructor();
      addView(view: ViewId | DocsView | DocsUploadView): PickerBuilder;
      addViewGroup(viewGroup: any): PickerBuilder;
      enableFeature(feature: Feature): PickerBuilder;
      disableFeature(feature: Feature): PickerBuilder;
      setAppId(appId: string): PickerBuilder;
      setSelectableMimeTypes(types: string): PickerBuilder;
      setTitle(title: string): PickerBuilder;
      setOAuthToken(token: string): PickerBuilder;
      setDeveloperKey(key: string): PickerBuilder;
      setCallback(callback: (data: PickerResponse) => void): PickerBuilder;
      setOrigin(origin: string): PickerBuilder;
      setSize(width: number, height: number): PickerBuilder;
      build(): Picker;
    }

    class DocsView {
      constructor(viewId?: ViewId);
      setIncludeFolders(includeFolders: boolean): DocsView;
      setSelectFolderEnabled(enabled: boolean): DocsView;
      setMimeTypes(mimeTypes: string): DocsView;
      setMode(mode: string): DocsView;
      setParent(folderId: string): DocsView;
      setOwnedByMe(ownedByMe: boolean): DocsView;
      setStarred(starred: boolean): DocsView;
    }

    class DocsUploadView {
      constructor();
      setIncludeFolders(includeFolders: boolean): DocsUploadView;
      setParent(folderId: string): DocsUploadView;
    }

    interface PickerDocument {
      [key: string]: any;
      id: string;
      name: string;
      mimeType: string;
      url?: string;
      embedUrl?: string;
      iconUrl?: string;
      sizeBytes?: number;
      lastEditedUtc?: number;
      description?: string;
      thumbnails?: Array<{ url: string; width: number; height: number }>;
    }

    interface PickerResponse {
      action: Action;
      docs?: PickerDocument[];
      view?: any;
    }
  }
}

declare namespace gapi {
  function load(apiName: string, callbackOrConfig: (() => void) | { callback: () => void; onerror?: () => void; timeout?: number; ontimeout?: () => void }): void;
}

interface Window {
  gapi?: typeof gapi;
  google?: typeof google;
}
