import { X, Star, ShoppingCart, Tag, Truck, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Product } from '../types';

interface ProductDetailModalProps {
  product: Product;
  allProducts: Product[];
  onBuy: (product: Product) => void;
  onClose: () => void;
  onNavigate: (product: Product) => void;
}

export function ProductDetailModal({ product, allProducts, onBuy, onClose, onNavigate }: ProductDetailModalProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const isFlipkart = product.merchant === 'Flipkart';
  const savings = product.originalPrice - product.price;
  const currentIndex = allProducts.findIndex(p => p.id === product.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allProducts.length - 1;

  const sizes = ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'];

  // Fill stars
  const fullStars = Math.floor(product.rating);
  const hasHalf = product.rating % 1 >= 0.5;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'slideUp 0.25s ease-out' }}
      >
        {/* Image area */}
        <div className="relative bg-gray-50 flex-shrink-0">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-52 object-contain p-4"
            onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Shoe'; }}
          />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm transition-all active:scale-95"
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>

          {/* Discount badge */}
          <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {product.discount}% OFF
          </span>

          {/* Merchant badge */}
          <span className={`absolute bottom-3 left-3 text-xs font-bold px-2 py-0.5 rounded-full text-white ${
            isFlipkart ? 'bg-blue-600' : 'bg-pink-500'
          }`}>
            {product.merchant}
          </span>

          {/* Prev / Next navigation */}
          {hasPrev && (
            <button
              onClick={() => onNavigate(allProducts[currentIndex - 1])}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
          )}
          {hasNext && (
            <button
              onClick={() => onNavigate(allProducts[currentIndex + 1])}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-all"
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>
          )}

          {/* Dot indicators */}
          {allProducts.length > 1 && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1">
              {allProducts.map((_, i) => (
                <button
                  key={i}
                  onClick={() => onNavigate(allProducts[i])}
                  className={`rounded-full transition-all ${
                    i === currentIndex
                      ? 'w-4 h-1.5 bg-gray-700'
                      : 'w-1.5 h-1.5 bg-gray-400 hover:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Details — scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-4 pb-6 space-y-4">

            {/* Name + brand */}
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-widest font-medium">{product.brand}</p>
              <h2 className="text-lg font-bold text-gray-900 mt-0.5 leading-tight">{product.name}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{product.color} · {product.category}</p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= fullStars ? 'text-amber-400 fill-amber-400'
                      : (s === fullStars + 1 && hasHalf) ? 'text-amber-400 fill-amber-200'
                      : 'text-gray-300 fill-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-gray-700">{product.rating}</span>
              <span className="text-xs text-gray-400">({product.reviewCount.toLocaleString()} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
              <span className="text-sm text-gray-400 line-through">₹{product.originalPrice.toLocaleString()}</span>
              <span className="text-sm text-green-600 font-semibold">Save ₹{savings.toLocaleString()}</span>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-600 leading-relaxed">{product.description}</p>

            {/* Size selector */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Select Size</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      selectedSize === size
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Perks */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Truck, label: 'Free Delivery', sub: 'Above ₹499' },
                { icon: Shield, label: 'Authentic', sub: '100% Original' },
                { icon: Tag, label: 'Best Price', sub: `${product.discount}% Off` },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center gap-1 bg-gray-50 rounded-xl p-2.5 text-center">
                  <Icon className="w-4 h-4 text-gray-600" />
                  <p className="text-[10px] font-semibold text-gray-800 leading-tight">{label}</p>
                  <p className="text-[9px] text-gray-400 leading-tight">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA — sticky */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 bg-white">
          <button
            onClick={() => { onBuy(product); onClose(); }}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 active:scale-95 text-white font-semibold py-3 rounded-xl transition-all text-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            Buy Now · ₹{product.price.toLocaleString()}
          </button>
        </div>
      </div>
    </div>
  );
}
