export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type InvokeLLMOptions = {
  temperature?: number;
  model?: string;
};

type ArkInputContent = {
  type: 'input_text';
  text: string;
};

type ArkInputMessage = {
  role: 'system' | 'user' | 'assistant';
  content: ArkInputContent[];
};

type ArkOutputContent = {
  type: string;
  text?: string;
};

type ArkOutputItem = {
  type: string;
  role?: string;
  content?: ArkOutputContent[];
};

function loadEnvIfNeeded(): void {
  if (process.env.ARK_API_KEY) {
    return;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv').config({ path: '.env.local' });
  } catch {
    // dotenv optional outside Next.js
  }
}

function getArkConfig() {
  loadEnvIfNeeded();

  const apiKey = process.env.ARK_API_KEY;
  const baseUrl = process.env.ARK_BASE_URL ?? 'https://ark.cn-beijing.volces.com/api/v3';
  const model = process.env.ARK_MODEL ?? 'doubao-seed-2-1-pro-260628';

  if (!apiKey) {
    throw new Error('ARK_API_KEY is not set');
  }

  return { apiKey, baseUrl, model };
}

function toArkInput(messages: ChatMessage[]): ArkInputMessage[] {
  return messages.map((message) => ({
    role: message.role,
    content: [{ type: 'input_text', text: message.content }],
  }));
}

function parseArkResponse(data: { output?: ArkOutputItem[] }): string {
  const output = data.output ?? [];
  const messageItem = output.find(
    (item) => item.type === 'message' && item.role === 'assistant',
  );
  const textItem = messageItem?.content?.find((item) => item.type === 'output_text');
  return textItem?.text?.trim() ?? '';
}

export async function invokeLLM(
  messages: ChatMessage[],
  options?: InvokeLLMOptions,
): Promise<{ content: string }> {
  const { apiKey, baseUrl, model } = getArkConfig();

  const body: Record<string, unknown> = {
    model: options?.model ?? model,
    input: toArkInput(messages),
  };

  if (options?.temperature !== undefined) {
    body.temperature = options.temperature;
  }

  const response = await fetch(`${baseUrl}/responses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ark API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as { output?: ArkOutputItem[] };
  const content = parseArkResponse(data);

  if (!content) {
    throw new Error('Ark API returned empty content');
  }

  return { content };
}
