import type { SerializedFontEffect } from '../effects';

export type GalleryProviderId = 'local' | 'global';
export type GalleryItemStatus = 'local' | 'pending' | 'approved' | 'rejected';

export interface GalleryItem {
  id: string;
  name: string;
  createdAt: string;
  effects: SerializedFontEffect[];
  authorName?: string;
  canDelete?: boolean;
  status?: GalleryItemStatus;
}

export interface GalleryActionResult {
  ok: boolean;
  message?: string;
  requiresAuth?: boolean;
  unsupported?: boolean;
}

export interface GalleryProvider {
  id: GalleryProviderId;
  label: string;
  addRequiresAuth: boolean;
  applyRequiresAuth: boolean;
  approve(id: string): Promise<GalleryActionResult>;
  delete(id: string): Promise<GalleryActionResult>;
  list(params: { query: string }): Promise<GalleryItem[]>;
  add(input: {
    name: string;
    effects: SerializedFontEffect[];
  }): Promise<GalleryActionResult>;
  reject(id: string): Promise<GalleryActionResult>;
}

export const UNSUPPORTED_GALLERY_ACTION: GalleryActionResult = {
  ok: false,
  unsupported: true,
};
