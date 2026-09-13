// Envoie le courriel de confirmation de commande via Resend
// (https://resend.com). Nécessite la variable d'environnement Netlify
// RESEND_API_KEY (Resend → API Keys → Create API Key).
//
// Pour que l'envoi fonctionne vers n'importe quel client (pas seulement
// votre propre adresse), il faut aussi vérifier un domaine dans Resend
// (Resend → Domains) — par exemple lakazmimoze.ca — et l'utiliser comme
// adresse d'expédition (FROM_EMAIL, ex. commandes@lakazmimoze.ca). Sans
// domaine vérifié, Resend limite l'envoi à l'adresse du compte.

async function sendOrderConfirmationEmail(order) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !order.email) return;

  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const firstName = order.name ? order.name.split(' ')[0] : '';
  const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,';

  const html = `
    <div style="font-family:Arial,sans-serif;color:#2b1a14;line-height:1.6;max-width:560px;margin:0 auto;">
      <h2 style="color:#7a2d20;">Votre commande La Kaz Mimoze est confirmée ! 🥩🇷🇪</h2>
      <p>${greeting}</p>
      <p>Un grand merci pour votre confiance ! Nous avons bien reçu votre paiement et votre commande est officiellement entre les mains de notre artisan boucher.</p>
      <p>Comme promis sur notre site, rien n'est préparé à l'avance chez nous : tout est découpé et cuisiné frais, spécialement pour vous.</p>
      <p><strong>Ce qui se passe maintenant :</strong></p>
      <ul>
        <li>🕒 <strong>Délai</strong> : comptez un délai d'environ 7 jours pour la préparation.</li>
        <li>📱 <strong>Confirmation</strong> : dès que votre boîte est prête, nous vous envoyons un texto ou un courriel pour vous confirmer votre date et heure de cueillette.</li>
      </ul>
      <p><strong>Rappel de votre point de cueillette :</strong><br>
      📍 220, boulevard Wilfrid-Hamel, Québec (QC) G1L 5A7</p>
      <p>Si vous avez la moindre question d'ici là, n'hésitez pas à répondre directement à ce courriel ou à nous écrire à lakazmimoze@gmail.com.</p>
      <p>À très bientôt pour la cueillette,<br>
      L'équipe de La Kaz Mimoze<br>
      <em>Boucherie artisanale &amp; Spécialités réunionnaises</em></p>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `La Kaz Mimoze <${fromEmail}>`,
      to: order.email,
      subject: 'Votre commande La Kaz Mimoze est confirmée ! 🥩🇷🇪',
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Échec envoi courriel Resend:', res.status, text);
  }
}

module.exports = { sendOrderConfirmationEmail };
