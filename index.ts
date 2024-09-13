import { spawn } from "child_process";
import * as readline from "readline";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import dotenv from "dotenv";
import { Langfuse } from "langfuse";

dotenv.config();

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL,
});

interface JsonRpcRequest {
  jsonrpc: string;
  method: string;
  id: string;
  params?: any;
}

interface SignalMessageEnvelope {
  source: string;
  sourceNumber: string;
  sourceUuid: string;
  sourceName: string;
  sourceDevice: number;
  timestamp: number;
  dataMessage?: {
    timestamp: number;
    message: string;
    expiresInSeconds: number;
    viewOnce: boolean;
    mentions: any[];
    attachments: any[];
    contacts: any[];
  };
}

interface SignalMessage {
  jsonrpc: string;
  method: string;
  params: {
    envelope: SignalMessageEnvelope;
  };
}

const signalCli = spawn(process.env.SIGNAL_CLI_PATH!, [
  "-a",
  process.env.SIGNAL_CLI_ACCOUNT!,
  "jsonRpc",
]);
const rl = readline.createInterface({ input: signalCli.stdout });

signalCli.stderr.on("data", (data) => {
  console.error(`stderr: ${data}`);
});

signalCli.on("close", (code) => {
  console.log(`child process exited with code ${code}`);
});

rl.on("line", (line) => {
  try {
    const message: SignalMessage = JSON.parse(line);
    if (message.method === "receive") {
      handleIncomingMessage(message.params.envelope);
    }
  } catch (err) {
    console.error("Failed to parse message:", err);
  }
});

async function handleIncomingMessage(envelope: SignalMessageEnvelope) {
  const { source, dataMessage, sourceName } = envelope;

  if (!dataMessage) {
    console.warn(
      `Received a message from ${source} without dataMessage. Skipping.`
    );
    return;
  }

  const { message } = dataMessage;

  console.log(`Received message from ${source}: ${message}`);

  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt: `You're a helpful assistant communicating over text message. Use plain text and be brief. <start_user_message> ${message} <end_user_message>`,
  });

  langfuse.trace({
    name: "generated text",
    userId: source,
    input: {
      input: message,
    },
    metadata: {
      name: sourceName,
    },
    output: text,
  });

  langfuse.flushAsync().catch((error) => {
    console.error("Langfuse flushAsync error:", error);
  });

  const echoMessage: JsonRpcRequest = {
    jsonrpc: "2.0",
    method: "send",
    id: "echo-message",
    params: {
      recipient: [source],
      message: text,
    },
  };

  signalCli.stdin.write(JSON.stringify(echoMessage) + "\n");
}
