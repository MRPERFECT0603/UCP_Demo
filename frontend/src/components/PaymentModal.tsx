import { useState } from 'react';
import { X, CreditCard, Smartphone, Package, Shield, CheckCircle, Loader2, Lock } from 'lucide-react';
import { PaymentInitResult } from '../types';

interface PaymentModalProps {
  payment: PaymentInitResult;
  onSuccess: (method: string) => void;
  onClose: () => void;
}

type Step = 'choose' | 'card' | 'upi' | 'processing' | 'done';

export function PaymentModal({ payment, onSuccess, onClose }: PaymentModalProps) {
  const [step, setStep] = useState<Step>('choose');
  const [selectedMethod, setSelectedMethod] = useState('');

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // UPI state
  const [upiId, setUpiId] = useState('');

  const merchantBg = payment.merchant === 'Flipkart' ? 'from-blue-600 to-blue-800' : 'from-pink-600 to-pink-800';

  function formatCard(val: string) {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  }
  function formatExpiry(val: string) {
    const d = val.replace(/\D/g, '').slice(0, 4);
    return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  }

  function handleMethodSelect(method: string) {
    setSelectedMethod(method);
    if (method === 'card') setStep('card');
    else if (method === 'upi') setStep('upi');
    else handlePay('cod'); // COD — instant
  }

  function handlePay(method: string) {
    setStep('processing');
    setTimeout(() => {
      setStep('done');
      setTimeout(() => onSuccess(method), 900);
    }, 1800);
  }

  const isCardValid = cardNumber.replace(/\s/g, '').length === 16 && expiry.length === 5 && cvv.length === 3 && cardName.length > 2;
  const isUpiValid = /^[\w.]+@[\w]+$/.test(upiId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className={`bg-gradient-to-r ${merchantBg} text-white px-5 py-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80 uppercase tracking-wider">Secure Payment</p>
              <p className="text-xl font-bold mt-0.5">₹{payment.amount.toLocaleString()}</p>
              <p className="text-xs opacity-70 mt-0.5">{payment.merchant} · UCP Checkout</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-white/20 rounded-full p-1.5">
                <Lock className="w-4 h-4" />
              </div>
              {step === 'choose' && (
                <button onClick={onClose} className="bg-white/20 hover:bg-white/30 rounded-full p-1.5 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-5">

          {/* STEP: Choose method */}
          {step === 'choose' && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700 mb-3">Select Payment Method</p>

              <button onClick={() => handleMethodSelect('card')}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold text-gray-800">Credit / Debit Card</p>
                  <p className="text-xs text-gray-500">Visa, Mastercard, RuPay</p>
                </div>
                <span className="text-gray-400 text-xs">›</span>
              </button>

              <button onClick={() => handleMethodSelect('upi')}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all group">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <Smartphone className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold text-gray-800">UPI / Google Pay</p>
                  <p className="text-xs text-gray-500">PhonePe, Paytm, BHIM</p>
                </div>
                <span className="text-gray-400 text-xs">›</span>
              </button>

              <button onClick={() => handleMethodSelect('cod')}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-all group">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <Package className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold text-gray-800">Cash on Delivery</p>
                  <p className="text-xs text-gray-500">Pay when delivered</p>
                </div>
                <span className="text-gray-400 text-xs">›</span>
              </button>

              <div className="flex items-center gap-1.5 mt-2 justify-center text-xs text-gray-400">
                <Shield className="w-3 h-3" />
                <span>256-bit SSL · UCP Protocol v1.0</span>
              </div>
            </div>
          )}

          {/* STEP: Card */}
          {step === 'card' && (
            <div className="space-y-3">
              <button onClick={() => setStep('choose')} className="text-xs text-blue-600 flex items-center gap-1 mb-1">
                ← Back
              </button>
              <p className="text-sm font-semibold text-gray-700">Card Details</p>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Card Number</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={e => setCardNumber(formatCard(e.target.value))}
                  maxLength={19}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Expiry</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={e => setExpiry(formatExpiry(e.target.value))}
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">CVV</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123"
                    type="password"
                    value={cvv}
                    onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    maxLength={3}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Name on Card</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                  value={cardName}
                  onChange={e => setCardName(e.target.value)}
                />
              </div>

              <button
                disabled={!isCardValid}
                onClick={() => handlePay('card')}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Pay ₹{payment.amount.toLocaleString()}
              </button>
            </div>
          )}

          {/* STEP: UPI */}
          {step === 'upi' && (
            <div className="space-y-4">
              <button onClick={() => setStep('choose')} className="text-xs text-blue-600 flex items-center gap-1">
                ← Back
              </button>
              <p className="text-sm font-semibold text-gray-700">UPI Payment</p>

              {/* Google Pay prominent button */}
              <button
                onClick={() => handlePay('upi')}
                className="w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/120px-Google_Pay_Logo.svg.png"
                  alt="Google Pay" className="h-7 object-contain" onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                <span className="text-sm font-semibold text-gray-800">Pay with Google Pay</span>
              </button>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or enter UPI ID</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">UPI ID</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="yourname@paytm"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                />
              </div>

              <button
                disabled={!isUpiValid}
                onClick={() => handlePay('upi')}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                Verify & Pay ₹{payment.amount.toLocaleString()}
              </button>

              <p className="text-xs text-center text-gray-400">
                A payment request will be sent to your UPI app
              </p>
            </div>
          )}

          {/* STEP: Processing */}
          {step === 'processing' && (
            <div className="py-8 flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                <Lock className="absolute inset-0 m-auto w-6 h-6 text-blue-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800">Processing Payment</p>
                <p className="text-xs text-gray-500 mt-1">Verifying with {payment.merchant} via UCP...</p>
              </div>
            </div>
          )}

          {/* STEP: Done */}
          {step === 'done' && (
            <div className="py-8 flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800">Payment Successful!</p>
                <p className="text-xs text-gray-500 mt-1">Confirming your order...</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
