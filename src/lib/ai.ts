type CallAIParameters = {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  systemPrompt: string;
  userMessage: string;
};

interface ChatCompletionChoice {
  message: {
    content: string;
  };
}

interface ChatCompletionResponse {
  choices: ChatCompletionChoice[];
}

const MAX_RETRY_COUNT = 2;
const RETRY_DELAY_MS = 500;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function hasChatCompletionContent(
  value: unknown
): value is ChatCompletionResponse {
  if (!isRecord(value) || !isUnknownArray(value.choices)) {
    return false;
  }

  return value.choices.every((choice) => {
    if (!isRecord(choice) || !isRecord(choice.message)) {
      return false;
    }

    return typeof choice.message.content === 'string';
  });
}

function waitForRetry(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, RETRY_DELAY_MS);
  });
}

export async function callAI({
  apiKey,
  baseUrl,
  model,
  systemPrompt,
  userMessage
}: CallAIParameters): Promise<string> {
  // Fallback to .env.local if no keys are provided (No BYOK for V1)
  const finalApiKey = apiKey || process.env.HOSTED_AI_API_KEY;
  const finalBaseUrl = baseUrl || process.env.AI_BASE_URL;
  const finalModel = model || process.env.AI_MODEL;

  if (!finalApiKey || !finalBaseUrl || !finalModel) {
    throw new Error('AI_CONFIG_MISSING');
  }

  for (let attempt = 0; attempt <= MAX_RETRY_COUNT; attempt += 1) {
    try {
      const response = await fetch(`${finalBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${finalApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: finalModel,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          response_format: {
            type: 'json_object'
          }
        })
      });

      if (!response.ok) {
        throw new Error('AI_CALL_FAILED');
      }

      const responseBody: unknown = await response.json();

      if (!hasChatCompletionContent(responseBody)) {
        throw new Error('AI_CALL_FAILED');
      }

      const [firstChoice] = responseBody.choices;

      if (!firstChoice) {
        throw new Error('AI_CALL_FAILED');
      }

      return firstChoice.message.content;
    } catch {
      if (attempt === MAX_RETRY_COUNT) {
        throw new Error('AI_CALL_FAILED');
      }

      await waitForRetry();
    }
  }

  throw new Error('AI_CALL_FAILED');
}