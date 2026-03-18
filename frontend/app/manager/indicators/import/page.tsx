/**
 * SL Academy Platform - Indicator Import Page
 * Upload and import indicators from CSV/XLSX files
 */

'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { DashboardLayout } from '@/components/DashboardLayout';
import { indicatorApi } from '@/lib/api';
import { IndicatorImportRow, IndicatorImportResult } from '@/types';

export default function IndicatorImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<IndicatorImportRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<IndicatorImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleFileSelect(acceptedFiles[0]);
      }
    },
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('Arquivo muito grande. Tamanho máximo: 10MB');
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Formato inválido. Use CSV ou XLSX');
      } else {
        setError('Erro ao processar arquivo');
      }
    },
  });

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setResult(null);
    setPreview([]);

    try {
      if (selectedFile.name.endsWith('.csv')) {
        Papa.parse(selectedFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const rows = results.data.slice(0, 10) as IndicatorImportRow[];
            setPreview(rows);
          },
          error: (err) => {
            setError(`Erro ao ler arquivo: ${err.message}`);
          },
        });
      } else if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        const data = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as IndicatorImportRow[];
        setPreview(jsonData.slice(0, 10));
      }
    } catch (err: any) {
      setError(`Erro ao pré-visualizar arquivo: ${err.message}`);
    }
  }, []);

  const handleImport = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      let rows: IndicatorImportRow[] = [];

      if (file.name.endsWith('.csv')) {
        await new Promise<void>((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              rows = results.data as IndicatorImportRow[];
              resolve();
            },
            error: (err) => reject(err),
          });
        });
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(worksheet) as IndicatorImportRow[];
      }

      // Validate row count
      if (rows.length > 10000) {
        setError('Arquivo contém mais de 10.000 linhas. Limite máximo atingido.');
        setIsUploading(false);
        return;
      }

      // Validate required fields
      const validRows = rows.filter((row) => {
        return row.name && row.category && (row.value !== undefined) && row.reference_date;
      });

      if (validRows.length === 0) {
        setError('Nenhuma linha válida encontrada. Verifique o formato do arquivo e os nomes das colunas.');
        setIsUploading(false);
        return;
      }

      // Submit to API
      const importResult = await indicatorApi.import({ indicators: validRows });
      setResult(importResult);
    } catch (err: any) {
      setError(err.message || 'Erro ao importar indicadores');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview([]);
    setResult(null);
    setError(null);
  };

  return (
    <DashboardLayout requiredRole="manager">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Importar Indicadores</h1>
          <p className="text-gray-400 mt-1">
            Faça upload de um arquivo CSV ou XLSX com os indicadores do hospital
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-300 mb-2">Formato do Arquivo</h3>
          <p className="text-sm text-gray-300 mb-2">
            O arquivo deve conter as seguintes colunas:
          </p>
          <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
            <li><span className="font-medium">name</span> - Nome do indicador (obrigatório)</li>
            <li><span className="font-medium">category</span> - Categoria (obrigatório)</li>
            <li><span className="font-medium">value</span> - Valor numérico (obrigatório)</li>
            <li><span className="font-medium">reference_date</span> - Data de referência YYYY-MM-DD (obrigatório)</li>
            <li><span className="font-medium">unit</span> - Unidade de medida (opcional)</li>
            <li><span className="font-medium">notes</span> - Observações (opcional)</li>
          </ul>
          <p className="text-sm text-gray-400 mt-2">
            Limite: 10.000 linhas por arquivo, 10MB máximo
          </p>
        </div>

        {/* Upload Area */}
        {!file && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragActive
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-gray-300">
                {isDragActive
                  ? 'Solte o arquivo aqui'
                  : 'Arraste um arquivo CSV ou XLSX aqui, ou clique para selecionar'}
              </p>
              <p className="text-sm text-gray-500">CSV ou XLSX (máx. 10MB)</p>
            </div>
          </div>
        )}

        {/* File Preview */}
        {file && !result && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Arquivo Selecionado</h3>
                <p className="text-sm text-gray-400 mt-1">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
              >
                Remover
              </button>
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
                        <th className="px-3 py-2 text-left text-gray-300">Nome</th>
                        <th className="px-3 py-2 text-left text-gray-300">Categoria</th>
                        <th className="px-3 py-2 text-left text-gray-300">Valor</th>
                        <th className="px-3 py-2 text-left text-gray-300">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {preview.map((row, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-gray-300">{row.name}</td>
                          <td className="px-3 py-2 text-gray-300">{row.category}</td>
                          <td className="px-3 py-2 text-gray-300">{row.value}</td>
                          <td className="px-3 py-2 text-gray-300">{row.reference_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={isUploading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? 'Importando...' : 'Importar Indicadores'}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Import Result */}
        {result && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Resultado da Importação</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
                <p className="text-sm text-green-300">Sucesso</p>
                <p className="text-2xl font-bold text-white mt-1">{result.success_count}</p>
              </div>
              <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
                <p className="text-sm text-red-300">Erros</p>
                <p className="text-2xl font-bold text-white mt-1">{result.error_count}</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-300 mb-2">
                  Erros Encontrados ({result.errors.length})
                </h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {result.errors.map((err, index) => (
                    <div key={index} className="bg-red-900/20 border border-red-700/50 rounded p-3">
                      <p className="text-sm text-red-300">
                        Linha {err.row}: {err.error}
                      </p>
                      {err.data && (
                        <pre className="text-xs text-gray-400 mt-1 overflow-x-auto">
                          {JSON.stringify(err.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Importar Outro Arquivo
              </button>
              <button
                onClick={() => window.location.href = '/manager/indicators'}
                className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                Ver Indicadores
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
