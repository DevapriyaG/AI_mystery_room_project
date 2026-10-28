# AI Mystery Room

Type a scenario, and Gemini writes a whodunit for you to solve. You get a short story, 3–4 suspects and 6–8 pieces of evidence: chats, CCTV stills, photos, call logs and notes. Read through it, take up to 3 hints, then accuse a suspect. Once you've accused, the game tells you if you were right and explains how the evidence proves who did it.

Every mystery gets its own link (`/mystery/:id`), so you can share it with friends.

## Features

- **AI-generated cases.** One Gemini call returns the whole mystery as JSON. The server checks it before saving (see [Validation](#validation)).
- **Five evidence viewers**, all built in React from JSON:
  - **Chat:** a phone-style message thread
  - **CCTV:** a grainy camera frame with a REC dot and a timestamp
  - **Photo:** a Polaroid card with a written description of the scene
  - **Call log:** incoming, outgoing and missed calls
  - **Note:** a handwritten note on paper
- **Hints one at a time**, up to 3, each a bit more specific than the last.
- **Accuse and reveal:** after you accuse, the game shows the real culprit, explains the solution and highlights the key evidence.
- **The answer stays on the server.** The browser doesn't receive the solution or unrevealed hints until you accuse.
- **Rate limit:** each IP can create 5 mysteries per hour, which protects the free Gemini quota.
- Dark detective theme. Below 600 px the layout switches to a single column for phones.

## Tech stack

| Part | Technology |
| --- | --- |
| Frontend | React, Vite, React Router, plain CSS |
| Backend | Node.js, Express 5 |
| Database | MongoDB Atlas with Mongoose |
| AI | Google Gemini via `@google/genai` |
| Hosting | One Render web service. Express serves both the API and the built React app |

## Project structure

```
.
├── package.json            # root scripts: build, start, dev:server, dev:client
├── SPEC.md                 # product & technical spec
├── server/
│   ├── index.js            # Express app; serves client/dist in production
│   ├── gemini.js           # generateMystery(): prompt, parse, validate, retry
│   ├── models/Mystery.js   # Mongoose model
│   ├── routes/mysteries.js # API routes
│   └── scripts/try-gemini.js
└── client/
    ├── index.html
    ├── vite.config.js      # proxies /api to localhost:3001 in dev
    └── src/
        ├── main.jsx, App.jsx, api.js, styles.css
        ├── pages/          # Home, MysteryPage
        └── evidence/       # Chat, Cctv, Photo, CallLog, Note viewers
```

## Getting started

### Prerequisites

- Node.js 20 or newer
- A MongoDB connection string. A free [MongoDB Atlas](https://www.mongodb.com/atlas) M0 cluster works.
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### 1. Install

```bash
git clone https://github.com/DevapriyaG/AI_mystery_room_project.git
cd AI_mystery_room_project
npm install --prefix server
npm install --prefix client
```

### 2. Configure

Create a `.env` file in the project root. It is listed in `.gitignore`, so don't commit it.

```env
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.5-flash-lite
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/

# Optional
# PORT=3001
# DNS_SERVERS=8.8.8.8,1.1.1.1   # set this if MongoDB fails locally with "querySrv ETIMEOUT"
```

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes | Google AI Studio API key |
| `GEMINI_MODEL` | Yes | Gemini model name. If your key gets quota or permission errors, try another model. |
| `MONGODB_URI` | Yes | MongoDB connection string. Data goes into the `mystery-room` database. |
| `PORT` | No | Server port. Defaults to `3001`; Render sets it automatically. |
| `DNS_SERVERS` | No | Comma-separated DNS servers, for networks where SRV lookups fail |

### 3. Run in development

Run the server and client in two terminals:

```bash
npm run dev:server   # Express on http://localhost:3001 (auto-restarts on change)
npm run dev:client   # Vite on http://localhost:5173, proxies /api to the server
```

Open http://localhost:5173.

### Try Gemini from the command line

To generate one mystery and print a summary, without the database:

```bash
node server/scripts/try-gemini.js "A necklace vanishes at a wedding"
node server/scripts/try-gemini.js "Exam papers leaked from the staff room" --json   # print the full JSON
```

### Production build

```bash
npm run build   # installs dependencies and builds client/dist
npm start       # serves the API and the built app from one port
```

## API

All responses are JSON. Errors look like `{ "error": "message" }`.

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| `GET` | `/api/health` | — | `{ ok: true }` |
| `POST` | `/api/mysteries` | `{ scenario }` (max 500 chars) | `{ id }`. Usually takes 10–40 s. Limited to 5 per IP per hour. |
| `GET` | `/api/mysteries/:id` | — | The mystery without the solution or unrevealed hints. Once someone has accused, it includes the solution. |
| `POST` | `/api/mysteries/:id/hint` | — | `{ hints: [...] }`: every hint revealed so far. Returns `400` after 3. |
| `POST` | `/api/mysteries/:id/accuse` | `{ suspectId }` | `{ correct, culprit, explanation, keyEvidenceIds }`. Returns `409` if this mystery has already been accused. |

## Validation

The server checks every mystery Gemini returns. If a check fails, it calls Gemini once more. If the second attempt also fails, the player sees a friendly error. The checks are:

- 3–4 suspects and 6–8 evidence items, and every ID is unique.
- All five evidence types appear at least once.
- Every call direction is `incoming`, `outgoing` or `missed`.
- There are exactly 3 hints.
- The solution's culprit is one of the suspects, and every piece of key evidence exists.
- The culprit's name doesn't appear in the story, in any evidence title, or in the first hint. If an evidence title names a suspect, the server swaps it for a neutral title instead of rejecting the mystery.

## Deploying to Render

1. Push the repo to GitHub.
2. In MongoDB Atlas, go to **Network Access** and allow `0.0.0.0/0`. Render's free tier doesn't have a fixed IP address.
3. On Render, choose **New → Web Service** and connect the repo.
   - **Build command:** `npm run build`
   - **Start command:** `npm start`
   - **Instance type:** Free
4. Add `GEMINI_API_KEY`, `GEMINI_MODEL` and `MONGODB_URI` as environment variables.
5. Deploy, then open the `.onrender.com` URL.

> The free tier goes to sleep when nobody uses it, so the first load afterwards can take about a minute. Open the site a few minutes before a demo.

## Credits

Created by [DevapriyaG](https://github.com/DevapriyaG).
