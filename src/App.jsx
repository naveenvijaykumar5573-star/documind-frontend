import { useState } from "react";

import "./App.css";
import Login from "./Login";
import Register from "./Register";

const API_BASE_URL = "https://rag-backend-nskx.onrender.com/api";
function App() {
  // Authentication and navigation
  const [page, setPage] = useState("register");
  const [auth, setAuth] = useState(null);
  const [activeView, setActiveView] = useState("chat");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  // Chat state
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);

  // Documents state
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState("");

  // Get the current JWT
  function getToken() {
    return (
      auth?.accessToken ||
      auth?.token ||
      localStorage.getItem("accessToken")
    );
  }

  // Login
  function handleLoginSuccess(data) {
    setAuth(data);

    const token = data.accessToken || data.token;

    if (token) {
      localStorage.setItem("accessToken", token);
    }

    setActiveView("chat");
    setMessages([]);
    setQuestion("");
    setPage("dashboard");
  }

  // Registration
  function handleRegisterSuccess() {
    setPage("login");
  }

  // Logout
  function handleLogout() {
    localStorage.removeItem("accessToken");

    setAuth(null);
    setQuestion("");
    setMessages([]);
    setDocuments([]);
    setDocumentsError("");
    setActiveView("chat");
    setPage("login");
  }

  // Load documents from Spring Boot
  async function loadDocuments() {
    const token = getToken();

    if (!token) {
      setDocumentsError("Your session has expired. Please log in again.");
      return;
    }

    setDocumentsLoading(true);
    setDocumentsError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/rag/documents`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.detail ||
            `Unable to load documents (HTTP ${response.status}).`
        );
      }

      // Accept a direct array or common wrapped response formats
      let list = [];

      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data?.documents)) {
        list = data.documents;
      } else if (Array.isArray(data?.data)) {
        list = data.data;
      } else if (Array.isArray(data?.content)) {
        list = data.content;
      } else {
        throw new Error(
          "The documents API returned an unexpected format. Check RagService."
        );
      }

      setDocuments(list);
    } catch (error) {
      setDocumentsError(
        error.message || "Could not connect to the documents API."
      );
    } finally {
      setDocumentsLoading(false);
    }
  }

  // Switch sidebar views
  function handleViewChange(view) {
    setActiveView(view);

    if (view === "documents") {
      loadDocuments();
    }
  }
  
async function handleUpload() {
  if (!selectedFile) {
    setUploadMessage("Please select a PDF file first.");
    return;
  }

  if (selectedFile.type !== "application/pdf" &&
      !selectedFile.name.toLowerCase().endsWith(".pdf")) {
    setUploadMessage("Only PDF files are supported.");
    return;
  }

  const token = getToken();

  if (!token) {
    setUploadMessage("Your session has expired. Please log in again.");
    return;
  }

  const formData = new FormData();
  formData.append("file", selectedFile);

  setUploading(true);
  setUploadMessage("");

  try {
    const response = await fetch(
"https://rag-backend-nskx.onrender.com/api/rag/documents/upload",      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message ||
        data.detail ||
        `Upload failed (HTTP ${response.status}).`
      );
    }

    setUploadMessage("PDF uploaded successfully.");
    setSelectedFile(null);

    // Refresh the document list after upload
    await loadDocuments();
  } catch (error) {
    setUploadMessage(
      error.message || "Unable to upload the PDF."
    );
  } finally {
    setUploading(false);
  }
}


  // Ask a question using the RAG API
  async function handleSend() {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || isSending) {
      return;
    }

    const token = getToken();

    if (!token) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: "Your session has expired. Please log in again.",
        },
      ]);
      return;
    }

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        text: trimmedQuestion,
      },
    ]);

    setQuestion("");
    setIsSending(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/rag/ask`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question: trimmedQuestion,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.detail ||
            `Request failed (HTTP ${response.status}).`
        );
      }

      const answer = data.answer;

      if (typeof answer !== "string") {
        throw new Error(
          "The API response does not contain a valid answer."
        );
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: answer,
        },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: `Could not get an AI answer: ${error.message}`,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  // Registration page
  if (page === "register") {
    return (
      <Register
        onSwitchToLogin={() => setPage("login")}
        onRegisterSuccess={handleRegisterSuccess}
      />
    );
  }

  // Login page
  if (page === "login") {
    return (
      <Login
        onSwitchToRegister={() => setPage("register")}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Dashboard
  return (
    <div className="app">
      <aside className="sidebar">
        <h2>DocuMind AI</h2>
        <p className="subtitle">Intelligent document assistant</p>

        <button
          type="button"
          className="new-chat"
          onClick={() => {
            setMessages([]);
            setQuestion("");
            setActiveView("chat");
          }}
        >
          + New conversation
        </button>

        <div className="sidebar-label">WORKSPACE</div>

        <button
          type="button"
          className={`nav-item ${
            activeView === "chat" ? "active" : ""
          }`}
          onClick={() => handleViewChange("chat")}
        >
          💬 AI Chat
        </button>

        <button
          type="button"
          className={`nav-item ${
            activeView === "documents" ? "active" : ""
          }`}
          onClick={() => handleViewChange("documents")}
        >
          📄 My Documents
        </button>

        <div className="sidebar-footer">
          <span className="avatar">
            {(auth?.name || "U").charAt(0).toUpperCase()}
          </span>

          <div>
            <strong>{auth?.name || "My Workspace"}</strong>
            <small>{auth?.email || "Document assistant"}</small>
          </div>

          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h3>
              {activeView === "chat"
                ? "Document Assistant"
                : "My Documents"}
            </h3>

            <p>
              {activeView === "chat"
                ? "Ask questions about your documents"
                : "View and manage your uploaded documents"}
            </p>
          </div>

          <span className="status">
            <span className="status-dot" />
            AI Workspace
          </span>
        </header>

        {activeView === "chat" ? (
          <>
            <section className="chat-area">
              {messages.length === 0 ? (
                <div className="welcome">
                  <div className="welcome-icon">✦</div>

                  <h1>Your documents, understood.</h1>

                  <p>
                    Ask questions about your PDFs and get answers
                    grounded in your documents.
                  </p>

                  <div className="suggestions">
                    <button
                      type="button"
                      onClick={() =>
                        setQuestion("Summarize my document")
                      }
                    >
                      <strong>Summarize a document</strong>
                      <span>Get the main points</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setQuestion("What are the key requirements?")
                      }
                    >
                      <strong>Find key information</strong>
                      <span>Extract important details</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="messages">
                  {messages.map((message, index) => (
                    <div className="message" key={index}>
                      <span className="message-avatar">
                        {message.role === "user" ? "U" : "AI"}
                      </span>

                      <div>
                        <strong>
                          {message.role === "user"
                            ? "You"
                            : "DocuMind AI"}
                        </strong>

                        <p>{message.text}</p>
                      </div>
                    </div>
                  ))}

                  {isSending && (
                    <div className="message">
                      <span className="message-avatar">AI</span>
                      <div>
                        <strong>DocuMind AI</strong>
                        <p>Thinking...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            <form
              className="composer"
              onSubmit={(event) => {
                event.preventDefault();
                handleSend();
              }}
            >
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask a question about your documents..."
                rows={2}
                disabled={isSending}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
              />

              <div className="composer-bottom">
                <span>
                  Answers are based on your uploaded documents
                </span>

                <button
                  type="submit"
                  disabled={!question.trim() || isSending}
                >
                  {isSending ? "Sending..." : "Send ↗"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <section className="documents-area">
        
<div className="documents-header">
  <h1>My Documents</h1>
  <p>View and manage your uploaded documents.</p>

  <div className="upload-controls">
    <input
      type="file"
      accept=".pdf,application/pdf"
      onChange={(event) => {
        setSelectedFile(event.target.files?.[0] || null);
        setUploadMessage("");
      }}
    />

    <button
      type="button"
      onClick={handleUpload}
      disabled={!selectedFile || uploading}
    >
      {uploading ? "Uploading..." : "Upload PDF"}
    </button>
  </div>

  {selectedFile && (
    <p>Selected file: {selectedFile.name}</p>
  )}

  {uploadMessage && (
    <p role="status">{uploadMessage}</p>
  )}

  <button
    type="button"
    onClick={loadDocuments}
    disabled={documentsLoading}
  >
    {documentsLoading ? "Refreshing..." : "Refresh"}
  </button>
</div>

            {documentsLoading && (
              <p>Loading your documents...</p>
            )}

            {documentsError && (
              <div className="documents-error">
                <p>{documentsError}</p>
                <button type="button" onClick={loadDocuments}>
                  Try again
                </button>
              </div>
            )}

            {!documentsLoading &&
              !documentsError &&
              documents.length === 0 && (
                <div className="empty-documents">
                  <div className="welcome-icon">📄</div>
                  <h2>No documents found</h2>
                  <p>
                    No documents were returned by the API.
                    Upload a PDF to start asking questions about it.
                  </p>

                  <button
                    type="button"
                    onClick={() => handleViewChange("chat")}
                  >
                    Back to AI Chat
                  </button>
                </div>
              )}

            {!documentsLoading && documents.length > 0 && (
              <div className="documents-list">
                {documents.map((doc, index) => (
                  <article
                    className="document-card"
                    key={
                      doc.id ||
                      doc.document_id ||
                      doc.documentId ||
                      index
                    }
                  >
                    <span className="document-icon">📄</span>

                    <div className="document-details">
                      <strong>
                        {doc.filename ||
                          doc.file_name ||
                          doc.fileName ||
                          doc.name ||
                          "Untitled document"}
                      </strong>

                      <p>
                        Status: {doc.status || "Available"}
                      </p>

                      {(doc.created_at || doc.createdAt) && (
                        <small>
                          Uploaded:{" "}
                          {String(doc.created_at || doc.createdAt)}
                        </small>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <footer className="main-footer">
          Powered by your RAG platform · Spring Boot · FastAPI · Qwen
        </footer>
      </main>
    </div>
  );
}

export default App;