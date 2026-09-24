# Business Advisor

A voice-only business advisor app. The owner or manager taps one button and talks live with the advisor in Khmer. The advisor gives practical ideas on management, staff, sales, marketing, cash flow and growth.

The app has only two buttons:

- **ចាប់ផ្ដើមនិយាយ** (Start talking): starts or ends the live voice talk.
- **បន្ថែមប្រភព** (Add sources): adds PDF, Word, TXT files or pasted text. The advisor then talks about the topics in these sources.

Powered by the Gemini Live API (model `gemini-3.8-live`). Branding: AI For Business.

---

## Put the app online: choose one way

### Way 1 (easiest): GitHub Pages + key button in the app

No server and no settings files. The API key is typed into the app.

1. In GitHub, open this repository, then go to **Settings → Pages**.
2. Under **Source**, choose **GitHub Actions**.
3. Merge the Business Advisor pull request. GitHub publishes the app in about 1 minute at:
   `https://aitrainerkh-lgtm.github.io/test/`
4. Open the link on the phone. Tap the **key button** (top right, with the orange dot).
5. Get a key at https://aistudio.google.com/apikey, paste it and tap **រក្សាទុក**.
6. Tap **ចាប់ផ្ដើមនិយាយ** and talk.

Important for Way 1:

- The key is saved only on that phone or computer. Each device needs the key once.
- Anyone who has your key can use your Gemini account. For trainees, type the key on their phone yourself,
  or ask each trainee to create their own free key in AI Studio.
- Create a separate key only for this app, so you can delete it after the training.

### Way 2 (safer for sharing): Vercel server keeps the key

The key stays on the server and is never on the phone. The phone only gets a single-use token that expires.

1. Create a free account at https://vercel.com and connect your GitHub account.
2. Click **Add New → Project** and choose this repository.
3. Set **Root Directory** to `business-advisor`.
4. Open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `GEMINI_API_KEY` | your API key |
   | `ACCESS_CODE` | a code you choose, for example `ABC2026` (recommended) |

5. Click **Deploy**. Share the link and the access code with the trainee.

If a device also has a key saved with the key button, the app uses that device key first.

### How the voice works

- The phone connects directly to the Gemini Live API for the voice talk.
- Sources are saved on the user's own device (browser storage). They are sent to Gemini only during a talk.
- A talk stops by itself after 3 minutes of silence, to save cost.

---

## Using the app

1. Tap **បន្ថែមប្រភព** to add documents (optional).
2. Tap **ចាប់ផ្ដើមនិយាយ** and allow the microphone.
3. The advisor greets her in Khmer. She can talk naturally and interrupt at any time.
4. Tap **បញ្ចប់ការនិយាយ** to finish.

Tips:

- Use Chrome (Android) or Safari (iPhone), on a stable Internet connection.
- Earphones give the best result in noisy places.
- For Khmer documents, Word files or pasted text work better than PDF. Some Khmer PDFs lose the correct vowel order when read.
- Scanned PDFs and photos cannot be read. Paste the text instead.
- Total size of all sources: up to 100,000 characters.

---

## Run on your own computer (optional)

Needs Node.js 20.12 or newer.

```bash
cd business-advisor
npm install
cp .env.example .env      # then put your GEMINI_API_KEY in .env
npm start                 # open http://localhost:3000
```

The microphone works on `localhost` and on `https://` links only.

---

## Settings

All settings are environment variables on the server:

| Name | Required | What it does |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Your Gemini API key. Never put it in the app files. |
| `ACCESS_CODE` | Recommended | Users must enter this code once. Stops strangers using your key if the link spreads. |
| `GEMINI_MODEL` | No | Live model. Default `gemini-3.8-live`. |
| `GEMINI_VOICE` | No | A Gemini prebuilt voice name. Empty = model default voice. |

To change how the advisor thinks and talks, edit `public/prompt.js`.

---

## Files

```
business-advisor/
├── api/token.js          Creates the single-use token (keeps the API key secret)
├── server.js             Local server (not used on Vercel)
├── public/
│   ├── index.html        App screen
│   ├── styles.css        3D design (light and dark mode)
│   ├── app.js            Buttons, sources screen, messages
│   ├── live.js           Live voice connection, microphone and speaker
│   ├── mic-worklet.js    Converts microphone sound for Gemini
│   ├── prompt.js         Advisor instructions (edit this to change behavior)
│   ├── sources.js        Reads PDF, Word, TXT and saves sources on the phone
│   ├── fonts/            Battambang, Moul and Inter fonts
│   └── vendor/           Gemini SDK, PDF and Word readers (built by `npm run vendor`)
└── vercel.json
```
