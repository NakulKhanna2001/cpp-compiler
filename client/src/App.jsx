import { useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import "./App.css";

const LANGUAGES = [
  { label: "C++ 17",  value: "cpp17"  },
  { label: "C",       value: "c"      },
  { label: "Python",  value: "python" },
  { label: "Java",    value: "java"   },
  { label: "Node.js", value: "js"     },
];

const MONACO_LANG = {
  cpp17:  "cpp",
  c:      "c",
  python: "python",
  java:   "java",
  js:     "javascript",
};

const DEFAULT_CODE = {
  cpp17: `#include <iostream>
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
  python: `print("Hello, World!")`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  js: `console.log("Hello, World!");`,
};

export default function App() {
  const [language, setLanguage] = useState("cpp17");
  const [code,     setCode]     = useState(DEFAULT_CODE["cpp17"]);
  const [stdin,    setStdin]    = useState("");
  const [output,   setOutput]   = useState("");
  const [meta,     setMeta]     = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [status,   setStatus]   = useState("idle");

  function handleLanguageChange(e) {
    const lang = e.target.value;
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

    try {
      const res = await axios.post("http://localhost:3001/run", {
        code, stdin, language,
      });

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

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <span className="logo">{"</>"}</span>
          <span className="title">CPP Compiler</span>
        </div>
        <div className="header-right">
          <select className="lang-select" value={language} onChange={handleLanguageChange}>
            {LANGUAGES.map(l => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
          <button className="run-btn" onClick={handleRun} disabled={loading}>
            {loading ? "⏳ Running..." : "▶  Run"}
          </button>
        </div>
      </header>

      <div className="main">
        <div className="editor-pane">
          <Editor
            height="100%"
            language={MONACO_LANG[language]}
            value={code}
            onChange={val => setCode(val || "")}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontFamily: "'Fira Code', 'Cascadia Code', monospace",
              fontLigatures: true,
              tabSize: 4,
              wordWrap: "on",
            }}
          />
        </div>

        <div className="right-pane">
          <div className="panel">
            <div className="panel-label">Input (stdin)</div>
            <textarea
              className="panel-textarea"
              placeholder="Enter input here..."
              value={stdin}
              onChange={e => setStdin(e.target.value)}
              spellCheck={false}
            />
          </div>

          <div className="panel output-panel">
            <div className="panel-label-row">
              <span className="panel-label">Output</span>
              {meta && (
                <span className="meta">
                  {meta.cpuTime}s &nbsp;|&nbsp; {meta.memory} KB
                </span>
              )}
              {status === "success" && <span className="badge badge-ok">✓ OK</span>}
              {status === "error"   && <span className="badge badge-err">✗ Error</span>}
            </div>
            <pre className={`output-pre ${status === "error" ? "output-error" : ""}`}>
              {loading ? "Running..." : output || "Output will appear here"}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
