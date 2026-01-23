import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getStripe, stripeSecretKey } from '../config/stripe'

interface CheckoutRequest {
  priceId: string
  successUrl: string
  cancelUrl: string
}

export const createCheckoutSession = onCall(
  {
    secrets: [stripeSecretKey],
    cors: [
      'https://red-coral-map.web.app',
      'https://red-coral-map.firebaseapp.com',
      'https://redcoralmap.org',
      'http://localhost:5173',
      'http://localhost:3000',
    ],
  },
  async (request) => {
    const { auth, data } = request

    // Verify user is authenticated
    if (!auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in to subscribe')
    }

    const { priceId, successUrl, cancelUrl } = data as CheckoutRequest

    if (!priceId || !successUrl || !cancelUrl) {
      throw new HttpsError('invalid-argument', 'Missing required parameters')
    }

    const stripe = getStripe()
    const firestore = getFirestore()
    const userId = auth.uid
    const userEmail = auth.token.email

    try {
      // Check if user already has a Stripe customer ID
      const permDoc = await firestore.collection('Permissions').doc(userId).get()
      let customerId: string | undefined

      if (permDoc.exists) {
        const permData = permDoc.data()
        customerId = permData?.stripeCustomerId
      }

      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            firebaseUID: userId,
          },
        })
        customerId = customer.id

        // Save customer ID to Firestore
        await firestore.collection('Permissions').doc(userId).set(
          {
            stripeCustomerId: customerId,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        )
      }

      // Create Checkout Session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
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
        metadata: {
          firebaseUID: userId,
        },
        subscription_data: {
          metadata: {
            firebaseUID: userId,
          },
        },
      })

      return { url: session.url }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      throw new HttpsError('internal', 'Failed to create checkout session')
    }
  }
)
