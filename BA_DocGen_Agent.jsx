import { useState } from "react";

const SYSTEM_PROMPT = `You are a Business Analyst documentation assistant.

You will receive the text of a Project Proposal. Generate a Project Document with exactly these 4 sections and no other text:

1. Overview
[Copy the Project Overview section from the proposal faithfully. Use ONLY content from the proposal. Do not add or invent anything.]

2. Requirements
No information available.

3. Assumptions
No information available.

4. Out of Scope
No information available.

Use those exact section headers. Output the 4 sections only — no preamble, no explanation.`;

const SAMPLE = `01 · Project Overview

What we are building

NizamEats is a mobile-first food delivery aggregator platform that connects hungry customers in Hyderabad with a curated network of Indian fast food restaurants — from iconic biryani houses and dosa joints to chaat stalls, rolls, and kebab specialists. Customers browse menus, place orders, and track deliveries in real time, all within a single app.

The platform serves three audiences: customers who want quick, reliable access to Hyderabad's vibrant street food and fast food culture; restaurant partners who need a digital ordering and fulfilment channel; and delivery riders who manage their earnings and assignments through a companion app.

Key metrics: 30–45 min delivery · 500+ restaurant partners · 10,000+ menu items · iOS + Android

Strategic goals

Establish NizamEats as the go-to food delivery platform for Indian fast food and local eateries in Hyderabad by offering deeper restaurant variety and more reliable ETAs. Achieve 50,000 monthly active users and 200,000 monthly orders within 6 months of launch.`;

function parseSection(text, header, nextHeader) {
  const start = text.search(new RegExp(header, "i"));
  if (start === -1) return "";
  const after = text.slice(start);
  const headerEnd = after.indexOf("\n");
  const body = after.slice(headerEnd + 1);
  const end = nextHeader ? body.search(new RegExp(nextHeader, "i")) : body.length;
  return (end === -1 ? body : body.slice(0, end)).trim();
}

