import { useCallback } from 'react';
import { Header } from './components/Header';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { PaymentModal } from './components/PaymentModal';
import { useChat } from './hooks/useChat';

export default function App() {
  const { messages, isLoading, pendingPayment, sendUserMessage, handlePaymentComplete, dismissPayment } = useChat();

  const handleSend = useCallback((text: string) => {
    sendUserMessage(text);
  }, [sendUserMessage]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <Header />
      <MessageList
        messages={messages}
        isLoading={isLoading}
        onSuggestionClick={handleSend}
        onBuyProduct={handleSend}
        onPayNow={handleSend}
      />
      <ChatInput onSend={handleSend} isLoading={isLoading} />

      {pendingPayment && (
        <PaymentModal
          payment={pendingPayment}
          onSuccess={handlePaymentComplete}
          onClose={dismissPayment}
        />
      )}
    </div>
  );
}
