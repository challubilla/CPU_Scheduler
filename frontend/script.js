const API_URL = "http://127.0.0.1:5000";

let processes = [];


/* =========================
   DOM ELEMENTS
========================= */

const processTable =
    document.getElementById("processTable");

const processCount =
    document.getElementById("processCount");

const algorithmSelect =
    document.getElementById("algorithm");

const quantumInput =
    document.getElementById("quantum");

const output =
    document.getElementById("output");

const runButton =
    document.getElementById("runButton");


/* =========================
   RENDER PROCESS TABLE
========================= */

function renderProcesses() {

    processCount.textContent = processes.length;

    if (processes.length === 0) {

        processTable.innerHTML = `

            <tr class="empty-row">

                <td colspan="5">

                    <div class="empty-state">

                        <div class="empty-icon">
                            🖥️
                        </div>

                        <p>
                            No processes added yet
                        </p>

                        <span>
                            Add a process above to get started
                        </span>

                    </div>

                </td>

            </tr>

        `;

        return;
    }


    processTable.innerHTML = "";


    processes.forEach((process, index) => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                <strong>${escapeHTML(process.name)}</strong>
            </td>

            <td>
                ${process.arrival}
            </td>

            <td>
                ${process.burst}
            </td>

            <td>
                ${process.priority}
            </td>

            <td>

                <button
                    class="delete-btn"
                    onclick="deleteProcess(${index})"
                >
                    Delete
                </button>

            </td>

        `;


        processTable.appendChild(row);

    });

}


/* =========================
   ADD PROCESS
========================= */

function addProcess() {

    const name =
        document
            .getElementById("processName")
            .value
            .trim();


    const arrival =
        Number(
            document
                .getElementById("arrivalTime")
                .value
        );


    const burst =
        Number(
            document
                .getElementById("burstTime")
                .value
        );


    const priority =
        Number(
            document
                .getElementById("priority")
                .value
        );


    if (!name) {

        alert("Please enter a process name.");

        return;
    }


    if (
        Number.isNaN(arrival) ||
        arrival < 0
    ) {

        alert("Please enter a valid arrival time.");

        return;
    }


    if (
        Number.isNaN(burst) ||
        burst <= 0
    ) {

        alert("Burst time must be greater than 0.");

        return;
    }


    if (
        Number.isNaN(priority) ||
        priority <= 0
    ) {

        alert("Priority must be greater than 0.");

        return;
    }


    processes.push({

        name: name,

        arrival: arrival,

        burst: burst,

        priority: priority

    });


    renderProcesses();


    clearInputFields();

}


/* =========================
   DELETE PROCESS
========================= */

function deleteProcess(index) {

    processes.splice(index, 1);

    renderProcesses();

}


/* =========================
   CLEAR ALL
========================= */

function clearProcesses() {

    processes = [];

    renderProcesses();

    resetResults();

}


/* =========================
   CLEAR INPUTS
========================= */

function clearInputFields() {

    document.getElementById("processName").value = "";

    document.getElementById("arrivalTime").value = "";

    document.getElementById("burstTime").value = "";

    document.getElementById("priority").value = "";

    document
        .getElementById("processName")
        .focus();

}


/* =========================
   RUN SCHEDULER
========================= */

async function runScheduler() {

    if (processes.length === 0) {

        alert(
            "Please add at least one process before running the scheduler."
        );

        return;
    }


    const algorithm =
        algorithmSelect.value;


    const quantum =
        Number(quantumInput.value);


    if (
        algorithm === "RR" &&
        (!quantum || quantum <= 0)
    ) {

        alert(
            "Please enter a valid time quantum for Round Robin."
        );

        return;
    }


    runButton.disabled = true;

    runButton.innerHTML = `
        <span class="run-icon">⏳</span>
        <span>Running Scheduler...</span>
    `;


    output.textContent =
        "Running C++ scheduling engine...\n";


    try {

        const response =
            await fetch(
                `${API_URL}/api/run`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            algorithm:
                                algorithm,

                            quantum:
                                quantum,

                            processes:
                                processes

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Backend request failed."
            );

        }


        output.textContent =
            data.output || "No output received.";


        if (data.error) {

            output.textContent +=
                "\n\nERROR:\n" +
                data.error;

        }


        parseAndDisplayResults(
            data.output
        );


    } catch (error) {

        console.error(error);


        output.textContent =
            "ERROR\n\n" +
            error.message +
            "\n\nMake sure the Node.js backend is running on port 5000.";

        alert(
            "Could not connect to the backend."
        );

    } finally {

        runButton.disabled = false;

        runButton.innerHTML = `
            <span class="run-icon">▶</span>
            <span>Run Scheduler</span>
        `;

    }

}


/* =========================
   PARSE C++ OUTPUT
========================= */

function parseAndDisplayResults(text) {

    if (!text) {

        return;
    }


    /*
        These patterns are intentionally flexible.

        Your C++ program can later be connected
        to a cleaner JSON output if required.
    */


    const waitingMatch =
        text.match(
            /Average Waiting Time\s*[:=]\s*([\d.]+)/i
        );


    const turnaroundMatch =
        text.match(
            /Average Turnaround Time\s*[:=]\s*([\d.]+)/i
        );


    const responseMatch =
        text.match(
            /Average Response Time\s*[:=]\s*([\d.]+)/i
        );


    const cpuMatch =
        text.match(
            /CPU Utilization\s*[:=]\s*([\d.]+)%?/i
        );


    if (waitingMatch) {

        document.getElementById(
            "avgWaiting"
        ).textContent =
            waitingMatch[1];

    }


    if (turnaroundMatch) {

        document.getElementById(
            "avgTurnaround"
        ).textContent =
            turnaroundMatch[1];

    }


    if (responseMatch) {

        document.getElementById(
            "avgResponse"
        ).textContent =
            responseMatch[1];

    }


    if (cpuMatch) {

        document.getElementById(
            "cpuUtilization"
        ).textContent =
            cpuMatch[1] + "%";

    }


    parseGanttChart(text);

}


/* =========================
   GANTT CHART
========================= */

function parseGanttChart(text) {

    const gantt =
        document.getElementById(
            "ganttChart"
        );


    /*
        Basic extraction.

        If your C++ output contains
        a Gantt section, this will display
        detected process names.
    */


    const processNames =
        processes.map(
            process => process.name
        );


    const found =
        processNames.filter(
            name =>
                text.includes(name)
        );


    if (found.length === 0) {

        gantt.innerHTML = `
            <div class="gantt-empty">
                Gantt chart data will appear here
                after the scheduler output is parsed.
            </div>
        `;

        return;
    }


    gantt.innerHTML = `

        <div class="gantt-row">

            ${found.map(
                (name, index) => `

                    <div class="gantt-block">

                        ${escapeHTML(name)}

                        <span class="gantt-time">
                            ${index}
                        </span>

                    </div>

                `
            ).join("")}

        </div>

    `;

}


/* =========================
   RESET RESULTS
========================= */

function resetResults() {

    document.getElementById(
        "avgWaiting"
    ).textContent = "--";


    document.getElementById(
        "avgTurnaround"
    ).textContent = "--";


    document.getElementById(
        "avgResponse"
    ).textContent = "--";


    document.getElementById(
        "cpuUtilization"
    ).textContent = "--";


    document.getElementById(
        "ganttChart"
    ).innerHTML = `

        <div class="gantt-empty">
            Run the scheduler to generate
            the Gantt chart.
        </div>

    `;


    output.textContent =
        "Waiting for scheduler...";

}


/* =========================
   SECURITY HELPER
========================= */

function escapeHTML(value) {

    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================
   ALGORITHM CHANGE
========================= */

algorithmSelect.addEventListener(
    "change",
    () => {

        if (
            algorithmSelect.value === "RR"
        ) {

            quantumInput.disabled = false;

        } else {

            quantumInput.disabled = true;

        }

    }
);


/* =========================
   INITIAL STATE
========================= */

quantumInput.disabled = true;

renderProcesses();