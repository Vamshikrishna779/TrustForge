import { API_BASE } from '../api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface PaymentResult {
  success: boolean;
  message: string;
  user?: any;
}

export async function initiateProUpgrade(
  token: string,
  onSuccess: (user: any) => void,
  onError: (msg: string) => void
): Promise<void> {
  // 1. Load Razorpay SDK
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    onError('Failed to load payment gateway. Please try again.');
    return;
  }

  // 2. Create order from backend
  let orderData: any;
  try {
    const res = await fetch(`${API_BASE}/api/v1/payment/create-order`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Could not create payment order.');
    orderData = data;
  } catch (err: any) {
    onError(err.message || 'Payment initiation failed.');
    return;
  }

  // 3. Open Razorpay Checkout
  const options = {
    key: orderData.key_id,
    amount: orderData.amount,
    currency: orderData.currency,
    name: 'TrustForge',
    description: 'Pro Plan — ₹7/month',
    image: '/logo.png',
    order_id: orderData.order_id,
    handler: async (response: any) => {
      // 4. Verify payment on backend
      try {
        const verifyRes = await fetch(`${API_BASE}/api/v1/payment/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });
        const result: PaymentResult = await verifyRes.json();
        if (!verifyRes.ok) throw new Error(result.message || 'Payment verification failed.');

        // 5. Update localStorage with Pro user
        if (result.user) {
          const stored = localStorage.getItem('tf_user');
          const currentUser = stored ? JSON.parse(stored) : {};
          const updatedUser = { ...currentUser, ...result.user, plan: 'pro' };
          localStorage.setItem('tf_user', JSON.stringify(updatedUser));
          onSuccess(updatedUser);
        }
      } catch (err: any) {
        onError(err.message || 'Payment verification failed. Contact support.');
      }
    },
    prefill: {
      // email will be filled by Razorpay from order notes
    },
    theme: {
      color: '#2563EB',
      backdrop_color: 'rgba(0,0,0,0.85)',
    },
    modal: {
      ondismiss: () => {
        onError('Payment cancelled.');
      },
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
}
