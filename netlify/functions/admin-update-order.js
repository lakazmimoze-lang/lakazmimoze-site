// Met à jour le statut d'une commande (nouvelle / préparée / remise),
// depuis la page admin.html. Même protection par mot de passe qu'admin-orders.

const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Méthode non autorisée' };
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const given = event.headers['x-admin-password'];
  if (!adminPassword || given !== adminPassword) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Non autorisé.' }) };
  }

  const { id, status } = JSON.parse(event.body || '{}');
  if (!id || !status) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Requête invalide.' }) };
  }

  const store = getStore('orders');
  const order = await store.get(id, { type: 'json' });
  if (!order) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Commande introuvable.' }) };
  }

  order.status = status;
  await store.setJSON(id, order);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true }),
  };
};
