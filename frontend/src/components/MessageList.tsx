import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, CreditCard } from 'lucide-react';
import { ChatMessage, Product } from '../types';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { CartSummary } from './CartSummary';
import { OrderConfirmationCard } from './OrderConfirmationCard';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSuggestionClick: (text: string) => void;
  onBuyProduct: (text: string) => void;
  onPayNow: (text: string) => void;
}

export function MessageList({ messages, isLoading, onSuggestionClick, onBuyProduct, onPayNow }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [modalProduct, setModalProduct] = useState<{ product: Product; all: Product[] } | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Close modal on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setModalProduct(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-2xl mb-3">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-base font-bold text-gray-800 mb-1">UCP Shopping Agent</h2>
            <p className="text-gray-500 text-xs max-w-xs mx-auto mb-4 leading-relaxed">
              Search across Flipkart &amp; Myntra, compare prices, and buy — all via Universal Commerce Protocol.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Find black Nike shoes under ₹5000', 'Show Adidas running shoes', 'Find shoes under ₹3000'].map(s => (
                <button key={s} onClick={() => onSuggestionClick(s)}
                  className="text-xs bg-white hover:bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200 transition-colors shadow-sm">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center self-end ${
              msg.role === 'user' ? 'bg-blue-600' : 'bg-white border border-gray-200 shadow-sm'
            }`}>
              {msg.role === 'user'
                ? <User className="w-3.5 h-3.5 text-white" />
                : <Bot className="w-3.5 h-3.5 text-gray-600" />}
            </div>

            {/* Bubble + rich content */}
            <div className={`flex-1 max-w-[88%] space-y-2 ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
              <div className={`rounded-2xl px-3 py-2 text-xs leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm'
              }`}>
                <div className={`prose prose-xs max-w-none ${msg.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>

              {/* Product carousel */}
              {msg.products && msg.products.length > 0 && (
                <div className="w-full">
                  <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide">
                    {msg.products.slice(0, 6).map((p, i) => (
                      <div key={p.id} className="flex-shrink-0 w-36 snap-start">
                        <ProductCard
                          product={p}
                          index={i}
                          onOpen={prod => setModalProduct({ product: prod, all: msg.products!.slice(0, 6) })}
                          onBuy={prod => onBuyProduct(`__BUY_ID__${prod.id}__MERCHANT__${prod.merchant}`)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cart */}
              {msg.cart && (
                <CartSummary
                  cart={msg.cart}
                  onPayNow={msg.payment ? undefined : () => onPayNow('Proceed to payment')}
                />
              )}

              {/* Payment open button */}
              {msg.payment && !msg.order && (
                <button
                  onClick={() => onPayNow('Proceed to payment')}
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Open Payment — ₹{msg.payment.amount.toLocaleString()}
                </button>
              )}

              {/* Order confirmation */}
              {msg.order && <OrderConfirmationCard order={msg.order} />}

              {/* Suggestions */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {msg.suggestions.map(s => (
                    <button key={s} onClick={() => onSuggestionClick(s)}
                      className="text-xs bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full border border-gray-200 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-400 px-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Bot className="w-3.5 h-3.5 text-gray-600" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm">
              <div className="flex gap-1 items-center">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Product detail modal */}
      {modalProduct && (
        <ProductDetailModal
          product={modalProduct.product}
          allProducts={modalProduct.all}
          onClose={() => setModalProduct(null)}
          onNavigate={prod => setModalProduct(prev => prev ? { ...prev, product: prod } : null)}
          onBuy={prod => {
            onBuyProduct(`__BUY_ID__${prod.id}__MERCHANT__${prod.merchant}`);
            setModalProduct(null);
          }}
        />
      )}
    </>
  );
}
