import { Star, ShoppingCart } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  index: number;
  onBuy: (product: Product) => void;
  onOpen: (product: Product) => void;
}

export function ProductCard({ product, onBuy, onOpen }: ProductCardProps) {
  const savings = product.originalPrice - product.price;
  const isFlipkart = product.merchant === 'Flipkart';

  return (
    <div
      onClick={() => onOpen(product)}
      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col cursor-pointer group"
    >
      {/* Image */}
      <div className="relative bg-gray-50 h-28 flex items-center justify-center overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x120?text=Shoe'; }}
        />
        <span className="absolute top-1.5 left-1.5 bg-green-500 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full font-bold">
          {product.discount}% off
        </span>
        <span className={`absolute top-1.5 right-1.5 text-[10px] leading-none px-1.5 py-0.5 rounded-full font-semibold ${
          isFlipkart ? 'bg-blue-600 text-white' : 'bg-pink-500 text-white'
        }`}>
          {isFlipkart ? 'FK' : 'MN'}
        </span>
      </div>

      {/* Info */}
      <div className="px-2.5 pt-2 pb-1.5 flex-1 flex flex-col gap-1">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide leading-none">{product.brand}</p>
        <p className="text-xs font-semibold text-gray-900 leading-snug line-clamp-1 mt-0.5">{product.name}</p>
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
            <span className="text-[10px] text-gray-500">{product.rating}</span>
          </div>
          <span className="text-sm font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
        </div>
        <p className="text-[10px] text-green-600 font-medium">Save ₹{savings.toLocaleString()}</p>
      </div>

      {/* CTA — stops propagation so it buys directly without opening modal */}
      <div className="px-2.5 pb-2.5">
        <button
          onClick={e => { e.stopPropagation(); onBuy(product); }}
          className="w-full flex items-center justify-center gap-1 bg-gray-900 hover:bg-gray-800 active:scale-95 text-white text-[11px] font-semibold py-1.5 rounded-lg transition-all"
        >
          <ShoppingCart className="w-3 h-3" />
          Buy Now
        </button>
      </div>
    </div>
  );
}
