import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const API = "http://127.0.0.1:5000";

  const [algorithm, setAlgorithm] = useState("FCFS");
  const [quantum, setQuantum] = useState(2);

  const [processName, setProcessName] = useState("");
  const [arrival, setArrival] = useState("");
  const [burst, setBurst] = useState("");
  const [priority, setPriority] = useState("");

  const [processes, setProcesses] = useState([]);

  const [results, setResults] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [gantt, setGantt] = useState([]);
  const [output, setOutput] = useState("");

  const [status, setStatus] = useState("Checking...");
  const [loading, setLoading] = useState(false);

  // =====================================
  // CHECK BACKEND
  // =====================================

  useEffect(() => {
    fetch(API)
      .then((response) => {
        if (response.ok) {
          setStatus("Backend Connected");
        } else {
          setStatus("Backend Error");
        }
      })
      .catch(() => {
        setStatus("Backend Offline");
      });
  }, []);

  // =====================================
  // ADD PROCESS
  // =====================================

  const addProcess = () => {
    if (
      !processName ||
      arrival === "" ||
      burst === "" ||
      priority === ""
    ) {
      alert("Please fill all process details.");
      return;
    }

    const newProcess = {
      id: Date.now(),
      name: processName,
      arrival: Number(arrival),
      burst: Number(burst),
      priority: Number(priority),
    };

    setProcesses((previous) => [
      ...previous,
      newProcess,
    ]);

    setProcessName("");
    setArrival("");
    setBurst("");
    setPriority("");
  };

  // =====================================
  // DELETE PROCESS
  // =====================================

  const removeProcess = (id) => {
    setProcesses((previous) =>
      previous.filter((process) => process.id !== id)
    );
  };

  // =====================================
  // CLEAR EVERYTHING
  // =====================================

  const clearProcesses = () => {
    setProcesses([]);
    setResults([]);
    setAnalytics({});
    setGantt([]);
    setOutput("");
  };

  // =====================================
  // RUN C++ SCHEDULER
  // =====================================

  const runScheduler = async () => {
    if (processes.length === 0) {
      alert("Add at least one process.");
      return;
    }

    if (algorithm === "RR" && quantum <= 0) {
      alert("Time quantum must be greater than 0.");
      return;
    }

    setLoading(true);

    setResults([]);
    setAnalytics({});
    setGantt([]);
    setOutput("Running C++ scheduler...");

    try {
      const response = await fetch(`${API}/api/run`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          algorithm,
          quantum,
          processes,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Scheduler failed."
        );
      }

      // Store backend data
      setResults(data.results || []);

      setAnalytics(
        data.analytics || {}
      );

      setGantt(
        data.gantt || []
      );

      setOutput(
        data.output || ""
      );

    } catch (error) {

      setOutput(
        `ERROR: ${error.message}`
      );

    } finally {

      setLoading(false);
    }
  };

  // =====================================
  // FORMAT NUMBER
  // =====================================

  const number = (value) => {
    if (value === undefined || value === null) {
      return "—";
    }

    return Number(value).toFixed(2);
  };

  return (
    <div className="app">

      {/* Background */}
      <div className="orb orb1"></div>
      <div className="orb orb2"></div>
      <div className="orb orb3"></div>

      {/* =================================
          NAVBAR
      ================================= */}

      <nav className="navbar">

        <div className="logo">
          <span>⚙</span>
          CPU Scheduler
        </div>

        <div className="backend-status">

          <span
            className={`status-dot ${
              status === "Backend Connected"
                ? "online"
                : ""
            }`}
          ></span>

          {status}

        </div>

      </nav>

      {/* =================================
          HERO
      ================================= */}

      <section className="hero">

        <p className="tag">
          OPERATING SYSTEM PROJECT
        </p>

        <h1>
          CPU Task
          <span> Scheduler</span>
        </h1>

        <p className="hero-text">
          Visualize and analyze CPU scheduling
          algorithms using your C++ scheduling engine.
        </p>

      </section>

      <main className="container">

        {/* =================================
            ALGORITHM
        ================================= */}

        <section className="glass-card">

          <div className="section-title">

            <div>
              <h2>
                Scheduling Configuration
              </h2>

              <p>
                Select the scheduling algorithm
              </p>
            </div>

          </div>

          <div className="algorithm-grid">

            {[
              ["FCFS", "First Come First Serve"],
              ["SJF", "Shortest Job First"],
              ["SRTF", "Shortest Remaining Time"],
              ["PRIORITY", "Priority Scheduling"],
              ["RR", "Round Robin"],
            ].map(([value, label]) => (

              <button
                key={value}
                className={`algorithm ${
                  algorithm === value
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setAlgorithm(value)
                }
              >

                <strong>
                  {value === "PRIORITY"
                    ? "Priority"
                    : value === "RR"
                    ? "Round Robin"
                    : value}
                </strong>

                <small>
                  {label}
                </small>

              </button>

            ))}

          </div>

          {/* Quantum */}

          {algorithm === "RR" && (

            <div className="quantum-box">

              <label>
                Time Quantum
              </label>

              <input
                type="number"
                min="1"
                value={quantum}
                onChange={(e) =>
                  setQuantum(
                    Number(e.target.value)
                  )
                }
              />

              <span>
                units
              </span>

            </div>

          )}

        </section>

        {/* =================================
            ADD PROCESS
        ================================= */}

        <section className="glass-card">

          <div className="section-title">

            <div>

              <h2>
                Add Process
              </h2>

              <p>
                Enter process scheduling information
              </p>

            </div>

          </div>

          <div className="form-grid">

            <div className="input-group">

              <label>
                Process Name
              </label>

              <input
                type="text"
                placeholder="P1"
                value={processName}
                onChange={(e) =>
                  setProcessName(e.target.value)
                }
              />

            </div>

            <div className="input-group">

              <label>
                Arrival Time
              </label>

              <input
                type="number"
                min="0"
                placeholder="0"
                value={arrival}
                onChange={(e) =>
                  setArrival(e.target.value)
                }
              />

            </div>

            <div className="input-group">

              <label>
                Burst Time
              </label>

              <input
                type="number"
                min="1"
                placeholder="5"
                value={burst}
                onChange={(e) =>
                  setBurst(e.target.value)
                }
              />

            </div>

            <div className="input-group">

              <label>
                Priority
              </label>

              <input
                type="number"
                min="0"
                placeholder="1"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value)
                }
              />

            </div>

          </div>

          <button
            className="add-button"
            onClick={addProcess}
          >
            + Add Process
          </button>

        </section>

        {/* =================================
            PROCESS TABLE
        ================================= */}

        <section className="glass-card">

          <div className="section-title">

            <div>

              <h2>
                Process Queue
              </h2>

              <p>
                {processes.length} process(es) added
              </p>

            </div>

            {processes.length > 0 && (

              <button
                className="clear-button"
                onClick={clearProcesses}
              >
                Clear All
              </button>

            )}

          </div>

          {processes.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                📋
              </div>

              <h3>
                No processes added
              </h3>

              <p>
                Add processes above to start scheduling.
              </p>

            </div>

          ) : (

            <div className="table-wrapper">

              <table>

                <thead>

                  <tr>
                    <th>Process</th>
                    <th>Arrival</th>
                    <th>Burst</th>
                    <th>Priority</th>
                    <th>Action</th>
                  </tr>

                </thead>

                <tbody>

                  {processes.map((process) => (

                    <tr key={process.id}>

                      <td>
                        <span className="process-badge">
                          {process.name}
                        </span>
                      </td>

                      <td>
                        {process.arrival}
                      </td>

                      <td>
                        {process.burst}
                      </td>

                      <td>
                        {process.priority}
                      </td>

                      <td>

                        <button
                          className="delete-button"
                          onClick={() =>
                            removeProcess(process.id)
                          }
                        >
                          Delete
                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* =================================
            RUN BUTTON
        ================================= */}

        <section className="run-section">

          <button
            className="run-button"
            onClick={runScheduler}
            disabled={loading}
          >

            {loading
              ? "Running C++ Scheduler..."
              : "▶ Run Scheduler"}

          </button>

          <p>
            Running{" "}
            <strong>
              {algorithm}
            </strong>{" "}
            using the C++ engine
          </p>

        </section>

        {/* =================================
            ANALYTICS
        ================================= */}

        {Object.keys(analytics).length > 0 && (

          <section className="analytics-grid">

            <div className="stat-card">

              <span>
                Average Waiting
              </span>

              <strong>
                {number(
                  analytics.avgWaiting
                )}
              </strong>

              <small>
                time units
              </small>

            </div>

            <div className="stat-card">

              <span>
                Average Turnaround
              </span>

              <strong>
                {number(
                  analytics.avgTurnaround
                )}
              </strong>

              <small>
                time units
              </small>

            </div>

            <div className="stat-card">

              <span>
                Average Response
              </span>

              <strong>
                {number(
                  analytics.avgResponse
                )}
              </strong>

              <small>
                time units
              </small>

            </div>

            <div className="stat-card">

              <span>
                CPU Utilization
              </span>

              <strong>
                {number(
                  analytics.cpuUtilization
                )}%
              </strong>

              <small>
                processor usage
              </small>

            </div>

            <div className="stat-card">

              <span>
                Throughput
              </span>

              <strong>
                {number(
                  analytics.throughput
                )}
              </strong>

              <small>
                tasks / unit time
              </small>

            </div>

            <div className="stat-card">

              <span>
                Context Switches
              </span>

              <strong>
                {analytics.contextSwitches ?? "—"}
              </strong>

              <small>
                total switches
              </small>

            </div>

          </section>

        )}

        {/* =================================
            GANTT CHART
        ================================= */}

        {gantt.length > 0 && (

          <section className="glass-card">

            <div className="section-title">

              <div>

                <h2>
                  Gantt Chart
                </h2>

                <p>
                  CPU execution timeline
                </p>

              </div>

            </div>

            <div className="gantt">

              {gantt.map((segment, index) => {

                const duration =
                  segment.end -
                  segment.start;

                return (

                  <div
                    className="gantt-segment"
                    key={index}
                    style={{
                      flexGrow: duration
                    }}
                  >

                    <strong>
                      {segment.task}
                    </strong>

                    <span>
                      {segment.start}
                      {" → "}
                      {segment.end}
                    </span>

                  </div>

                );

              })}

            </div>

            <div className="gantt-times">

              {gantt.map(
                (segment, index) => (

                  <span key={index}>
                    {segment.start}
                  </span>

                )
              )}

              {gantt.length > 0 && (

                <span>
                  {
                    gantt[
                      gantt.length - 1
                    ].end
                  }
                </span>

              )}

            </div>

          </section>

        )}

        {/* =================================
            RESULT TABLE
        ================================= */}

        {results.length > 0 && (

          <section className="glass-card">

            <div className="section-title">

              <div>

                <h2>
                  Scheduling Results
                </h2>

                <p>
                  Results generated by the C++ engine
                </p>

              </div>

            </div>

            <div className="table-wrapper">

              <table>

                <thead>

                  <tr>
                    <th>Task</th>
                    <th>AT</th>
                    <th>BT</th>
                    <th>CT</th>
                    <th>TAT</th>
                    <th>WT</th>
                    <th>RT</th>
                  </tr>

                </thead>

                <tbody>

                  {results.map(
                    (result, index) => (

                      <tr key={index}>

                        <td>
                          <span className="process-badge">
                            {result.name}
                          </span>
                        </td>

                        <td>
                          {result.arrivalTime}
                        </td>

                        <td>
                          {result.burstTime}
                        </td>

                        <td>
                          {result.completionTime}
                        </td>

                        <td>
                          {result.turnaroundTime}
                        </td>

                        <td>
                          {result.waitingTime}
                        </td>

                        <td>
                          {result.responseTime}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </section>

        )}

        {/* =================================
            RAW C++ OUTPUT
        ================================= */}

        {output && (

          <section className="glass-card output-card">

            <div className="section-title">

              <div>

                <h2>
                  C++ Console Output
                </h2>

                <p>
                  Original output from the scheduler
                </p>

              </div>

            </div>

            <pre className="output">
              {output}
            </pre>

          </section>

        )}

      </main>

      <footer>

        <p>
          CPU Task Scheduler • C++ + Node.js + React
        </p>

      </footer>

    </div>
  );
}

export default App;