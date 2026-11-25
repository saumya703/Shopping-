import {
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Product, ProductImage, ProductVideo } from '../../models/product.model';

interface GalleryImageItem {
  kind: 'image';
  src: string;
  alt: string;
  label: string;
}

interface GalleryVideoItem {
  kind: 'video';
  src: string;
  posterUrl: string;
  title: string;
  is360: boolean;
}

type GalleryItem = GalleryImageItem | GalleryVideoItem;
interface PointerPosition {
  x: number;
  y: number;
}

@Component({
  selector: 'app-product-gallery',
  templateUrl: './product-gallery.html',
  styleUrl: './product-gallery.scss',
})
export class ProductGalleryComponent {
  readonly product = input.required<Product>();
  protected readonly mediaItems = computed<GalleryItem[]>(() => {
    const product = this.product();
    const images = (product.galleryImages ?? []).filter((image) => image.src.trim());
    const galleryImages =
      images.length > 0
        ? images
        : [{ src: product.imageUrl, alt: product.name, view: 'Main view' }];
    const media: GalleryItem[] = galleryImages.map((image) => this.toGalleryImage(image));
    if (product.video && this.isMp4Url(product.video.src)) {
      media.push(this.toGalleryVideo(product.video, product.imageUrl));
    }
    return media;
  });
  protected readonly activeIndex = signal(0);
  protected readonly activeMedia = computed(
    () => this.mediaItems()[this.activeIndex()] ?? this.mediaItems()[0],
  );
  protected readonly imageIndices = computed(() =>
    this.mediaItems()
      .map((item, index) => (item.kind === 'image' ? index : -1))
      .filter((index) => index >= 0),
  );
  protected readonly imageError = signal(false);
  protected readonly videoError = signal(false);
  protected readonly lightboxOpen = signal(false);
  protected readonly zoomScale = signal(1);
  protected readonly panOffset = signal({ x: 0, y: 0 });
  protected readonly hoverZoom = signal(false);
  protected readonly hoverOrigin = signal('50% 50%');
  protected readonly videoMuted = signal(true);
  protected readonly mediaError = signal('');

  private readonly lightboxFrame = viewChild<ElementRef<HTMLElement>>('lightboxFrame');
  private readonly galleryVideo = viewChild<ElementRef<HTMLVideoElement>>('galleryVideo');
  private readonly activePointers = new Map<number, PointerPosition>();
  private readonly resetProductMedia = effect(() => {
    this.product();
    this.activeIndex.set(0);
    this.imageError.set(false);
    this.videoError.set(false);
    this.mediaError.set('');
    this.resetZoom();
  });
  private pinchStart: { distance: number; scale: number } | null = null;
  private dragStart: {
    pointerId: number;
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
  } | null = null;

  protected selectMedia(index: number): void {
    if (index < 0 || index >= this.mediaItems().length) {
      return;
    }
    this.activeIndex.set(index);
    this.imageError.set(false);
    this.videoError.set(false);
    this.mediaError.set('');
    this.resetZoom();
  }

  protected previousMedia(): void {
    this.selectMedia(
      (this.activeIndex() - 1 + this.mediaItems().length) % this.mediaItems().length,
    );
  }

  protected nextMedia(): void {
    this.selectMedia((this.activeIndex() + 1) % this.mediaItems().length);
  }

  protected openLightbox(): void {
    if (this.activeMedia()?.kind !== 'image') {
      return;
    }
    this.lightboxOpen.set(true);
    this.resetZoom();
  }

  protected closeLightbox(): void {
    this.lightboxOpen.set(false);
    this.resetZoom();
    this.activePointers.clear();
    this.pinchStart = null;
    this.dragStart = null;
  }

  protected moveLightboxImage(direction: -1 | 1): void {
    const indices = this.imageIndices();
    if (indices.length < 2) {
      return;
    }
    const currentPosition = indices.indexOf(this.activeIndex());
    const nextPosition = (currentPosition + direction + indices.length) % indices.length;
    this.selectMedia(indices[nextPosition]);
    this.resetZoom();
  }

  protected zoomIn(): void {
    this.zoomScale.update((scale) => Math.min(3, scale + 0.25));
  }

  protected zoomOut(): void {
    this.zoomScale.update((scale) => Math.max(1, scale - 0.25));
    if (this.zoomScale() === 1) {
      this.panOffset.set({ x: 0, y: 0 });
    } else {
      this.clampPan();
    }
  }

  protected resetZoom(): void {
    this.zoomScale.set(1);
    this.panOffset.set({ x: 0, y: 0 });
  }

