import { onRequest } from 'firebase-functions/v2/https'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getStripe, stripeSecretKey, stripeWebhookSecret } from '../config/stripe'
import Stripe from 'stripe'

export const stripeWebhook = onRequest(
  {
    secrets: [stripeSecretKey, stripeWebhookSecret],
  },
  async (req, res) => {
    const stripe = getStripe()
    const firestore = getFirestore()

    const sig = req.headers['stripe-signature'] as string

    if (!sig) {
      res.status(400).send('Missing stripe-signature header')
      return
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, stripeWebhookSecret.value())
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      res.status(400).send(`Webhook Error: ${err}`)
      return
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session
          await handleCheckoutCompleted(firestore, stripe, session)
          break
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription
          await handleSubscriptionUpdated(firestore, subscription)
          break
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription
          await handleSubscriptionDeleted(firestore, subscription)
          break
        }

        default:
          console.log(`Unhandled event type: ${event.type}`)
      }

      res.status(200).send('OK')
    } catch (error) {
      console.error('Error processing webhook:', error)
      res.status(500).send('Webhook processing failed')
    }
  }
)

async function handleCheckoutCompleted(
  firestore: FirebaseFirestore.Firestore,
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  const firebaseUID = session.metadata?.firebaseUID
  const subscriptionId = session.subscription as string

  if (!firebaseUID) {
    console.error('No firebaseUID in session metadata')
    return
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  // Update Firestore permissions
  await firestore.collection('Permissions').doc(firebaseUID).set(
    {
      isPaid: true,
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus: subscription.status,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  console.log(`User ${firebaseUID} subscription activated`)
}

async function handleSubscriptionUpdated(
  firestore: FirebaseFirestore.Firestore,
  subscription: Stripe.Subscription
) {
  const firebaseUID = subscription.metadata?.firebaseUID

  if (!firebaseUID) {
    console.error('No firebaseUID in subscription metadata')
    return
  }

  const isPaid = ['active', 'trialing'].includes(subscription.status)

  await firestore.collection('Permissions').doc(firebaseUID).set(
    {
      isPaid,
      subscriptionStatus: subscription.status,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  console.log(`User ${firebaseUID} subscription updated to ${subscription.status}`)
}

async function handleSubscriptionDeleted(
  firestore: FirebaseFirestore.Firestore,
  subscription: Stripe.Subscription
) {
  const firebaseUID = subscription.metadata?.firebaseUID

  if (!firebaseUID) {
    console.error('No firebaseUID in subscription metadata')
    return
  }

  await firestore.collection('Permissions').doc(firebaseUID).set(
    {
      isPaid: false,
      subscriptionStatus: 'canceled',
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  console.log(`User ${firebaseUID} subscription canceled`)
}
