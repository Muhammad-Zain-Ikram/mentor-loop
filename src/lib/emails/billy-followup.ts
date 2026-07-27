function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function createBillyFollowUpEmailHtml(
  topic: string,
  question: string
): string {
  const safeTopic = escapeHtml(topic.trim());
  const safeQuestion = escapeHtml(question.trim());

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Billy has a refresher question</title>
  </head>
  <body>
    <h1>Billy has a quick question about ${safeTopic}</h1>
    <p>It has been a few days since you taught Billy this topic. He is trying to remember:</p>
    <p><strong>${safeQuestion}</strong></p>
    <p>Reply in your next MentorLoop session to help Billy refresh his understanding.</p>
    <p>See you soon,<br />Billy and the MentorLoop team</p>
  </body>
</html>`;
}
