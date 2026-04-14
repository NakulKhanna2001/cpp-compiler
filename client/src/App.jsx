import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import "./App.css";

const LANGUAGES = [
  { label: "C++ 17",   value: "cpp17",   ext: "cpp", group: "C/C++" },
  { label: "C++ 14",   value: "cpp14",   ext: "cpp", group: "C/C++" },
  { label: "C",        value: "c",       ext: "c",   group: "C/C++" },
  { label: "Python 3", value: "python3", ext: "py",  group: "Python" },
  { label: "Python 2", value: "python2", ext: "py",  group: "Python" },
  { label: "Java",     value: "java",    ext: "java",group: "JVM"   },
  { label: "Kotlin",   value: "kotlin",  ext: "kt",  group: "JVM"   },
  { label: "Scala",    value: "scala",   ext: "scala",group: "JVM"  },
  { label: "Node.js",  value: "js",      ext: "js",  group: "Web"   },
  { label: "PHP",      value: "php",     ext: "php", group: "Web"   },
  { label: "Go",       value: "go",      ext: "go",  group: "Systems"},
  { label: "Rust",     value: "rust",    ext: "rs",  group: "Systems"},
  { label: "Swift",    value: "swift",   ext: "swift",group: "Mobile"},
  { label: "C#",       value: "csharp",  ext: "cs",  group: "Microsoft"},
  { label: "Ruby",     value: "ruby",    ext: "rb",  group: "Scripting"},
  { label: "Bash",     value: "bash",    ext: "sh",  group: "Scripting"},
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
  base: "vs-dark",
  inherit: true,
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

// Group languages for the dropdown
const LANG_GROUPS = LANGUAGES.reduce((acc, lang) => {
  if (!acc[lang.group]) acc[lang.group] = [];
  acc[lang.group].push(lang);
  return acc;
}, {});

export default function App() {
  const [language,    setLanguage]    = useState("cpp17");
  const [code,        setCode]        = useState(DEFAULT_CODE["cpp17"]);
  const [stdin,       setStdin]       = useState("");
  const [output,      setOutput]      = useState("");
  const [meta,        setMeta]        = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [status,      setStatus]      = useState("idle");
  const [cursorPos,   setCursorPos]   = useState({ line: 1, col: 1 });
  const [activePanel, setActivePanel] = useState("input");
  const outputRef = useRef(null);
  const editorRef = useRef(null);

  function handleEditorMount(editor, monaco) {
    editorRef.current = editor;
    monaco.editor.defineTheme("forge", FORGE_THEME);
    monaco.editor.setTheme("forge");
    editor.onDidChangeCursorPosition(e => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column });
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, handleRun);
  }

  function handleLanguageChange(e) {
    const lang = e.target.value;
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang] || "");
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

  // Scroll output to top when new output arrives
  useEffect(() => {
    if (outputRef.current && output) {
      outputRef.current.scrollTop = 0;
    }
  }, [output]);

  const currentLang = LANGUAGES.find(l => l.value === language);
  const lineCount   = code.split("\n").length;

  return (
    <div className="app">
      <div className="scanlines" aria-hidden="true" />

      {/* ── Header ── */}
      <header className="header">
        <div className="header-left">
          <div className="logo-mark">
            <span className="logo-bracket">{"{{"}</span>
            <span className="logo-text">FORGE</span>
            <span className="logo-bracket">{"}}"}</span>
          </div>
          <div className="header-divider" />
          {/* Language dropdown grouped */}
          <div className="lang-selector">
            <select
              className="lang-dropdown"
              value={language}
              onChange={handleLanguageChange}
            >
              {Object.entries(LANG_GROUPS).map(([group, langs]) => (
                <optgroup key={group} label={group}>
                  {langs.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <span className="lang-arrow">▾</span>
          </div>
        </div>

        <div className="header-right">
          <span className="shortcut-hint">⌘ + Enter</span>
          <button
            className={`run-btn ${loading ? "running" : ""}`}
            onClick={handleRun}
            disabled={loading}
          >
            <RunIcon spinning={loading} />
            <span>{loading ? "Running" : "Run"}</span>
            {loading && (
              <span className="run-dots">
                <span>.</span><span>.</span><span>.</span>
              </span>
            )}
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
            <span className="line-count">{lineCount} lines</span>
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

        {/* Right column — Input + Output stacked */}
        <div className="right-column">

          {/* Input box */}
          <div className="side-panel">
            <div className="side-panel-header">
              <span className="side-panel-label">
                <span className="side-panel-icon">→</span> stdin
              </span>
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

          {/* Output box */}
          <div className="side-panel side-panel-output">
            <div className="side-panel-header">
              <span className="side-panel-label">
                <span className={`side-panel-icon ${status === "success" ? "icon-ok" : status === "error" ? "icon-err" : ""}`}>
                  {status === "success" ? "✓" : status === "error" ? "✗" : "◎"}
                </span>
                stdout
              </span>
              {meta && (
                <div className="output-meta">
                  <span className="meta-chip">⏱ {meta.cpuTime}s</span>
                  <span className="meta-chip">⬡ {meta.memory} KB</span>
                </div>
              )}
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
        </div>
      </footer>
    </div>
  );
}
