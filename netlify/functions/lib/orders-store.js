// Ouvre le magasin Netlify Blobs "orders", utilisé par les 3 fonctions
// admin/webhook. Passe siteID + token explicitement : sur ce compte, la
// configuration automatique de Netlify Blobs ne s'active pas toute seule
// (MissingBlobsEnvironmentError), donc on la fournit nous-mêmes.
//
// NETLIFY_SITE_ID : Site configuration → General → Site details → Site ID.
// NETLIFY_BLOBS_TOKEN : un jeton d'accès personnel Netlify (User settings →
// Applications → Personal access tokens → New access token).
// Les deux sont à ajouter comme variables d'environnement Netlify.

const { getStore } = require('@netlify/blobs');

function ordersStore() {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN;

  if (siteID && token) {
    return getStore({ name: 'orders', siteID, token });
  }
  return getStore('orders');
}

module.exports = { ordersStore };
