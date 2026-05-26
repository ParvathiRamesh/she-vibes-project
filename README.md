DocuAssist is an AI-powered documentation agent designed to dramatically reduce the time Business Analysts (BAs) spend creating project documentation. It is for Business Analysts.





DocuAssist v1 is a single HTML file. No framework, no server, no database, no build step. Everything — the UI, the logic, the AI call, and the Word document generator — lives in one file you can email to someone and double-click to run.





How to set it up from scratch

Step 1 — Get an Anthropic API key

Go to console.anthropic.com → API Keys → Create key. New accounts get free credits. Copy the key — it starts with sk-ant-api03-.

Step 2 — Get the HTML file

Download DocuAssist\_v1.html.

Step 3 — Open it

Double-click the file in Chrome or Edge. It opens locally on your machine at a file:// URL. No internet connection needed after the file loads (except for the API call itself).

Step 4 — Enter your key

On first open, a setup screen asks for your API key. Enter it, click Launch. The key is saved for the session — you won't be asked again until you close and reopen the browser.

Step 5 — Share with BAs

Email the .html file. Each BA opens it, enters their own API key, and they're running. There's no account, no login, no server to maintain.



Technologies used

React 18 (UMD build) loaded from a CDN via a <script> tag. This is the UI layer — it renders the input form, handles state (which screen you're on, what's in the fields, loading status), and renders the generated document preview. Using the UMD build specifically means no Node.js, no npm install, no bundler needed — it just works in a browser.

Vanilla JavaScript (ES5-compatible) for all the application logic — the generate function, the download function, the copy-to-clipboard function, and the markdown-to-HTML renderer for the document preview. Written without arrow functions or template literals to maximise browser compatibility.

Anthropic API (/v1/messages) called directly from the browser using fetch(). The model is claude-sonnet-4-6. The API key is entered by the user on first launch and stored in sessionStorage — it persists for the browser session but is never written to disk or sent anywhere other than Anthropic's API.

JSZip (bundled inline, \~160KB) for generating the .docx file. A Word document is just a ZIP file containing XML — JSZip creates that ZIP in the browser, and the download is triggered via a Blob URL. No server involved.

Office Open XML — the Word document format. The .docx is assembled from raw XML strings defining the document body, styles, numbering (for bullet points), and relationships. Written by hand inside the buildDocx() function.



What's planned for v2

Two agentic abilities are being added — both run automatically without the BA doing anything differently.

Input Analyst Agent runs before generation. It makes a separate API call to score all six input fields for completeness and quality. If a field is too short or vague, it highlights that field and explains what's missing before generation starts. This prevents the BA discovering problems only after reviewing a TBD-heavy draft.

Quality Judge Agent runs after generation. It makes a second separate API call to review the draft against three criteria: traceability (no invented content), Agile label suppression (no Epic IDs or User Story labels), and tone (formal requirement language throughout). If the draft fails, it triggers one automatic re-generation. If it fails again, the BA receives the draft with a clear quality notice.

The v2 implementation adds two more fetch() calls to the existing file and three loading state labels — Analysing your input..., Generating document..., Reviewing quality.... The HTML file stays self-contained with no new dependencies. Maximum four API calls per document session.

# 