export default function App() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState("");
  const [error, setError] = useState("");
  const [rawResponse, setRawResponse] = useState("");
  const [showRaw, setShowRaw] = useState(false);
  const [step, setStep] = useState(0); // 0=idle 1=calling 2=done 3=error

  async function generate() {
    if (!input.trim()) {
      setError("Please paste your proposal text first, or click 'Load sample'.");
      return;
    }
    setLoading(true);
    setError("");
    setOverview("");
    setRawResponse("");
    setShowRaw(false);
    setStep(1);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: SYSTEM_PROMPT + "\n\nProject Proposal:\n---\n" + input.trim() + "\n---"
          }]
        })
      });

      const data = await res.json();
      setRawResponse(JSON.stringify(data, null, 2));

      if (!res.ok) {
        const msg = data?.error?.message || `HTTP ${res.status}`;
        setError(msg);
        setStep(3);
        return;
      }

      const text = data?.content?.[0]?.text || "";
      if (!text) {
        setError("API returned no text content. See raw response below.");
        setStep(3);
        return;
      }

      const ov = parseSection(text, "1\\.\\s*Overview", "2\\.\\s*Requirements");
      setOverview(ov || text);
      setStep(2);
    } catch (e) {
      setError(e.message || "Fetch failed");
      setStep(3);
    } finally {
      setLoading(false);
    }
  }

  function loadSample() {
    setInput(SAMPLE);
    setError("");
    setStep(0);
  }

  function copyDoc() {
    const out = `1. Overview\n${overview}\n\n2. Requirements\nNo information available.\n\n3. Assumptions\nNo information available.\n\n4. Out of Scope\nNo information available.`;
    navigator.clipboard.writeText(out);
  }

  const stepLabels = ["Idle", "Calling Claude API…", "Document ready", "Error"];
  const stepColors = ["var(--color-text-secondary)", "var(--color-text-warning)", "var(--color-text-success)", "var(--color-text-danger)"];

  return (
    <div style={{ padding: "1rem 0", fontFamily: "var(--font-sans)" }}>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 4 }}>
          BA Document Generator
        </div>
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          Paste a project proposal → AI extracts the Overview → all other sections set to "No information available."
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.25rem" }}>
        {["Input", "AI processing", "Output"].map((label, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 500,
              background: step === 0 && i === 0 ? "var(--color-background-info)"
                : step === 1 && i === 1 ? "var(--color-background-warning)"
                : step === 2 && i === 2 ? "var(--color-background-success)"
                : step === 3 && i === 1 ? "var(--color-background-danger)"
                : (step > i ? "var(--color-background-success)" : "var(--color-background-secondary)"),
              color: step === 0 && i === 0 ? "var(--color-text-info)"
                : step === 1 && i === 1 ? "var(--color-text-warning)"
                : step === 2 && i === 2 ? "var(--color-text-success)"
                : step === 3 && i === 1 ? "var(--color-text-danger)"
                : (step > i ? "var(--color-text-success)" : "var(--color-text-secondary)"),
              border: "0.5px solid var(--color-border-secondary)"
            }}>{i + 1}</div>
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{label}</span>
            {i < 2 && <span style={{ color: "var(--color-border-secondary)", fontSize: 14 }}>›</span>}
          </div>
        ))}
      </div>

      {/* Input card */}
      <div style={{
        background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)", overflow: "hidden", marginBottom: 12
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", background: "var(--color-background-secondary)",
          borderBottom: "0.5px solid var(--color-border-tertiary)"
        }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>
            Step 1 — Paste project proposal
          </span>
          <button onClick={loadSample} style={{
            fontSize: 11, padding: "3px 10px", cursor: "pointer",
            background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)",
            borderRadius: "var(--border-radius-md)", color: "var(--color-text-secondary)"
          }}>
            Load sample
          </button>
        </div>
        <div style={{ padding: 14 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Paste your full project proposal text here…"
            style={{
              width: "100%", height: 160, fontFamily: "var(--font-mono)", fontSize: 12,
              lineHeight: 1.6, resize: "vertical", background: "var(--color-background-secondary)",
              border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)",
              padding: 10, color: "var(--color-text-primary)", marginBottom: 10, display: "block",
              boxSizing: "border-box"
            }}
          />
          <button
            onClick={generate}
            disabled={loading}
            style={{
              padding: "8px 18px", fontSize: 13, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer",
              background: "var(--color-background-info)", color: "var(--color-text-info)",
              border: "0.5px solid var(--color-border-info)", borderRadius: "var(--border-radius-md)",
              opacity: loading ? 0.5 : 1, display: "inline-flex", alignItems: "center", gap: 6
            }}
          >
            {loading ? "Generating…" : "Generate project document"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "var(--color-background-danger)", border: "0.5px solid var(--color-border-danger)",
          borderRadius: "var(--border-radius-md)", padding: "10px 14px", marginBottom: 12
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-danger)", marginBottom: 4 }}>
            Error
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-danger)", lineHeight: 1.6 }}>{error}</div>
          {rawResponse && (
            <button
              onClick={() => setShowRaw(r => !r)}
              style={{
                marginTop: 8, fontSize: 11, padding: "3px 10px", cursor: "pointer",
                background: "transparent", border: "0.5px solid var(--color-border-danger)",
                borderRadius: "var(--border-radius-md)", color: "var(--color-text-danger)"
              }}
            >
              {showRaw ? "Hide" : "Show"} raw API response
            </button>
          )}
          {showRaw && rawResponse && (
            <pre style={{
              marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 11,
              color: "var(--color-text-secondary)", whiteSpace: "pre-wrap",
              background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)",
              padding: "8px 10px", maxHeight: 200, overflowY: "auto", lineHeight: 1.5
            }}>{rawResponse}</pre>
          )}
        </div>
      )}

      {/* Output */}
      {overview && (
        <div style={{
          background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-lg)", overflow: "hidden"
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 14px", background: "var(--color-background-secondary)",
            borderBottom: "0.5px solid var(--color-border-tertiary)"
          }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>
              Generated project document
            </span>
            <button onClick={copyDoc} style={{
              fontSize: 11, padding: "3px 10px", cursor: "pointer",
              background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)",
              borderRadius: "var(--border-radius-md)", color: "var(--color-text-secondary)"
            }}>
              Copy all
            </button>
          </div>
          <div style={{ padding: 14 }}>
            {[
              { num: "1", title: "Overview", content: overview, isNA: false },
              { num: "2", title: "Requirements", content: "No information available.", isNA: true },
              { num: "3", title: "Assumptions", content: "No information available.", isNA: true },
              { num: "4", title: "Out of Scope", content: "No information available.", isNA: true },
            ].map(sec => (
              <div key={sec.num} style={{ marginBottom: 14 }}>
                <div style={{
                  fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em",
                  color: sec.isNA ? "var(--color-text-secondary)" : "var(--color-text-info)",
                  marginBottom: 4
                }}>
                  {sec.num} · {sec.title}
                </div>
                <div style={{
                  fontSize: 12.5, lineHeight: 1.7, whiteSpace: "pre-wrap",
                  color: sec.isNA ? "var(--color-text-secondary)" : "var(--color-text-primary)",
                  background: "var(--color-background-secondary)",
                  border: `0.5px ${sec.isNA ? "dashed" : "solid"} ${sec.isNA ? "var(--color-border-tertiary)" : "var(--color-border-info)"}`,
                  borderRadius: "var(--border-radius-md)", padding: "10px 12px",
                  fontStyle: sec.isNA ? "italic" : "normal"
                }}>
                  {sec.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
