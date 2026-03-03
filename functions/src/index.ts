import { initializeApp } from 'firebase-admin/app'

// Initialize Firebase Admin
initializeApp()

// Export Stripe functions
export { createCheckoutSession } from './stripe/createCheckout'
export { stripeWebhook } from './stripe/webhook'
