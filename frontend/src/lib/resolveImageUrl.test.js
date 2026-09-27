import { describe, expect, it } from 'vitest';
import { resolveImageUrl } from './resolveImageUrl';

describe('resolveImageUrl', () => {
  it('sin url, devuelve un string vacío', () => {
    expect(resolveImageUrl('')).toBe('');
    expect(resolveImageUrl(null)).toBe('');
    expect(resolveImageUrl(undefined)).toBe('');
  });

  it('con una ruta de /uploads/, le antepone la URL del backend', () => {
    const resultado = resolveImageUrl('/uploads/products/gorra.png');

    expect(resultado.endsWith('/uploads/products/gorra.png')).toBe(true);
    expect(resultado).not.toBe('/uploads/products/gorra.png');
  });

  it('con una URL absoluta (ya no es /uploads/), la devuelve sin tocar', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/gorra.png';

    expect(resolveImageUrl(url)).toBe(url);
  });
});