  protected onMainImagePointerMove(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') {
      return;
    }
    const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) {
      return;
    }
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    this.hoverOrigin.set(`${Math.max(0, Math.min(100, x))}% ${Math.max(0, Math.min(100, y))}%`);
    this.hoverZoom.set(true);
  }

  protected onLightboxPointerDown(event: PointerEvent): void {
    event.preventDefault();
    const frame = event.currentTarget as HTMLElement;
    frame.setPointerCapture(event.pointerId);
    this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (this.activePointers.size === 2) {
      const [first, second] = [...this.activePointers.values()];
      this.pinchStart = { distance: this.distanceBetween(first, second), scale: this.zoomScale() };
      this.dragStart = null;
      return;
    }

    if (this.zoomScale() > 1) {
      const offset = this.panOffset();
      this.dragStart = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        offsetX: offset.x,
        offsetY: offset.y,
      };
    }
  }

  protected onLightboxPointerMove(event: PointerEvent): void {
    if (!this.activePointers.has(event.pointerId)) {
      return;
    }
    this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (this.activePointers.size >= 2 && this.pinchStart) {
      const [first, second] = [...this.activePointers.values()];
      const distance = this.distanceBetween(first, second);
      this.zoomScale.set(
        Math.max(1, Math.min(3, this.pinchStart.scale * (distance / this.pinchStart.distance))),
      );
      if (this.zoomScale() === 1) {
        this.panOffset.set({ x: 0, y: 0 });
      } else {
        this.clampPan();
      }
      return;
    }

    if (this.dragStart?.pointerId === event.pointerId) {
      this.panOffset.set({
        x: this.dragStart.offsetX + event.clientX - this.dragStart.x,
        y: this.dragStart.offsetY + event.clientY - this.dragStart.y,
      });
      this.clampPan();
    }
  }

  protected onLightboxPointerUp(event: PointerEvent): void {
    this.activePointers.delete(event.pointerId);
    this.pinchStart = null;
    this.dragStart = null;
    if (this.activePointers.size === 1 && this.zoomScale() > 1) {
      const [pointerId, point] = [...this.activePointers.entries()][0];
      const offset = this.panOffset();
      this.dragStart = {
        pointerId,
        x: point.x,
        y: point.y,
        offsetX: offset.x,
        offsetY: offset.y,
      };
    }
  }

  protected toggleVideoMute(): void {
    const video = this.galleryVideo()?.nativeElement;
    if (!video) {
      return;
    }
    this.videoMuted.update((muted) => !muted);
    video.muted = this.videoMuted();
  }

  protected async enterVideoFullscreen(): Promise<void> {
    const video = this.galleryVideo()?.nativeElement;
    if (!video) {
      return;
    }
    try {
      await video.requestFullscreen();
      this.mediaError.set('');
    } catch (error) {
      console.error('Unable to open the product video in fullscreen.', error);
      this.mediaError.set('Fullscreen is not available in this browser.');
    }
  }

  protected onImageError(): void {
    this.imageError.set(true);
  }

  protected onVideoError(): void {
    this.videoError.set(true);
  }

  protected onMainImagePointerLeave(): void {
    this.hoverZoom.set(false);
  }

  protected lightboxTransform(): string {
    const offset = this.panOffset();
    return `translate(${offset.x}px, ${offset.y}px) scale(${this.zoomScale()})`;
  }

  protected thumbnailLabel(item: GalleryItem, index: number): string {
    if (item.kind === 'video') {
      return `Play product video: ${item.title}`;
    }
    return item.label ? `${item.label}, image ${index + 1}` : `Product image ${index + 1}`;
  }

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.lightboxOpen()) {
      return;
    }
    if (event.key === 'Escape') {
      this.closeLightbox();
    } else if (event.key === 'ArrowLeft') {
      this.moveLightboxImage(-1);
    } else if (event.key === 'ArrowRight') {
      this.moveLightboxImage(1);
    }
  }

  private toGalleryImage(image: ProductImage): GalleryImageItem {
    return {
      kind: 'image',
      src: image.src,
      alt: image.alt || this.product().name,
      label: image.view ?? 'Product view',
    };
  }

  private toGalleryVideo(video: ProductVideo, defaultPoster: string): GalleryVideoItem {
    return {
      kind: 'video',
      src: video.src,
      posterUrl: video.posterUrl ?? defaultPoster,
      title: video.title,
      is360: video.is360 ?? false,
    };
  }

  private isMp4Url(value: string): boolean {
    try {
      const url = new URL(value);
      return (
        (url.protocol === 'https:' || url.protocol === 'http:') &&
        url.pathname.toLocaleLowerCase().endsWith('.mp4')
      );
    } catch {
      return false;
    }
  }

  private distanceBetween(first: PointerPosition, second: PointerPosition): number {
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  private clampPan(): void {
    const bounds = this.lightboxFrame()?.nativeElement.getBoundingClientRect();
    if (!bounds) {
      return;
    }
    const maxX = (bounds.width * (this.zoomScale() - 1)) / 2;
    const maxY = (bounds.height * (this.zoomScale() - 1)) / 2;
    const offset = this.panOffset();
    this.panOffset.set({
      x: Math.max(-maxX, Math.min(maxX, offset.x)),
      y: Math.max(-maxY, Math.min(maxY, offset.y)),
    });
  }
}
