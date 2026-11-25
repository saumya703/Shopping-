import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface ShopCategory {
  name: string;
  imageUrl: string;
  imageAlt: string;
}

@Component({
  selector: 'app-shop-by-category',
  imports: [RouterLink],
  templateUrl: './shop-by-category.html',
  styleUrl: './shop-by-category.scss',
})
export class ShopByCategoryComponent {
  protected readonly categories: ShopCategory[] = [
    {
      name: 'Rings',
      imageUrl:
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=640&q=80',
      imageAlt: 'Gold ring with a luminous centre stone',
    },
    {
      name: 'Earrings',
      imageUrl:
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=640&q=80',
      imageAlt: 'Elegant gold and gemstone earrings',
    },
    {
      name: 'Necklaces',
      imageUrl:
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=640&q=80',
      imageAlt: 'Delicate necklace styled for an evening look',
    },
    {
      name: 'Pendants',
      imageUrl:
        'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=640&q=80',
      imageAlt: 'Fine pendant jewellery in warm gold',
    },
    {
      name: 'Bracelets',
      imageUrl:
        'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=640&q=80',
      imageAlt: 'Stacked gold bracelets with delicate details',
    },
    {
      name: 'Bangles',
      imageUrl:
        'https://images.unsplash.com/photo-1603561596112-0a132b757442?auto=format&fit=crop&w=640&q=80',
      imageAlt: 'Sculpted polished gold bangle',
    },
    {
      name: 'Mangalsutra',
      imageUrl:
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=640&q=80',
      imageAlt: 'Traditional-inspired gold necklace with a meaningful pendant',
    },
    {
      name: 'Wedding Jewellery',
      imageUrl:
        'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=640&q=80',
      imageAlt: 'Refined jewellery for a wedding celebration',
    },
    {
      name: 'Bridal Jewellery',
      imageUrl:
        'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=640&q=80',
      imageAlt: 'Statement jewellery arranged for a bridal look',
    },
    {
      name: "Men's Jewellery",
      imageUrl:
        'https://images.pexels.com/photos/8715815/pexels-photo-8715815.jpeg?auto=compress&cs=tinysrgb&w=640',
      imageAlt: 'A man wearing rings and a chain',
    },
    {
      name: 'Diamond Jewellery',
      imageUrl:
        'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?auto=format&fit=crop&w=640&q=80',
      imageAlt: 'Diamond ring catching the light',
    },
    {
      name: 'Gold Jewellery',
      imageUrl:
        'https://images.pexels.com/photos/8706563/pexels-photo-8706563.jpeg?auto=compress&cs=tinysrgb&w=640',
      imageAlt: 'Gold jewellery styled in a warm editorial setting',
    },
  ];
}
