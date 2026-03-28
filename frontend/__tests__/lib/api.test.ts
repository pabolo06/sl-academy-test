// Mock supabase to avoid network calls
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(),
  },
  isSupabaseConfigured: jest.fn(() => false),
}));

import { ApiError } from '@/lib/api';

describe('ApiError', () => {
  it('creates an error with status and message', () => {
    const error = new ApiError(404, 'Não encontrado');
    expect(error.status).toBe(404);
    expect(error.message).toBe('Não encontrado');
  });

  it('has name "ApiError"', () => {
    const error = new ApiError(500, 'Erro interno');
    expect(error.name).toBe('ApiError');
  });

  it('extends the native Error class', () => {
    const error = new ApiError(401, 'Não autenticado');
    expect(error).toBeInstanceOf(Error);
  });

  it('stores optional details', () => {
    const details = { field: 'email', msg: 'inválido' };
    const error = new ApiError(422, 'Erro de validação', details);
    expect(error.details).toEqual(details);
  });

  it('details is undefined when not provided', () => {
    const error = new ApiError(400, 'Requisição inválida');
    expect(error.details).toBeUndefined();
  });

  it('is catchable as a standard Error', () => {
    expect(() => {
      throw new ApiError(403, 'Proibido');
    }).toThrow('Proibido');
  });

  it('is catchable with instanceof check', () => {
    try {
      throw new ApiError(403, 'Proibido');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect(e).toBeInstanceOf(Error);
    }
  });

  it('preserves status across different HTTP codes', () => {
    const codes = [200, 201, 400, 401, 403, 404, 422, 429, 500];
    codes.forEach((code) => {
      const error = new ApiError(code, 'Mensagem');
      expect(error.status).toBe(code);
    });
  });
});
