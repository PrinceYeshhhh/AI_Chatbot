// Ensure you have installed the Stripe package: npm install stripe @types/stripe --save
import Stripe from 'stripe';

const stripe = new Stripe(process.env['STRIPE_SECRET_KEY'] as string, {
  apiVersion: '2022-11-15',
});

export const createCheckoutSession = async ({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
}: {
  customerId?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}) => {
  return await stripe.checkout.sessions.create({
    customer: customerId || undefined,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
};

export const getStripe = () => stripe;

export const createCustomer = async (email: string) => {
  return await stripe.customers.create({ email });
};

export const getSubscription = async (subscriptionId: string) => {
  return await stripe.subscriptions.retrieve(subscriptionId);
};

export const reportUsage = async ({ subscriptionItemId, quantity, timestamp }: { subscriptionItemId: string; quantity: number; timestamp?: number }) => {
  return await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
    quantity,
    timestamp: timestamp || Math.floor(Date.now() / 1000),
    action: 'increment',
  });
}; 