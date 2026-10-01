# Project Rules

## Video Production Rules

Apply these rules every time a video is created.

1. **Style:** Motion graphics only. No static slideshows.
2. **Voice:** Narration is spoken in Khmer.
3. **AI engine:** Use the Gemini API.
   - Script and content: the latest Gemini Flash model (for example, Gemini 3.8 Flash). Confirm the current model ID before each build.
   - Voice: the latest Gemini TTS model.
   - Read the API key from the `GEMINI_API_KEY` environment variable. Never write the key into code or commit it.
4. **On-screen text:** Khmer, with English keywords kept in English. Examples: AI, AI Agent, HR, Manager, CEO, Workflow, Prompt, KPI.
