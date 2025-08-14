import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import "./EventPlanner.css";
import { FaArrowCircleUp } from "react-icons/fa";
import { RiCheckboxBlankFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify"; // if not already imported

const EventPlannerForm = forwardRef(({ userId }, ref) => {
  const [form, setForm] = useState({
    eventType: "",
    date: "",
    endDate: "",
    duration: "",
    guests: "",
    budget: "",
    location: "",
    culture: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [tableData, setTableData] = useState([]);
  const [followUp, setFollowUp] = useState("");
  const [followUps, setFollowUps] = useState([]);
  const [prevPrompt, setPrevPrompt] = useState("");
  const [prevResponse, setPrevResponse] = useState("");
  const [chatSessionId] = useState(uuidv4());
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  useImperativeHandle(ref, () => ({
    clearForm,
  }));

  useEffect(() => {
    localStorage.setItem("eventForm", JSON.stringify(form));
    localStorage.setItem("followUps", JSON.stringify(followUps));
  }, [form, followUps]);

  useEffect(() => {
    const savedForm = localStorage.getItem("eventForm");
    const savedFollowUps = localStorage.getItem("followUps");

    if (savedForm) setForm(JSON.parse(savedForm));
    if (savedFollowUps) setFollowUps(JSON.parse(savedFollowUps));
  }, []);

  const clearForm = () => {
    setForm({
      eventType: "",
      date: "",
      endDate: "",
      duration: "",
      guests: "",
      budget: "",
      location: "",
      culture: "",
      description: "",
    });
    setResult("");
    setTableData([]);
    setFollowUp("");
    setFollowUps([]);
    setPrevPrompt("");
    setPrevResponse("");
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const getDurationInDays = (durationStr) => {
    const match = durationStr.match(/(\d+)\s*day/i);
    return match ? parseInt(match[1], 10) : 0;
  };

  const buildPrompt = () => {
    const {
      eventType,
      date,
      endDate,
      duration,
      guests,
      budget,
      location,
      culture,
      description,
    } = form;

    const dateRange = endDate ? `${date} to ${endDate}` : date;

    let budgetContext = "";
    if (parseInt(guests) <= 30 && parseInt(budget) <= 25000) {
      budgetContext = `\nNote: This is a low-budget event. Focus on affordable options like small halls, veg catering, basic sound & lights.\n`;
    } else if (parseInt(budget) <= 10000) {
      budgetContext = `\nImportant: Extremely limited budget. Advise if the event is feasible and what can be cut down.\n`;
    }

    return `
You are an expert event planner. Based on the details below, create a comprehensive plan:
- Event: ${eventType}
- Date(s): ${dateRange}
- Duration: ${duration}
- Guests: ${guests}
- Budget: ₹${budget}
- Location: ${location}
- Culture/Theme: ${culture}
- Description: ${description}
${budgetContext}

Please provide:
1. Time-based event schedule (check feasibility for short-notice).
2. Task plan with deadlines.
3. Budget breakdown (item & cost).
4. Suggestions for organizing the event.
    `;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult("");
    setTableData([]);
    setFollowUps([]);

    const prompt = buildPrompt();

    try {
      const response = await axios.post(
        "https://a5sk2d26npd4uyqvabpza5h4fi0dlkkk.lambda-url.us-east-1.on.aws/",
        {
          ...form,
          prompt,
          chatType: "initial",
          userId,
          chatSessionId,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      const rawText = response.data.result || "No plan found.";
      setResult(rawText);
      setPrevPrompt(prompt);
      setPrevResponse(rawText);

      const lines = rawText.split("\n").filter((line) => line.includes("|"));
      const table = lines.map((line) =>
        line.split("|").map((col) => col.trim())
      );

      if (table.length > 1) setTableData(table);
    } catch (err) {
      
      setResult("Error generating event plan.");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUp = async () => {
    if (!followUp.trim()) return;

    setLoading(true);
    setSubmitted(true);

    const payload = {
      chatType: "follow-up",
      followUp,
      prevPrompt,
      prevResponse,
      userId,
      chatSessionId,
    };

    try {
      const response = await axios.post(
        "https://a5sk2d26npd4uyqvabpza5h4fi0dlkkk.lambda-url.us-east-1.on.aws/",
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      setFollowUps([
        ...followUps,
        { question: followUp, answer: response.data.result },
      ]);
      setFollowUp("");
    } catch (err) {
      
      setFollowUps([
        ...followUps,
        { question: followUp, answer: "Error getting answer." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => setSubmitted(false), 1500);
    }
  };

  const durationInDays = getDurationInDays(form.duration);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("userEmail"); // ✅ this line is critical
            toast.success("Logged out successfully");
            navigate("/");
          }}
          style={{
            padding: "8px 16px",
            marginBottom: "10px",
            backgroundColor: "#d9534f",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
      <div className="ep-result-box">
        <h1 className="ep-form-title">Event Planner</h1>
        <form onSubmit={handleSubmit} className="ep-form-grid">
          <div className="ep-form-group">
            <label>Event Type:</label>
            <input
              type="text"
              name="eventType"
              value={form.eventType}
              onChange={handleChange}
              required
            />
          </div>
          <div className="ep-form-group">
            <label>Duration:</label>
            <input
              type="text"
              name="duration"
              value={form.duration}
              onChange={handleChange}
              required
            />
          </div>
          {durationInDays > 1 ? (
            <>
              <div className="ep-form-group">
                <label>Start Date:</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="ep-form-group">
                <label>End Date:</label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                />
              </div>
            </>
          ) : (
            <div className="ep-form-group">
              <label>Date:</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>
          )}
          <div className="ep-form-group">
            <label>Guests:</label>
            <input
              type="number"
              name="guests"
              value={form.guests}
              onChange={handleChange}
              required
            />
          </div>
          <div className="ep-form-group">
            <label>Budget (₹):</label>
            <input
              type="number"
              name="budget"
              value={form.budget}
              onChange={handleChange}
              required
            />
          </div>
          <div className="ep-form-group">
            <label>Location:</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
            />
          </div>
          <div className="ep-form-group">
            <label>Culture / Theme:</label>
            <input
              type="text"
              name="culture"
              value={form.culture}
              onChange={handleChange}
            />
          </div>
          <div className="ep-form-group ep-full-width">
            <label>Description:</label>
            <textarea
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
            />
          </div>
          <div className="ep-form-group ep-full-width">
            <button type="submit" disabled={loading}>
              {loading ? "Generating Plan..." : "Generate Plan"}
            </button>
          </div>
        </form>

        {result && (
          <div className="ep-result-box">
            <h2>Generated Event Plan</h2>
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
                  __html: result
                    .split("\n")
                    .map((line) => {
                      if (
                        line.trim().startsWith("```") ||
                        line.trim().endsWith("```")
                      )
                        return "";
                      if (line.trim().startsWith("-"))
                        return `<li>${line.replace(/^-\s*/, "")}</li>`;
                      if (line.trim().match(/^\d+\./))
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
                    .join(""),
                }}
              />
            )}
          </div>
        )}

        {result && !loading && (
          <div className="ep-follow-up-section">
            {/* <textarea
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
          rows={2}
          placeholder="e.g. Can you suggest indoor venues?"
        /> */}
            <div className="followup_input_div">
              <input
                type="text"
                placeholder="Ask anything"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                // onKeyDown={(e) => e.key === "Enter" && handleFollowUp()}
                className="ep-input-box"
              />
              {followUp.trim() && (
                <button
                  className="sendbtnfollowup"
                  onClick={handleFollowUp}
                  disabled={loading}
                >
                  {submitted ? (
                    <RiCheckboxBlankFill size={26} />
                  ) : (
                    <FaArrowCircleUp size={30} />
                  )}
                </button>
              )}
            </div>

            {/* <button onClick={handleFollowUp} disabled={loading}>
          {loading ? "Thinking..." : "Ask"}
        </button> */}

            <div className="ep-chat-history">
              {followUps.map((chat, idx) => (
                <div key={idx} className="ep-chat-block-container">
                  <div className="ep-chat-question">
                    <div className="ep-chat-bubble user">{chat.question}</div>
                  </div>

                  <div className="ep-chat-answer">
                    <div
                      className="ep-ai-parsed-response"
                      dangerouslySetInnerHTML={{
                        __html: chat.answer
                          .split("\n")
                          .map((line) => {
                            if (
                              line.trim().startsWith("```") ||
                              line.trim().endsWith("```")
                            )
                              return "";
                            if (line.trim().startsWith("-"))
                              return `<li>${line.replace(/^-\s*/, "")}</li>`;
                            if (line.trim().match(/^\d+\./))
                              return `<li>${line.replace(
                                /^\d+\.\s*/,
                                ""
                              )}</li>`;
                            if (/^[A-Z\s&\-]+:$/.test(line.trim())) {
                              return `<h5>${line
                                .replace(/\*\*/g, "")
                                .trim()}</h5>`;
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
                              return `<h4>${line
                                .replace(/\*\*/g, "")
                                .trim()}</h4>`;
                            return `<p>${line.replace(/\*\*/g, "").trim()}</p>`;
                          })
                          .join(""),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default EventPlannerForm;
