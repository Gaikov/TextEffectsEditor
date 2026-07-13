import type {
  GalleryActionResult,
  GalleryItem,
  GalleryProvider,
} from '../GalleryProvider';
import { UNSUPPORTED_GALLERY_ACTION } from '../GalleryProvider';

async function readJson<T>(response: Response): Promise<T> {
  const value = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      ok: false,
      message:
        typeof value.error === 'string' ? value.error : 'Request failed',
      requiresAuth: response.status === 401,
    } as T;
  }
  return value as T;
}

export class GlobalGalleryProvider implements GalleryProvider {
  id = 'global' as const;
  label = 'Global Gallery';
  addRequiresAuth = true;
  applyRequiresAuth = true;

  async list({ query }: { query: string }) {
    const params = new URLSearchParams();
    if (query.trim()) params.set('query', query.trim());
    const response = await fetch(`/api/gallery?${params.toString()}`);
    const value = await readJson<{ items?: GalleryItem[] } | GalleryActionResult>(
      response,
    );
    return 'items' in value && Array.isArray(value.items) ? value.items : [];
  }

  async add(input: Parameters<GalleryProvider['add']>[0]) {
    return readJson<GalleryActionResult>(
      await fetch('/api/gallery', {
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      }),
    );
  }

  async delete(id: string) {
    return readJson<GalleryActionResult>(
      await fetch(`/api/gallery/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    );
  }

  async approve(id: string) {
    return readJson<GalleryActionResult>(
      await fetch(`/api/admin/gallery/${encodeURIComponent(id)}/approve`, {
        method: 'POST',
      }),
    );
  }

  async reject(id: string) {
    return readJson<GalleryActionResult>(
      await fetch(`/api/admin/gallery/${encodeURIComponent(id)}/reject`, {
        method: 'POST',
      }),
    );
  }
}
