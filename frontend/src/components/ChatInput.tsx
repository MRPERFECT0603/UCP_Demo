import { useState, useRef, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const msg = value.trim();
    if (!msg || isLoading) return;
    onSend(msg);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInput = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 100)}px`;
  };

  return (
    <div className="border-t border-gray-200 bg-white px-3 py-2.5 flex-shrink-0">
      <div className="flex items-end gap-2 bg-gray-50 rounded-xl border border-gray-300 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 px-3 py-2 transition-all">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything… e.g. Find black Nike shoes under ₹5000"
          rows={1}
          disabled={isLoading}
          className="flex-1 bg-transparent resize-none text-xs text-gray-800 placeholder-gray-400 outline-none min-h-[22px] max-h-[100px] py-0.5 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || isLoading}
          className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center transition-colors active:scale-95"
        >
          <Send className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
      <p className="text-xs text-gray-400 text-center mt-1">Enter to send · Shift+Enter for new line</p>
    </div>
  );
}
