// Reçoit les événements Stripe (configuré dans le tableau de bord Stripe).
// Quand un paiement est confirmé (checkout.session.completed), on enregistre
// la commande dans Netlify Blobs pour qu'elle apparaisse dans la page admin.
//
// STRIPE_WEBHOOK_SECRET vient de Stripe (Développeurs → Webhooks → votre
// endpoint → Signing secret), à ajouter dans Netlify (Site settings →
// Environment variables). Sert à vérifier que l'appel vient bien de Stripe.

const Stripe = require('stripe');
const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Méthode non autorisée' };
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeSecretKey || !webhookSecret) {
    return { statusCode: 500, body: 'Configuration serveur manquante.' };
  }

  const stripe = Stripe(stripeSecretKey);
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      event.headers['stripe-signature'],
      webhookSecret
    );
  } catch (err) {
    return { statusCode: 400, body: `Signature invalide: ${err.message}` };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;

    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
    const items = lineItems.data.map((li) => ({
      name: li.description,
      qty: li.quantity,
      price: li.quantity ? li.amount_total / li.quantity / 100 : li.amount_total / 100,
    }));

    const order = {
      id: session.id,
      createdAt: new Date().toISOString(),
      name: (session.metadata && session.metadata.nom) || '',
      phone: (session.metadata && session.metadata.telephone) || '',
      email: (session.customer_details && session.customer_details.email) || session.customer_email || '',
      note: (session.metadata && session.metadata.note) || '',
      items,
      total: (session.amount_total || 0) / 100,
      status: 'nouvelle',
    };

    const store = getStore('orders');
    await store.setJSON(order.id, order);
  }

  return { statusCode: 200, body: 'ok' };
};
