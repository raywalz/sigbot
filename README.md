## Sigbot

A simple Signal-based AI chatbot.

## Built with:

- TypeScript, Node, TSX: run `.ts` files on server
- `signal-cli`: communicate with signal
- OpenAI: provides `gpt-4o` access
- Vercel AI SDK: abstract LLM provider
  - doesn't provide much utility for this particular project, but it's how I'm used to interacting with OpenAI
- Langfuse: log LLM interactions

## Getting started:

1. Run `npm i` to install dependencies
1. Copy `.env.example` to `.env`
1. Set up signal-cli

   1. Follow these instructions to set up signal-cli if you haven't already: https://github.com/AsamK/signal-cli
   1. Update .env file with signal-cli details.

1. Set up OpenAI

   1. Create a OpenAI account if you haven't already.
   1. Go to https://platform.openai.com/api-keys and click "Create new secret key"
   1. Update .env file with OpenAI details.

1. Set up [Langfuse](https://langfuse.com)
   1. Create a Langfuse account if you haven't already.
   1. Create a new project.
   1. Update .env file with Langfuse details
1. For each number you want to be able to communicate with the bot, you must have the bot send them a message first.
   - You can send this message with
     ```bash
     /path/to/your/signal-cli -a +15555555555 send -m "hi :)" +18005550100
     ```
     Where the first number is your bot and the second is the recipient that you want to be able to communicate with your bot.
1. Run with `npm run start`

## NOTES:

- Sigbot currently has no knowledge of previous messages.
- I recommend running this inside `screen` so that you can keep it running in the background easily.
