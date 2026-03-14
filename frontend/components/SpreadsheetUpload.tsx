/**
 * SL Academy Platform - Spreadsheet Upload Component
 * Drag-and-drop spreadsheet upload with preview and validation
 */

'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { validateSpreadsheetFile, formatFileSize } from '@/lib/fileUpload';

interface SpreadsheetUploadProps {
  onDataParsed: (data: any[]) => void;
  onError?: (error: string) => void;
  maxRows?: number;
}

export function SpreadsheetUpload({ 
  onDataParsed, 
  onError, 
  maxRows = 10000 
}: SpreadsheetUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState(0);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    onDrop: async (acceptedFiles, fileRejections) => {
      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          handleError('Arquivo muito grande. Tamanho máximo: 10MB');
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          handleError('Formato inválido. Use CSV ou XLSX');
        } else {
          handleError('Erro ao processar arquivo');
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
    const validation = validateSpreadsheetFile(selectedFile);
    if (!validation.valid) {
      handleError(validation.error || 'Arquivo inválido');
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);

    // Parse CSV
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        
        // Check row count
        if (data.length > maxRows) {
          handleError(`Arquivo contém ${data.length} linhas. Limite máximo: ${maxRows}`);
          setIsParsing(false);
          return;
        }

        setRowCount(data.length);
        setPreview(data.slice(0, 10)); // Show first 10 rows
        setIsParsing(false);
      },
      error: (err) => {
        handleError(`Erro ao ler arquivo: ${err.message}`);
        setIsParsing(false);
      },
    });
  };

  const handleConfirm = () => {
    if (!file) return;

    setIsParsing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        onDataParsed(results.data as any[]);
        setIsParsing(false);
      },
      error: (err) => {
        handleError(`Erro ao processar arquivo: ${err.message}`);
        setIsParsing(false);
      },
    });
  };

  const handleRemove = () => {
    setFile(null);
    setPreview([]);
    setError(null);
    setRowCount(0);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    if (onError) {
      onError(errorMessage);
    }
  };

  return (
    <div className="space-y-4">
      {!file ? (
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-300">
              {isDragActive
                ? 'Solte o arquivo aqui'
                : 'Arraste um arquivo CSV ou XLSX aqui, ou clique para selecionar'}
            </p>
            <p className="text-sm text-gray-500">CSV ou XLSX (máx. 10MB, {maxRows.toLocaleString()} linhas)</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {formatFileSize(file.size)} • {rowCount.toLocaleString()} linhas
                </p>
              </div>
              {!isParsing && (
                <button
                  onClick={handleRemove}
                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {preview.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">
                  Prévia (primeiras 10 linhas)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-900">
                      <tr>
                        {Object.keys(preview[0]).map((key) => (
                          <th key={key} className="px-3 py-2 text-left text-gray-300">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {preview.map((row, index) => (
                        <tr key={index}>
                          {Object.values(row).map((value: any, i) => (
                            <td key={i} className="px-3 py-2 text-gray-300">
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {isParsing ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-400">Processando...</span>
            </div>
          ) : (
            <button
              onClick={handleConfirm}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Confirmar e Processar
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
