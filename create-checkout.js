// Fonction serveur : reçoit le panier depuis le site, crée une session de paiement
// Stripe pour le total exact (peu importe la combinaison de boîtes), et renvoie
// l'URL de paiement à laquelle le navigateur du client sera redirigé.
//
// La clé secrète Stripe n'est JAMAIS écrite ici : elle vient d'une variable
// d'environnement configurée dans Netlify (Site settings → Environment variables
// → STRIPE_SECRET_KEY). Ça permet de la changer sans toucher au code, et elle
// n'est jamais visible dans le site public.

const Stripe = require('stripe');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Méthode non autorisée' };
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "La clé Stripe n'est pas configurée sur le serveur." }),
    };
  }

  const stripe = Stripe(stripeSecretKey);

  try {
    const { items, customer } = JSON.parse(event.body);

    if (!Array.isArray(items) || items.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Panier vide.' }) };
    }

    // Construit les lignes de paiement Stripe à partir du panier envoyé par le site.
    const line_items = items.map((item) => ({
      price_data: {
        currency: 'cad',
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100), // Stripe attend des cents
      },
      quantity: item.qty,
    }));

    const siteUrl = process.env.URL || 'https://lakazmimoze.ca';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${siteUrl}/?paiement=succes&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/?paiement=annule`,
      customer_email: customer && customer.email ? customer.email : undefined,
      metadata: {
        nom: (customer && customer.name) || '',
        telephone: (customer && customer.phone) || '',
        note: (customer && customer.note) || '',
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Erreur inconnue.' }),
    };
  }
};
