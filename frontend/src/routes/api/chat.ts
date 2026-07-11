import { createFileRoute } from "@tanstack/react-router";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type RequestBody = {
  messages: ChatMessage[];
  model?: string;
  stream?: boolean;
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as RequestBody;
          const { messages, model, stream = false } = body;

          if (!Array.isArray(messages)) {
            return Response.json(
              { error: "messages array is required" },
              { status: 400 }
            );
          }

          const ollamaUrl = `${process.env.OLLAMA_API_URL || "http://localhost:11434"}/api/chat`;
          const ollamaModel = model || process.env.OLLAMA_MODEL || "llama3.2:3b";

          const response = await fetch(ollamaUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: ollamaModel,
              messages,
              stream,
            }),
          });

          if (!response.ok) {
            const errText = await response.text();
            return Response.json(
              { error: `Ollama error: ${errText}` },
              { status: response.status }
            );
          }

          if (stream) {
            return new Response(response.body, {
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
              },
            });
          }

          const data = await response.json();
          return Response.json(data);
        } catch (error) {
          console.error("Chat API error:", error);
          return Response.json(
            { error: (error as Error).message || "Internal server error" },
            { status: 500 }
          );
        }
      },
      GET: async () => {
        return Response.json({ message: "Use POST to communicate with the Chat API." }, { status: 405 });
      },
    },
  },
});
