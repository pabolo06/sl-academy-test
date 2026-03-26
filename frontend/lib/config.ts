/**
 * Configurações globais do cliente frontend.
 * Centralize aqui qualquer constante que dependa de variáveis de ambiente.
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? ''
    : 'http://localhost:8000');
