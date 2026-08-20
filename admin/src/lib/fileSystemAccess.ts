/**
 * Progressive Enhancement File System Access API Helper
 * 
 * Provides native file & folder picking on supported browsers (Android Chrome, Chromium)
 * and falls back gracefully to standard <input type="file"> triggers on iOS Safari / Firefox.
 */

export interface PickFileOptions {
  multiple?: boolean;
  mimeTypes?: string[];
}

/**
 * Native or fallback file picker for images
 */
export async function pickImageFiles(options: PickFileOptions = {}): Promise<File[]> {
  const { multiple = false, mimeTypes = ['image/*'] } = options;

  // 1. Feature detection: File System Access API
  if (typeof window !== 'undefined' && 'showOpenFilePicker' in window) {
    try {
      const pickerOptions: any = {
        multiple,
        types: [
          {
            description: 'Images',
            accept: {
              'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
            }
          }
        ]
      };
      
      const fileHandles = await (window as any).showOpenFilePicker(pickerOptions);
      const files: File[] = [];
      for (const handle of fileHandles) {
        files.push(await handle.getFile());
      }
      return files;
    } catch (err: any) {
      // User aborted or error
      if (err.name === 'AbortError') {
        return [];
      }
      console.warn('FSA showOpenFilePicker failed, falling back to input:', err);
    }
  }

  // 2. Fallback: Standard <input type="file">
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = mimeTypes.join(',');
    input.multiple = multiple;
    
    input.onchange = () => {
      if (input.files) {
        resolve(Array.from(input.files));
      } else {
        resolve([]);
      }
    };
    
    input.onerror = () => {
      resolve([]);
    };

    // Trigger open
    input.click();
  });
}

/**
 * Directory picker for bulk folder uploads
 */
export async function pickDirectory(): Promise<File[]> {
  if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
    try {
      const directoryHandle = await (window as any).showDirectoryPicker();
      const files: File[] = [];
      
      async function scanDirectory(handle: any, path = '') {
        for await (const entry of handle.values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            // Store relative path in file object for identification
            Object.defineProperty(file, 'webkitRelativePath', {
              value: path ? `${path}/${entry.name}` : entry.name,
              writable: true
            });
            files.push(file);
          } else if (entry.kind === 'directory') {
            await scanDirectory(entry, path ? `${path}/${entry.name}` : entry.name);
          }
        }
      }
      
      await scanDirectory(directoryHandle);
      return files;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return [];
      }
      console.warn('FSA showDirectoryPicker failed, falling back to webkitdirectory input:', err);
    }
  }

  // Fallback: Standard folder upload input
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    // Set non-standard directory attributes
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('directory', '');
    
    input.onchange = () => {
      if (input.files) {
        resolve(Array.from(input.files));
      } else {
        resolve([]);
      }
    };
    
    input.click();
  });
}
