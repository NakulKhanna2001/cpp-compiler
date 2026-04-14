import { useState, useRef, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import "./App.css";

// ── Language Dropdown ─────────────────────────────────────────────────────────
function LangDropdown({ languages, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = languages.find(l => l.value === value);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const groups = languages.reduce((acc, lang) => {
    if (!acc[lang.group]) acc[lang.group] = [];
    acc[lang.group].push(lang);
    return acc;
  }, {});

  return (
    <div className="lang-dd-root" ref={ref}>
      <button className="lang-dd-trigger" onClick={() => setOpen(o => !o)}>
        <span className="lang-dd-current">{current?.label}</span>
        <svg className={`lang-dd-chevron ${open ? "open" : ""}`} width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="lang-dd-menu">
          {Object.entries(groups).map(([group, langs]) => (
            <div key={group} className="lang-dd-group">
              <div className="lang-dd-group-label">{group}</div>
              {langs.map(lang => (
                <button
                  key={lang.value}
                  className={`lang-dd-item ${lang.value === value ? "selected" : ""}`}
                  onClick={() => { onChange(lang.value); setOpen(false); }}
                >
                  <span className="lang-dd-check">
                    {lang.value === value && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  {lang.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Keyboard Shortcuts Modal ──────────────────────────────────────────────────
function ShortcutsModal({ onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const shortcuts = [
    { keys: ["⌘", "Enter"],  desc: "Run code" },
    { keys: ["⌘", "S"],      desc: "Save code to localStorage" },
    { keys: ["⌘", "K"],      desc: "Clear output & input" },
    { keys: ["⌘", "+"],      desc: "Increase font size" },
    { keys: ["⌘", "−"],      desc: "Decrease font size" },
    { keys: ["⌘", "⇧", "C"], desc: "Copy output" },
    { keys: ["⌘", "⇧", "S"], desc: "Share code (copy URL)" },
    { keys: ["?"],            desc: "Open this panel" },
    { keys: ["Esc"],          desc: "Close this panel" },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Keyboard Shortcuts</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {shortcuts.map((s, i) => (
            <div key={i} className="shortcut-row">
              <span className="shortcut-desc">{s.desc}</span>
              <span className="shortcut-keys">
                {s.keys.map((k, j) => (
                  <span key={j}><kbd>{k}</kbd>{j < s.keys.length - 1 && <span className="plus">+</span>}</span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────
const LANGUAGES = [
  { label: "C++ 17",   value: "cpp17",   ext: "cpp",   group: "C/C++"      },
  { label: "C++ 14",   value: "cpp14",   ext: "cpp",   group: "C/C++"      },
  { label: "C",        value: "c",       ext: "c",     group: "C/C++"      },
  { label: "Python 3", value: "python3", ext: "py",    group: "Python"     },
  { label: "Python 2", value: "python2", ext: "py",    group: "Python"     },
  { label: "Java",     value: "java",    ext: "java",  group: "JVM"        },
  { label: "Kotlin",   value: "kotlin",  ext: "kt",    group: "JVM"        },
  { label: "Scala",    value: "scala",   ext: "scala", group: "JVM"        },
  { label: "Node.js",  value: "js",      ext: "js",    group: "Web"        },
  { label: "PHP",      value: "php",     ext: "php",   group: "Web"        },
  { label: "Go",       value: "go",      ext: "go",    group: "Systems"    },
  { label: "Rust",     value: "rust",    ext: "rs",    group: "Systems"    },
  { label: "Swift",    value: "swift",   ext: "swift", group: "Mobile"     },
  { label: "C#",       value: "csharp",  ext: "cs",    group: "Microsoft"  },
  { label: "Ruby",     value: "ruby",    ext: "rb",    group: "Scripting"  },
  { label: "Bash",     value: "bash",    ext: "sh",    group: "Scripting"  },
];

const MONACO_LANG = {
  cpp17: "cpp", cpp14: "cpp", c: "c",
  python3: "python", python2: "python",
  java: "java", kotlin: "kotlin", scala: "scala",
  js: "javascript", php: "php",
  go: "go", rust: "rust",
  swift: "swift", csharp: "csharp",
  ruby: "ruby", bash: "shell",
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
  cpp14: `#include <bits/stdc++.h>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
  c: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
  python3: `import sys
input = sys.stdin.readline

print("Hello, World!")`,
  python2: `print "Hello, World!"`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  kotlin: `fun main() {
    println("Hello, World!")
}`,
  scala: `object Main extends App {
    println("Hello, World!")
}`,
  js: `process.stdin.resume();
process.stdin.setEncoding('utf8');
let input = '';
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
    console.log("Hello, World!");
});`,
  php: `<?php
echo "Hello, World!\\n";
?>`,
  go: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`,
  rust: `use std::io::{self, BufRead};

fn main() {
    println!("Hello, World!");
}`,
  swift: `import Foundation
print("Hello, World!")`,
  csharp: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
    }
}`,
  ruby: `puts "Hello, World!"`,
  bash: `#!/bin/bash
echo "Hello, World!"`,
};

const FORGE_THEME = {
  base: "vs-dark", inherit: true,
  rules: [
    { token: "comment",  foreground: "4a5568", fontStyle: "italic" },
    { token: "keyword",  foreground: "f97316", fontStyle: "bold"   },
    { token: "string",   foreground: "68d391" },
    { token: "number",   foreground: "fbbf24" },
    { token: "type",     foreground: "93c5fd" },
    { token: "function", foreground: "c4b5fd" },
    { token: "operator", foreground: "fb923c" },
  ],
  colors: {
    "editor.background":              "#0d0d0f",
    "editor.foreground":              "#e2e8f0",
    "editor.lineHighlightBackground": "#1a1a20",
    "editor.selectionBackground":     "#f9731630",
    "editorCursor.foreground":        "#f97316",
    "editorLineNumber.foreground":    "#2d2d3a",
    "editorLineNumber.activeForeground": "#f97316",
    "editorGutter.background":        "#0d0d0f",
    "scrollbarSlider.background":     "#2a2a3a",
    "scrollbarSlider.hoverBackground":"#f9731640",
  },
};

function RunIcon({ spinning }) {
  if (spinning) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="spin-icon">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeDasharray="31.4" strokeDashoffset="10"/>
      </svg>
    );
  }
  return (
    <svg width="11" height="13" viewBox="0 0 11 13" fill="currentColor">
      <path d="M1 1L10 6.5L1 12V1Z"/>
    </svg>
  );
}

// ── localStorage helpers ──────────────────────────────────────────────────────
function loadState(lang) {
  try {
    const saved = localStorage.getItem(`forge_code_${lang}`);
    return saved || null;
  } catch { return null; }
}
function saveState(lang, code) {
  try { localStorage.setItem(`forge_code_${lang}`, code); } catch {}
}

// ── Share URL helpers ─────────────────────────────────────────────────────────
function encodeShare(language, code, stdin) {
  const payload = JSON.stringify({ language, code, stdin });
  return btoa(unescape(encodeURIComponent(payload)));
}
function decodeShare(hash) {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(hash))));
  } catch { return null; }
}

// ── Error line parser ─────────────────────────────────────────────────────────
function parseErrorLine(output) {
  // Matches patterns like ":5:" or "line 5" or "at line 5"
  const patterns = [
    /(?:^|\s):(\d+):/m,
    /\bline[:\s]+(\d+)/im,
    /error.*?:(\d+):/im,
    /\.cpp:(\d+):/im,
    /\.c:(\d+):/im,
  ];
  for (const re of patterns) {
    const m = output.match(re);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [language,    setLanguage]    = useState("cpp17");
  const [code,        setCode]        = useState(() => loadState("cpp17") || DEFAULT_CODE["cpp17"]);
  const [stdin,       setStdin]       = useState("");
  const [output,      setOutput]      = useState("");
  const [meta,        setMeta]        = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [status,      setStatus]      = useState("idle");
  const [cursorPos,   setCursorPos]   = useState({ line: 1, col: 1 });
  const [fontSize,    setFontSize]    = useState(14);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [toast,       setToast]       = useState(null);
  const outputRef  = useRef(null);
  const editorRef  = useRef(null);
  const monacoRef  = useRef(null);
  const decorRef   = useRef([]);

  // ── Load from share URL on mount ──
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const data = decodeShare(hash);
      if (data && data.language && data.code) {
        setLanguage(data.language);
        setCode(data.code);
        if (data.stdin) setStdin(data.stdin);
        showToast("Code loaded from shared URL");
        window.location.hash = "";
      }
    }
  }, []);

  // ── Toast helper ──
  function showToast(msg, type = "info") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }

  // ── Editor mount ──
  function handleEditorMount(editor, monaco) {
    editorRef.current  = editor;
    monacoRef.current  = monaco;
    monaco.editor.defineTheme("forge", FORGE_THEME);
    monaco.editor.setTheme("forge");
    editor.onDidChangeCursorPosition(e => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column });
    });
    // Shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,       () => handleRun());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,        () => handleSave());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,        () => handleClear());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Equal,       () => setFontSize(f => Math.min(f + 1, 24)));
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Minus,       () => setFontSize(f => Math.max(f - 1, 10)));
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyC, () => handleCopyOutput());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS, () => handleShare());
  }

  // ── Language change ──
  function handleLanguageChange(lang) {
    saveState(language, code); // save current before switching
    const saved = loadState(lang);
    setLanguage(lang);
    setCode(saved || DEFAULT_CODE[lang] || "");
    setOutput("");
    setMeta(null);
    setStatus("idle");
    clearErrorDecorations();
  }

  // ── Run ──
  async function handleRun() {
    setLoading(true);
    setOutput("");
    setMeta(null);
    setStatus("idle");
    clearErrorDecorations();

    try {
      const res = await axios.post("http://localhost:3001/run", { code, stdin, language });
      const { output, memory, cpuTime, isSuccess, isCompiled } = res.data;
      setOutput(output || "(no output)");
      setMeta({ memory, cpuTime });
      const hasError = !isCompiled || !isSuccess;
      setStatus(hasError ? "error" : "success");
      if (hasError) highlightErrorLine(output);
    } catch (err) {
      setOutput(err.response?.data?.error || "Server error. Is the backend running?");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  // ── Save ──
  function handleSave() {
    saveState(language, code);
    showToast("Code saved", "success");
  }

  // ── Clear ──
  function handleClear() {
    setOutput("");
    setStdin("");
    setMeta(null);
    setStatus("idle");
    clearErrorDecorations();
    showToast("Cleared");
  }

  // ── Copy output ──
  function handleCopyOutput() {
    if (!output) return showToast("Nothing to copy", "warn");
    navigator.clipboard.writeText(output).then(() => showToast("Output copied!", "success"));
  }

  // ── Share ──
  function handleShare() {
    const hash = encodeShare(language, code, stdin);
    const url  = `${window.location.origin}${window.location.pathname}#${hash}`;
    navigator.clipboard.writeText(url).then(() => showToast("Share URL copied!", "success"));
  }

  // ── Font size ──
  function changeFontSize(delta) {
    setFontSize(f => Math.min(24, Math.max(10, f + delta)));
  }

  // ── Error line highlighting ──
  function highlightErrorLine(outputText) {
    if (!editorRef.current || !monacoRef.current) return;
    const line = parseErrorLine(outputText);
    if (!line) return;
    const monaco = monacoRef.current;
    const newDec = editorRef.current.deltaDecorations(decorRef.current, [{
      range: new monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        className: "error-line-highlight",
        glyphMarginClassName: "error-glyph",
        overviewRuler: { color: "#f87171", position: monaco.editor.OverviewRulerLane.Right },
      },
    }]);
    decorRef.current = newDec;
    editorRef.current.revealLineInCenter(line);
  }

  function clearErrorDecorations() {
    if (editorRef.current) {
      decorRef.current = editorRef.current.deltaDecorations(decorRef.current, []);
    }
  }

  // ── Auto-save on code change ──
  useEffect(() => {
    const timer = setTimeout(() => saveState(language, code), 1000);
    return () => clearTimeout(timer);
  }, [code, language]);

  // ── Scroll output to top ──
  useEffect(() => {
    if (outputRef.current && output) outputRef.current.scrollTop = 0;
  }, [output]);

  // ── Global keyboard shortcuts (outside editor) ──
  useEffect(() => {
    function onKey(e) {
      if (e.key === "?") setShowShortcuts(s => !s);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const currentLang = LANGUAGES.find(l => l.value === language);
  const lineCount   = code.split("\n").length;

  return (
    <div className="app">
      <div className="scanlines" aria-hidden="true" />

      {/* ── Shortcuts modal ── */}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

      {/* ── Toast ── */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
      )}

      {/* ── Header ── */}
      <header className="header">
        <div className="header-left">
          <div className="logo-mark">
            <span className="logo-bracket">{"{{"}</span>
            <span className="logo-text">FORGE</span>
            <span className="logo-bracket">{"}}"}</span>
          </div>
          <div className="header-divider" />
          <LangDropdown languages={LANGUAGES} value={language} onChange={handleLanguageChange} />
        </div>

        <div className="header-right">
          {/* Font size */}
          <div className="font-ctrl">
            <button className="icon-btn" title="Decrease font (⌘−)" onClick={() => changeFontSize(-1)}>A−</button>
            <span className="font-size-label">{fontSize}</span>
            <button className="icon-btn" title="Increase font (⌘+)" onClick={() => changeFontSize(+1)}>A+</button>
          </div>
          <div className="header-divider" />
          {/* Actions */}
          <button className="icon-btn" title="Clear (⌘K)" onClick={handleClear}>⌫ Clear</button>
          <button className="icon-btn" title="Copy output (⌘⇧C)" onClick={handleCopyOutput}>⎘ Copy</button>
          <button className="icon-btn" title="Share (⌘⇧S)" onClick={handleShare}>⤴ Share</button>
          <button className="icon-btn" title="Shortcuts (?)" onClick={() => setShowShortcuts(true)}>?</button>
          <div className="header-divider" />
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

      {/* ── Workspace ── */}
      <div className="workspace">
        {/* Editor */}
        <div className="editor-column">
          <div className="editor-tab-bar">
            <div className="editor-tab active">
              <span className="tab-dot" />
              main.{currentLang?.ext}
            </div>
            <div className="editor-tab-spacer" />
            <span className="line-count">{lineCount} lines · {fontSize}px</span>
          </div>
          <div className="editor-wrap">
            <Editor
              height="100%"
              language={MONACO_LANG[language] || "plaintext"}
              value={code}
              onChange={val => setCode(val || "")}
              theme="forge"
              onMount={handleEditorMount}
              options={{
                fontSize,
                lineHeight: Math.round(fontSize * 1.6),
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
                glyphMargin: true,
                padding: { top: 16, bottom: 16 },
              }}
            />
          </div>
        </div>

        {/* Right column */}
        <div className="right-column">
          {/* Input */}
          <div className="side-panel">
            <div className="side-panel-header">
              <span className="side-panel-label">
                <span className="side-panel-icon">→</span> stdin
              </span>
              <button className="panel-action-btn" onClick={() => setStdin("")} title="Clear input">✕</button>
            </div>
            <div className="sublime-box">
              <div className="sublime-gutter">
                {(stdin || " ").split("\n").map((_, i) => (
                  <div key={i} className="gutter-line">{i + 1}</div>
                ))}
              </div>
              <textarea
                className="sublime-textarea"
                value={stdin}
                onChange={e => setStdin(e.target.value)}
                placeholder="enter input here..."
                spellCheck={false}
              />
            </div>
          </div>

          <div className="panel-resize-handle" />

          {/* Output */}
          <div className="side-panel side-panel-output">
            <div className="side-panel-header">
              <span className="side-panel-label">
                <span className={`side-panel-icon ${status === "success" ? "icon-ok" : status === "error" ? "icon-err" : ""}`}>
                  {status === "success" ? "✓" : status === "error" ? "✗" : "◎"}
                </span>
                stdout
              </span>
              <div className="panel-header-right">
                {meta && (
                  <div className="output-meta">
                    <span className="meta-chip">⏱ {meta.cpuTime}s</span>
                    <span className="meta-chip">⬡ {meta.memory} KB</span>
                  </div>
                )}
                {output && (
                  <button className="panel-action-btn" onClick={handleCopyOutput} title="Copy output">⎘</button>
                )}
              </div>
            </div>
            <div className="sublime-box sublime-box-output">
              {loading ? (
                <div className="output-loading-inline">
                  <div className="loading-bar"><div className="loading-fill" /></div>
                  <span className="loading-text">Compiling...</span>
                </div>
              ) : (
                <>
                  {output && (
                    <div className="sublime-gutter output-gutter">
                      {output.split("\n").map((_, i) => (
                        <div key={i} className="gutter-line">{i + 1}</div>
                      ))}
                    </div>
                  )}
                  <pre
                    ref={outputRef}
                    className={`sublime-output ${status === "error" ? "sublime-output-err" : status === "success" ? "sublime-output-ok" : "sublime-output-idle"}`}
                  >
                    {output || ""}
                  </pre>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Status bar ── */}
      <footer className="statusbar">
        <div className="statusbar-left">
          <span className="status-item status-lang">
            <span className="status-dot" />
            {currentLang?.label}
          </span>
          <span className="status-sep">|</span>
          <span className="status-item">Ln {cursorPos.line}, Col {cursorPos.col}</span>
          {meta && (
            <>
              <span className="status-sep">|</span>
              <span className="status-item" style={{ color: "var(--text2)" }}>⏱ {meta.cpuTime}s</span>
              <span className="status-sep">|</span>
              <span className="status-item">⬡ {meta.memory} KB</span>
            </>
          )}
        </div>
        <div className="statusbar-right">
          {status === "success" && <span className="status-verdict ok">● ACCEPTED</span>}
          {status === "error"   && <span className="status-verdict err">● ERROR</span>}
          {status === "idle"    && <span className="status-item dim">UTF-8 · LF</span>}
          <span className="status-sep">|</span>
          <button className="status-shortcuts-btn" onClick={() => setShowShortcuts(true)}>? shortcuts</button>
        </div>
      </footer>
    </div>
  );
}
