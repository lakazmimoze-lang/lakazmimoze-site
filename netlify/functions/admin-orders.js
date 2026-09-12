// Renvoie la liste des commandes enregistrées, pour la page admin.html.
// Protégé par un mot de passe (ADMIN_PASSWORD, configuré dans Netlify —
// Site settings → Environment variables — jamais écrit dans le code).

const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const given = event.headers['x-admin-password'];

  if (!adminPassword || given !== adminPassword) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Non autorisé.' }) };
  }

  const store = getStore('orders');
  const { blobs } = await store.list();
  const orders = await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })));
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orders }),
  };
};
