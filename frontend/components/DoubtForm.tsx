/**
 * SL Academy Platform - Doubt Form Component
 * Form for submitting doubts with text and optional image
 */

'use client';

import { useState } from 'react';
import { doubtApi, uploadApi } from '@/lib/api';
import { DoubtCreate } from '@/types';

interface DoubtFormProps {
  lessonId: string;
  onSuccess?: () => void;
}

export function DoubtForm({ lessonId, onSuccess }: DoubtFormProps) {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textError, setTextError] = useState<string | null>(null);

  const validateText = (value: string): boolean => {
    if (value.length < 10) {
      setTextError('A dúvida deve ter pelo menos 10 caracteres');
      return false;
    }
    if (value.length > 5000) {
      setTextError('A dúvida não pode ter mais de 5000 caracteres');
      return false;
    }
    setTextError(null);
    return true;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);
    if (value.length > 0) {
      validateText(value);
    } else {
      setTextError(null);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem não pode ter mais de 5MB');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Formato de imagem inválido. Use JPEG, PNG ou WebP');
      return;
    }

    setImageFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateText(text)) {
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl: string | undefined;

      // Upload image if provided
      if (imageFile) {
        const uploadResult = await uploadApi.image(imageFile);
        imageUrl = uploadResult.url;
      }

      // Submit doubt
      const doubtData: DoubtCreate = {
        lesson_id: lessonId,
        text,
        image_url: imageUrl,
      };

      await doubtApi.create(doubtData);

      // Reset form
      setText('');
      setImageFile(null);
      setImagePreview(null);
      setTextError(null);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar dúvida');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="doubt-text" className="block text-sm font-medium text-gray-300 mb-2">
          Descreva sua dúvida
        </label>
        <textarea
          id="doubt-text"
          value={text}
          onChange={handleTextChange}
          rows={5}
          className={`w-full px-4 py-2 bg-gray-800 border ${
            textError ? 'border-red-500' : 'border-gray-700'
          } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder="Digite sua dúvida aqui (mínimo 10 caracteres)..."
          disabled={isSubmitting}
        />
        <div className="flex justify-between mt-1">
          {textError && <p className="text-sm text-red-500">{textError}</p>}
          <p className={`text-sm ml-auto ${text.length > 5000 ? 'text-red-500' : 'text-gray-500'}`}>
            {text.length} / 5000
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="doubt-image" className="block text-sm font-medium text-gray-300 mb-2">
          Imagem (opcional)
        </label>
        {!imagePreview ? (
          <div className="flex items-center">
            <input
              id="doubt-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
              disabled={isSubmitting}
            />
            <label
              htmlFor="doubt-image"
              className="px-4 py-2 bg-gray-700 text-white rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
            >
              Escolher imagem
            </label>
            <span className="ml-3 text-sm text-gray-500">
              JPEG, PNG ou WebP (máx. 5MB)
            </span>
          </div>
        ) : (
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-xs max-h-48 rounded-lg border border-gray-700"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              disabled={isSubmitting}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !text || !!textError}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Enviando...' : 'Enviar Dúvida'}
      </button>
    </form>
  );
}
