/**
 * SL Academy Platform - Image Upload Component
 * Drag-and-drop image upload with preview and validation
 */

'use client';

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadApi } from '@/lib/api';
import { validateImageFile, formatFileSize, createFilePreview } from '@/lib/fileUpload';

interface ImageUploadProps {
  onUploadComplete: (url: string, filename: string) => void;
  onError?: (error: string) => void;
  currentImageUrl?: string;
}

export function ImageUpload({ onUploadComplete, onError, currentImageUrl }: ImageUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
    onDrop: async (acceptedFiles, fileRejections) => {
      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          handleError('Imagem muito grande. Tamanho máximo: 5MB');
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          handleError('Formato inválido. Use JPEG, PNG ou WebP');
        } else {
          handleError('Erro ao processar imagem');
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        await handleFileSelect(acceptedFiles[0]);
      }
    },
  });

  const handleFileSelect = async (selectedFile: File) => {
    setError(null);
    
    // Validate file
    const validation = validateImageFile(selectedFile);
    if (!validation.valid) {
      handleError(validation.error || 'Arquivo inválido');
      return;
    }

    setFile(selectedFile);

    // Create preview
    try {
      const previewUrl = await createFilePreview(selectedFile);
      setPreview(previewUrl);
    } catch (err) {
      handleError('Erro ao criar prévia da imagem');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Simulate progress (since fetch doesn't support upload progress easily)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadApi.image(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      onUploadComplete(result.url, result.filename);
    } catch (err: any) {
      handleError(err.message || 'Erro ao fazer upload da imagem');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(currentImageUrl || null);
    setError(null);
    setUploadProgress(0);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    if (onError) {
      onError(errorMessage);
    }
  };

  return (
    <div className="space-y-4">
      {!preview ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-900/20'
              : 'border-gray-700 bg-gray-800 hover:border-gray-600'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-3">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-300">
              {isDragActive
                ? 'Solte a imagem aqui'
                : 'Arraste uma imagem aqui, ou clique para selecionar'}
            </p>
            <p className="text-sm text-gray-500">JPEG, PNG ou WebP (máx. 5MB)</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-96 object-contain rounded-lg border border-gray-700 bg-gray-900"
            />
            {!isUploading && (
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {file && (
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>{file.name}</span>
              <span>{formatFileSize(file.size)}</span>
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>Enviando...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {file && !isUploading && (
            <button
              onClick={handleUpload}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Fazer Upload
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}
