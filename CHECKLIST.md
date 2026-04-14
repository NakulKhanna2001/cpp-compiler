# C++ Online Compiler — Build Checklist

## What We're Building
A web-based C++ compiler where you can write code, provide custom input,
run it, and see output — powered by Judge0 API on the backend.

---

## Stack
| Layer     | Technology          |
|-----------|---------------------|
| Frontend  | React + Monaco Editor (VS Code editor in browser) |
| Backend   | Node.js + Express   |
| Execution | Judge0 API (RapidAPI free tier) |
| Styling   | Tailwind CSS        |

---

## Checklist

### 1. Project Setup
- [ ] Initialize React frontend (`create-react-app` or Vite)
- [ ] Initialize Node.js backend (`express`)
- [ ] Set up folder structure (`/client`, `/server`)
- [ ] Add `.env` for Judge0 API key

### 2. Code Editor (Frontend)
- [ ] Install Monaco Editor (`@monaco-editor/react`)
- [ ] Set language to `cpp`
- [ ] Add syntax highlighting + dark theme
- [ ] Set default starter code (Hello World template)
- [ ] Add font size / theme toggle

### 3. Input / Output Panel (Frontend)
- [ ] Text area for **custom stdin** input
- [ ] Output panel to show **stdout**
- [ ] Separate panel for **compile errors / stderr**
- [ ] Show **execution time** and **memory used**
- [ ] Color-coded verdict (green = OK, red = error)

### 4. Run Button (Frontend → Backend)
- [ ] "Run" button sends code + stdin to backend
- [ ] Show loading spinner while executing
- [ ] Handle timeout gracefully (show TLE message)

### 5. Backend API
- [ ] `POST /run` endpoint receives `{ code, stdin }`
- [ ] Forward to Judge0 API with C++ language ID (`54` = C++17)
- [ ] Poll Judge0 until result is ready
- [ ] Return `{ stdout, stderr, time, memory, status }`
- [ ] Add rate limiting (prevent abuse)

### 6. Judge0 Integration
- [ ] Sign up at RapidAPI → get Judge0 API key
- [ ] Test API with Postman/curl
- [ ] Handle all verdict codes:
  - `3` = Accepted
  - `4` = Wrong Answer
  - `5` = Time Limit Exceeded
  - `6` = Compilation Error
  - `11` = Runtime Error

### 7. Extra Features (Nice to Have)
- [ ] Save/share code via URL (encode in base64)
- [ ] Multiple language support (Python, Java, etc.)
- [ ] Code templates dropdown (sorting, graphs, etc.)
- [ ] Keyboard shortcut to run (`Ctrl+Enter`)
- [ ] Copy output button

### 8. Deployment
- [ ] Deploy frontend on **Vercel**
- [ ] Deploy backend on **Render** (free tier)
- [ ] Add environment variables in production
- [ ] Test end-to-end on live URL

---

## API Keys Needed
- [ ] Judge0 via RapidAPI → https://rapidapi.com/judge0-official/api/judge0-ce

---

## Folder Structure
```
cpp-compiler/
├── client/               # React frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Editor.jsx
│   │   │   ├── InputPanel.jsx
│   │   │   └── OutputPanel.jsx
│   └── package.json
├── server/               # Node backend
│   ├── index.js
│   ├── routes/run.js
│   └── package.json
└── CHECKLIST.md
```

---

## Order of Building
1. Get Judge0 API key and test it manually
2. Build the backend `/run` endpoint
3. Build the editor UI
4. Connect frontend to backend
5. Polish UI + add extra features
6. Deploy
```
