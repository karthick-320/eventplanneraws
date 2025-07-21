import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import EventPlannerForm from "./EventPlannerForm";
import "./EventPlanner.css";
import "./EventPlannerForm.css";
import { IoMdArrowBack } from "react-icons/io";
import { RiEditBoxLine } from "react-icons/ri";
import { MdDeleteOutline } from "react-icons/md";

function EventPlannerWithHistory() {
  console.log("EventPlannerForm is:", typeof EventPlannerForm);
  const userId = localStorage.getItem("userId");
  const formRef = useRef();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  const handleNewChat = () => {
    setSelectedSession(null);
    formRef.current?.clearForm();
  };
  const fetchSessions = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(
        `https://a5sk2d26npd4uyqvabpza5h4fi0dlkkk.lambda-url.us-east-1.on.aws/?userId=${userId}`
      );
      setSessions(res.data.sessions || []);
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };

  const deleteSession = async (chatSessionId, userId) => {
    try {
      const response = await axios.delete(
        "https://a5sk2d26npd4uyqvabpza5h4fi0dlkkk.lambda-url.us-east-1.on.aws/",
        {
          params: {
            userId,
            chatSessionId,
          },
        }
      );
      console.log("Deleted successfully:", response.data);
      return true;
    } catch (error) {
      console.error("Delete failed:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div className="ep-layout">
      <div className="ep-sidebar">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "25px",
          }}
        >
          <h2>Previous Events</h2>
          <button className="newchat" onClick={handleNewChat}>
            <RiEditBoxLine size={25} style={{ marginRight: "6px" }} />
          </button>
        </div>

        <ul className="ep-session-list">
          {[...sessions]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map((s) => (
              <li
                key={s.chatSessionId}
                className={
                  selectedSession?.chatSessionId === s.chatSessionId
                    ? "active ep-session-row"
                    : "ep-session-row"
                }
              >
                <span
                  onClick={() => setSelectedSession(s)}
                  style={{ flexGrow: 1, cursor: "pointer" }}
                >
                  {s.eventData?.eventType
                    ? s.eventData.eventType.charAt(0).toUpperCase() +
                      s.eventData.eventType.slice(1)
                    : "Event"}{" "}
                  – {new Date(s.timestamp).toLocaleDateString()}
                </span>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    const confirmed = window.confirm(
                      "Are you sure you want to delete this session?"
                    );
                    if (confirmed) {
                      const success = await deleteSession(
                        s.chatSessionId,
                        userId
                      );
                      if (success) {
                        fetchSessions();
                        if (
                          selectedSession?.chatSessionId === s.chatSessionId
                        ) {
                          setSelectedSession(null);
                        }
                      }
                    }
                  }}
                  className="ep-delete-button"
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    color: "black",
                    cursor: "pointer",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="Delete session"
                >
                  <MdDeleteOutline size={20} />
                </button>
              </li>
            ))}
          {sessions.length === 0 && <li>No sessions yet</li>}
        </ul>
      </div>

      <div className="ep-main">
        {!selectedSession ? (
          <EventPlannerForm ref={formRef} userId={userId} />
        ) : (
          <div className="ep-history-view">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h2>
                Event:{" "}
                {selectedSession.eventData?.eventType?.charAt(0).toUpperCase() +
                  selectedSession.eventData?.eventType?.slice(1)}
              </h2>
              <button
                className="backnewplan"
                onClick={() => setSelectedSession(null)}
              >
                <IoMdArrowBack />
                Back to New Plan
              </button>
            </div>

            {selectedSession.chatHistory.map((entry, idx) => {
              const responseLines = entry.response.split("\n");

              const responseWithoutMarkdown = responseLines
                .map((line, i) => {
                  if (
                    line.trim().startsWith("```") ||
                    line.trim().endsWith("```")
                  )
                    return "";
                  if (line.trim().startsWith("-"))
                    return `<li>${line.replace(/^-\s*/, "")}</li>`;
                  if (
                    line.trim().startsWith("1.") ||
                    line.trim().match(/^\d+\./)
                  )
                    return `<li>${line.replace(/^\d+\.\s*/, "")}</li>`;
                  if (/^[A-Z\s&\-]+:$/.test(line.trim())) {
                    return `<h5>${line.replace(/\*\*/g, "").trim()}</h5>`;
                  }
                  if (/^Day\s+\d+.*:/.test(line.trim())) {
                    return `<p><strong>${line
                      .replace(/\*\*/g, "")
                      .trim()}</strong></p>`;
                  }
                  if (
                    line.trim().startsWith("**") &&
                    line.trim().endsWith("**")
                  )
                    return `<h4>${line.replace(/\*\*/g, "").trim()}</h4>`;
                  return `<p>${line.replace(/\*\*/g, "").trim()}</p>`;
                })
                .join("");

              const tableLines = entry.response
                .split("\n")
                .filter((line) => line.includes("|"));
              const tableData = tableLines.map((line) =>
                line.split("|").map((col) => col.trim())
              );

              return (
                <div key={idx} className="ep-chat-form">
                  <div className="ep-chat-section">
                    <div className="ep-form-grid">
                      {Object.entries(selectedSession.eventData || {}).map(
                        ([key, value]) => (
                          <div key={key} className="ep-form-field">
                            <label>
                              {key
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (c) => c.toUpperCase())}
                            </label>
                            <input type="text" value={value} readOnly />
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="ep-chat-section ep-ai-response-section">
                    <h4>AI Response</h4>
                    {tableData.length > 1 ? (
                      <table className="ep-ai-table">
                        <thead>
                          <tr>
                            {tableData[0].map((header, idx) => (
                              <th key={idx}>{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tableData.slice(1).map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div
                        className="ep-ai-parsed-response"
                        dangerouslySetInnerHTML={{
                          __html: responseWithoutMarkdown,
                        }}
                      />
                    )}
                  </div>

                  <hr />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default EventPlannerWithHistory;
