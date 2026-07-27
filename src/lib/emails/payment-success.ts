function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function createPaymentSuccessEmailHtml(name: string): string {
  const safeName = escapeHtml(name.trim() || 'there');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Payment successful</title>
  </head>
  <body>
    <h1>Payment successful, ${safeName}!</h1>
    <p>Your purchase is complete, and we added <strong>50 credits</strong> to your MentorLoop account.</p>
    <p>You can now start more teaching sessions whenever you're ready.</p>
    <p>Thank you,<br />The MentorLoop team</p>
  </body>
</html>`;
}
