import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import "./App.css";

const LANGUAGES = [
  { label: "C++ 17", value: "cpp17", ext: "cpp" },
  { label: "C",      value: "c",     ext: "c"   },
  { label: "Python", value: "python", ext: "py" },
  { label: "Java",   value: "java",  ext: "java"},
  { label: "Node.js",value: "js",    ext: "js"  },
];

const MONACO_LANG = {
  cpp17: "cpp", c: "c", python: "python", java: "java", js: "javascript",
};

const DEFAULT_CODE = {
  cpp17: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    cout << "Hello, World!" << endl;
    return 0;
}`,
  c: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
  python: `import sys
input = sys.stdin.readline

print("Hello, World!")`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  js: `const lines = require('fs').readFileSync('/dev/stdin','utf8').split('\\n');
console.log("Hello, World!");`,
};

const FORGE_THEME = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment",      foreground: "4a5568", fontStyle: "italic" },
    { token: "keyword",      foreground: "f97316", fontStyle: "bold"   },
    { token: "string",       foreground: "68d391"  },
    { token: "number",       foreground: "fbbf24"  },
    { token: "type",         foreground: "93c5fd"  },
    { token: "function",     foreground: "c4b5fd"  },
    { token: "operator",     foreground: "fb923c"  },
  ],
  colors: {
    "editor.background":           "#0d0d0f",
    "editor.foreground":           "#e2e8f0",
    "editor.lineHighlightBackground": "#1a1a20",
    "editor.selectionBackground":  "#f9731630",
    "editorCursor.foreground":     "#f97316",
    "editorLineNumber.foreground": "#2d2d3a",
    "editorLineNumber.activeForeground": "#f97316",
    "editorIndentGuide.background1": "#1e1e2a",
    "editorGutter.background":     "#0d0d0f",
    "scrollbarSlider.background":  "#2a2a3a",
    "scrollbarSlider.hoverBackground": "#f9731640",
  },
};

function RunIcon({ spinning }) {
  if (spinning) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="spin-icon">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="31.4" strokeDashoffset="10"/>
      </svg>
    );
  }
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
      <path d="M1 1.5L11 7L1 12.5V1.5Z"/>
    </svg>
  );
}

export default function App() {
  const [language,  setLanguage]  = useState("cpp17");
  const [code,      setCode]      = useState(DEFAULT_CODE["cpp17"]);
  const [stdin,     setStdin]     = useState("");
  const [output,    setOutput]    = useState("");
  const [meta,      setMeta]      = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [status,    setStatus]    = useState("idle");
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [activePanel, setActivePanel] = useState("input");
  const editorRef = useRef(null);

  function handleEditorMount(editor, monaco) {
    editorRef.current = editor;
    monaco.editor.defineTheme("forge", FORGE_THEME);
    monaco.editor.setTheme("forge");
    editor.onDidChangeCursorPosition(e => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column });
    });
    // Ctrl+Enter to run
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, handleRun);
  }

  function handleLanguageChange(lang) {
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang]);
    setOutput("");
    setMeta(null);
    setStatus("idle");
  }

  async function handleRun() {
    setLoading(true);
    setOutput("");
    setMeta(null);
    setStatus("idle");
    setActivePanel("output");

    try {
      const res = await axios.post("http://localhost:3001/run", { code, stdin, language });
      const { output, memory, cpuTime, isSuccess, isCompiled } = res.data;
      setOutput(output || "(no output)");
      setMeta({ memory, cpuTime });
      setStatus(!isCompiled || !isSuccess ? "error" : "success");
    } catch (err) {
      setOutput(err.response?.data?.error || "Server error. Is the backend running?");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  const currentLang = LANGUAGES.find(l => l.value === language);
  const lineCount = code.split("\n").length;

  return (
    <div className="app">
      {/* Scanline overlay */}
      <div className="scanlines" aria-hidden="true" />

      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo-mark">
            <span className="logo-bracket">{"{{"}</span>
            <span className="logo-text">FORGE</span>
            <span className="logo-bracket">{"}}"}</span>
          </div>
          <div className="header-divider" />
          <div className="lang-tabs">
            {LANGUAGES.map(l => (
              <button
                key={l.value}
                className={`lang-tab ${language === l.value ? "active" : ""}`}
                onClick={() => handleLanguageChange(l.value)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="header-right">
          <div className="shortcut-hint">⌘ + Enter to run</div>
          <button
            className={`run-btn ${loading ? "running" : ""}`}
            onClick={handleRun}
            disabled={loading}
          >
            <RunIcon spinning={loading} />
            <span>{loading ? "Running" : "Run"}</span>
            {loading && <span className="run-dots"><span>.</span><span>.</span><span>.</span></span>}
          </button>
        </div>
      </header>

      {/* Main workspace */}
      <div className="workspace">
        {/* Editor column */}
        <div className="editor-column">
          <div className="editor-tab-bar">
            <div className="editor-tab active">
              <span className="tab-dot" />
              main.{currentLang?.ext}
            </div>
            <div className="editor-tab-spacer" />
            <span className="line-count">{lineCount} lines</span>
          </div>
          <div className="editor-wrap">
            <Editor
              height="100%"
              language={MONACO_LANG[language]}
              value={code}
              onChange={val => setCode(val || "")}
              theme="forge"
              onMount={handleEditorMount}
              options={{
                fontSize: 14,
                lineHeight: 22,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
                fontLigatures: true,
                tabSize: 4,
                wordWrap: "off",
                renderLineHighlight: "line",
                smoothScrolling: true,
                cursorBlinking: "phase",
                cursorSmoothCaretAnimation: "on",
                padding: { top: 16, bottom: 16 },
              }}
            />
          </div>
        </div>

        {/* Right column */}
        <div className="right-column">
          {/* Panel switcher */}
          <div className="panel-tabs">
            <button
              className={`panel-tab ${activePanel === "input" ? "active" : ""}`}
              onClick={() => setActivePanel("input")}
            >
              <span className="panel-tab-icon">→</span> stdin
            </button>
            <button
              className={`panel-tab ${activePanel === "output" ? "active" : ""} ${status === "error" ? "tab-error" : ""} ${status === "success" ? "tab-success" : ""}`}
              onClick={() => setActivePanel("output")}
            >
              <span className="panel-tab-icon">
                {status === "success" ? "✓" : status === "error" ? "✗" : "◎"}
              </span>
              stdout
            </button>
          </div>

          {/* Input panel */}
          <div className={`panel ${activePanel === "input" ? "panel-visible" : "panel-hidden"}`}>
            <textarea
              className="panel-textarea"
              placeholder={"// stdin\n// Enter program input here..."}
              value={stdin}
              onChange={e => setStdin(e.target.value)}
              spellCheck={false}
            />
          </div>

          {/* Output panel */}
          <div className={`panel output-panel ${activePanel === "output" ? "panel-visible" : "panel-hidden"}`}>
            {loading ? (
              <div className="output-loading">
                <div className="loading-bar">
                  <div className="loading-fill" />
                </div>
                <span className="loading-text">Compiling and executing...</span>
              </div>
            ) : output ? (
              <pre className={`output-pre ${status === "error" ? "output-error" : "output-ok"}`}>
                {output}
              </pre>
            ) : (
              <div className="output-empty">
                <span className="empty-icon">▶</span>
                <span>Run your code to see output</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <footer className="statusbar">
        <div className="statusbar-left">
          <span className="status-item status-lang">
            <span className="status-dot" />
            {currentLang?.label}
          </span>
          <span className="status-sep">|</span>
          <span className="status-item">
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          {meta && (
            <>
              <span className="status-sep">|</span>
              <span className="status-item status-time">⏱ {meta.cpuTime}s</span>
              <span className="status-sep">|</span>
              <span className="status-item">⬡ {meta.memory} KB</span>
            </>
          )}
        </div>
        <div className="statusbar-right">
          {status === "success" && <span className="status-verdict ok">● ACCEPTED</span>}
          {status === "error"   && <span className="status-verdict err">● ERROR</span>}
          {status === "idle"    && <span className="status-item dim">UTF-8 · LF</span>}
        </div>
      </footer>
    </div>
  );
}
