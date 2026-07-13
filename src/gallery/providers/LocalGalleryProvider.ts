import {
  createEffectsGalleryItem,
  loadEffectsGallery,
  saveEffectsGallery,
} from '../effectsGallery';
import type {
  GalleryActionResult,
  GalleryItem,
  GalleryProvider,
} from '../GalleryProvider';
import { UNSUPPORTED_GALLERY_ACTION } from '../GalleryProvider';

function displayName(item: GalleryItem) {
  return item.name.trim() || 'Untitled';
}

export class LocalGalleryProvider implements GalleryProvider {
  id = 'local' as const;
  label = 'Local Gallery';
  addRequiresAuth = false;
  applyRequiresAuth = false;

  async list({ query }: { query: string }) {
    const normalizedQuery = query.trim().toLowerCase();
    return loadEffectsGallery()
      .map((item) => ({
        ...item,
        canDelete: true,
        status: 'local' as const,
      }))
      .filter(
        (item) =>
          normalizedQuery === '' ||
          displayName(item).toLowerCase().includes(normalizedQuery),
      );
  }

  async add(
    input: Parameters<GalleryProvider['add']>[0],
  ): Promise<GalleryActionResult> {
    const items = loadEffectsGallery();
    saveEffectsGallery([
      createEffectsGalleryItem(input.effects, input.name),
      ...items,
    ]);
    return { ok: true } satisfies GalleryActionResult;
  }

  async delete(id: string): Promise<GalleryActionResult> {
    const items = loadEffectsGallery();
    const nextItems = items.filter((item) => item.id !== id);
    if (nextItems.length === items.length) {
      return { ok: false, message: 'Gallery item not found' };
    }
    saveEffectsGallery(nextItems);
    return { ok: true };
  }

  async approve() {
    return UNSUPPORTED_GALLERY_ACTION;
  }

  async reject() {
    return UNSUPPORTED_GALLERY_ACTION;
  }
}
