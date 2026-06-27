import { Tag, Truck, Receipt, CreditCard } from 'lucide-react';
import { CheckoutSession } from '../types';

interface CartSummaryProps {
  cart: CheckoutSession;
  onPayNow?: () => void;
}

export function CartSummary({ cart, onPayNow }: CartSummaryProps) {
  const isFlipkart = cart.merchant === 'Flipkart';

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Thin merchant accent bar */}
      <div className={`h-0.5 ${isFlipkart ? 'bg-blue-500' : 'bg-pink-500'}`} />

      <div className="p-3 space-y-2.5">
        {/* Product row */}
        <div className="flex items-center gap-2.5">
          <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden">
            <img
              src={cart.product.imageUrl}
              alt={cart.product.name}
              className="w-full h-full object-contain p-1"
              onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48?text=P'; }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{cart.product.name}</p>
            <p className="text-[10px] text-gray-400">{cart.product.brand} · Qty {cart.quantity}</p>
          </div>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            isFlipkart ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
          }`}>{cart.merchant}</span>
        </div>

        {/* Price breakdown */}
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span><span>₹{cart.subtotal.toLocaleString()}</span>
          </div>
          {cart.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span className="flex items-center gap-1"><Tag className="w-2.5 h-2.5" />{cart.couponCode || 'Discount'}</span>
              <span>−₹{cart.discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-500">
            <span className="flex items-center gap-1"><Truck className="w-2.5 h-2.5" />Delivery</span>
            <span>{cart.deliveryFee === 0 ? <span className="text-green-600">Free</span> : `₹${cart.deliveryFee}`}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span className="flex items-center gap-1"><Receipt className="w-2.5 h-2.5" />GST 18%</span>
            <span>₹{cart.taxes.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold text-xs text-gray-900 pt-1.5 border-t border-gray-100">
            <span>Total</span><span>₹{cart.total.toLocaleString()}</span>
          </div>
        </div>

        {onPayNow && (
          <button
            onClick={onPayNow}
            className="w-full flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-800 active:scale-95 text-white text-xs font-semibold py-2 rounded-lg transition-all"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Pay ₹{cart.total.toLocaleString()}
          </button>
        )}
      </div>
    </div>
  );
}
