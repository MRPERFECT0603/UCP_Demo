import { CheckCircle, Clock, CreditCard, Package } from 'lucide-react';
import { OrderConfirmation } from '../types';

interface OrderConfirmationCardProps {
  order: OrderConfirmation;
}

export function OrderConfirmationCard({ order }: OrderConfirmationCardProps) {
  const isFlipkart = order.merchant === 'Flipkart';
  const methodLabel = order.paymentMethod === 'upi' ? 'UPI / GPay'
    : order.paymentMethod === 'cod' ? 'Cash on Delivery'
    : order.paymentMethod === 'card' ? 'Card' : 'Online';

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="h-0.5 bg-green-500" />

      <div className="p-3 space-y-2.5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900">Order Confirmed</p>
            <p className="text-[10px] text-gray-400 font-mono">{order.orderId}</p>
          </div>
          <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            isFlipkart ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
          }`}>{order.merchant}</span>
        </div>

        {/* Product */}
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0 overflow-hidden">
              <img
                src={item.product.imageUrl}
                alt={item.product.name}
                className="w-full h-full object-contain p-1"
                onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=P'; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{item.product.name}</p>
              <p className="text-[10px] text-gray-400">Qty {item.quantity}</p>
            </div>
            <p className="text-xs font-bold text-gray-900 flex-shrink-0">₹{order.total.toLocaleString()}</p>
          </div>
        ))}

        {/* Meta row */}
        <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1.5 border-t border-gray-100">
          <span className="flex items-center gap-1">
            <CreditCard className="w-2.5 h-2.5" />{methodLabel}
          </span>
          <span className="flex items-center gap-1">
            <Package className="w-2.5 h-2.5" />
            <Clock className="w-2.5 h-2.5" />{order.estimatedDelivery}
          </span>
        </div>
      </div>
    </div>
  );
}
