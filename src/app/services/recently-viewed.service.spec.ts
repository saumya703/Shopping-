import { TestBed } from '@angular/core/testing';
import { RecentlyViewedService } from './recently-viewed.service';

describe('RecentlyViewedService', () => {
  it('moves repeat views to the front and keeps only the latest four products', () => {
    const recentlyViewed = TestBed.inject(RecentlyViewedService);

    recentlyViewed.record('solstice-ring');
    recentlyViewed.record('heirloom-band');
    recentlyViewed.record('luna-pendant');
    recentlyViewed.record('celeste-chain');
    recentlyViewed.record('solstice-ring');
    recentlyViewed.record('pearl-drop');

    expect(recentlyViewed.products().map((product) => product.id)).toEqual([
      'pearl-drop',
      'solstice-ring',
      'celeste-chain',
      'luna-pendant',
    ]);
  });

  it('rejects unknown product IDs', () => {
    const recentlyViewed = TestBed.inject(RecentlyViewedService);

    expect(() => recentlyViewed.record('not-a-product')).toThrowError();
  });
});
