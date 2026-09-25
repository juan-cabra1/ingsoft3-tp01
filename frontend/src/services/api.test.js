import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';

function mockFetchResponse(ok, status, body) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
}

describe('api.adminLogin', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('con credenciales correctas, devuelve el access_token', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchResponse(true, 200, { access_token: 'un-token', token_type: 'bearer' })
    );

    const resultado = await api.adminLogin('admin', 'admin123');

    expect(resultado.access_token).toBe('un-token');
  });

  it('con credenciales incorrectas (401), rechaza con un mensaje claro', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(false, 401, { detail: 'unauthorized' }));

    await expect(api.adminLogin('admin', 'mala-password')).rejects.toThrow(
      'Credenciales incorrectas'
    );
  });

  it('le pide al backend la ruta y el body correctos', async () => {
    const fetchMock = mockFetchResponse(true, 200, { access_token: 'x' });
    vi.stubGlobal('fetch', fetchMock);

    await api.adminLogin('admin', 'admin123');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/admin/login');
    expect(JSON.parse(options.body)).toEqual({ username: 'admin', password: 'admin123' });
  });
});
