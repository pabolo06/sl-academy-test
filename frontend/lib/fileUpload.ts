/**
 * SL Academy Platform - File Upload Utilities
 * Client-side file validation and upload helpers
 */

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeMB: number): FileValidationResult {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate file type
 */
export function validateFileType(file: File, allowedTypes: string[]): FileValidationResult {
  if (!allowedTypes.includes(file.type)) {
    const typeNames = allowedTypes.map(type => {
      const parts = type.split('/');
      return parts[parts.length - 1].toUpperCase();
    }).join(', ');
    
    return {
      valid: false,
      error: `Tipo de arquivo inválido. Tipos permitidos: ${typeNames}`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): FileValidationResult {
  // Check size (5MB max)
  const sizeValidation = validateFileSize(file, 5);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }
  
  // Check type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const typeValidation = validateFileType(file, allowedTypes);
  if (!typeValidation.valid) {
    return typeValidation;
  }
  
  return { valid: true };
}

/**
 * Validate spreadsheet file
 */
export function validateSpreadsheetFile(file: File): FileValidationResult {
  // Check size (10MB max)
  const sizeValidation = validateFileSize(file, 10);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }
  
  // Check type
  const allowedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  const typeValidation = validateFileType(file, allowedTypes);
  if (!typeValidation.valid) {
    return typeValidation;
  }
  
  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Create file preview URL
 */
export function createFilePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Upload progress tracker
 */
export class UploadProgressTracker {
  private onProgress: (progress: number) => void;
  
  constructor(onProgress: (progress: number) => void) {
    this.onProgress = onProgress;
  }
  
  update(loaded: number, total: number) {
    const progress = Math.round((loaded / total) * 100);
    this.onProgress(progress);
  }
}
