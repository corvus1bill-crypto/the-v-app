import { HttpError } from '../middleware/errorHandler.js';

export function paramString(v: string | string[] | undefined): string {
  const s = Array.isArray(v) ? v[0] : v;
  if (typeof s !== 'string' || !s) throw new HttpError(400, 'Invalid parameter');
  return s;
}
