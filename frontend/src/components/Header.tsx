import { ShoppingBag, Zap } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3 shadow-sm flex-shrink-0">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
        <ShoppingBag className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-gray-900 text-sm">UCP Shopping Agent</h1>
          <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
            <Zap className="w-2.5 h-2.5" />Live
          </span>
        </div>
        <p className="text-xs text-gray-400 truncate">Powered by Groq · Searches Flipkart &amp; Myntra via UCP</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-medium">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          Flipkart
        </div>
        <div className="flex items-center gap-1 text-xs bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full border border-pink-200 font-medium">
          <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse" />
          Myntra
        </div>
      </div>
    </header>
  );
}
