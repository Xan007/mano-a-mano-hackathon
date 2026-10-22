type Message = { role: "system" | "user" | "assistant"; content: string };

export async function groqJson({
  model,
  messages,
  schema,
  strict = false,
  name,
}: {
  model: string;
  messages: Message[];
  schema: object;
  strict?: boolean;
  name: string;
}): Promise<unknown | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const request = () =>
      fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(8_000),
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0,
          reasoning_effort: "low",
          max_completion_tokens: 512,
          response_format: {
            type: "json_schema",
            json_schema: { name, strict, schema },
          },
        }),
      });
    let response = await request();
    if (response.status === 503) response = await request();
    if (!response.ok) {
      console.error("Groq request status", response.status);
      return null;
    }
    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return JSON.parse(data.choices?.[0]?.message?.content ?? "null");
  } catch {
    return null;
  }
}
