function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function createWelcomeEmailHtml(name: string): string {
  const safeName = escapeHtml(name.trim() || 'there');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Welcome to MentorLoop</title>
  </head>
  <body>
    <h1>Welcome to MentorLoop, ${safeName}!</h1>
    <p>You're all set to start teaching Billy and turning your explanations into lasting understanding.</p>
    <p>Choose a topic, explain it in your own words, and Billy will help you spot what to explore next.</p>
    <p>Happy learning,<br />The MentorLoop team</p>
  </body>
</html>`;
}
