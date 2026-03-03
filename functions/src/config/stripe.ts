import Stripe from 'stripe'
import { defineSecret } from 'firebase-functions/params'

export const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY')
export const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET')

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(stripeSecretKey.value(), {
      apiVersion: '2025-12-15.clover',
    })
  }
  return stripeInstance
}
