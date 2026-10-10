const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

const cppProgram = path.join(
    __dirname,
    "..",
    "CPU-Task_Scheduler.exe"
);

// ==========================================
// ROOT
// ==========================================

app.get("/", (req, res) => {
    res.json({
        message: "CPU Scheduler Backend is working!"
    });
});

// ==========================================
// PARSE C++ RESULT TABLE
// ==========================================

function parseResults(output) {

    const results = [];

    const lines = output.split(/\r?\n/);

    let tableStarted = false;

    for (const line of lines) {

        // Detect result table header
        if (
            line.includes("Task") &&
            line.includes("AT") &&
            line.includes("BT") &&
            line.includes("CT") &&
            line.includes("TAT") &&
            line.includes("WT") &&
            line.includes("RT")
        ) {
            tableStarted = true;
            continue;
        }

        if (!tableStarted) {
            continue;
        }

        // Skip separator
        if (line.includes("----")) {
            continue;
        }

        const trimmed = line.trim();

        if (!trimmed) {
            continue;
        }

        // Stop when analytics/output starts
        if (
            trimmed.includes("Average Waiting") ||
            trimmed.includes("GANTT") ||
            trimmed.includes("SYSTEM ANALYTICS")
        ) {
            break;
        }

        /*
            Expected C++ format:

            P1        0       5       5       5       0       0
        */

        const parts = trimmed.split(/\s+/);

        if (parts.length >= 7) {

            const [
                name,
                arrivalTime,
                burstTime,
                completionTime,
                turnaroundTime,
                waitingTime,
                responseTime
            ] = parts;

            if (
                !isNaN(Number(arrivalTime)) &&
                !isNaN(Number(burstTime)) &&
                !isNaN(Number(completionTime))
            ) {

                results.push({
                    name,
                    arrivalTime: Number(arrivalTime),
                    burstTime: Number(burstTime),
                    completionTime: Number(completionTime),
                    turnaroundTime: Number(turnaroundTime),
                    waitingTime: Number(waitingTime),
                    responseTime: Number(responseTime)
                });
            }
        }
    }

    return results;
}

// ==========================================
// PARSE ANALYTICS
// ==========================================

function parseAnalytics(output) {

    const analytics = {};

    const patterns = {

        avgWaiting:
            /Average Waiting Time\s*:\s*([0-9.]+)/,

        avgTurnaround:
            /Average Turnaround Time\s*:\s*([0-9.]+)/,

        avgResponse:
            /Average Response Time\s*:\s*([0-9.]+)/,

        cpuUtilization:
            /CPU Utilization\s*:\s*([0-9.]+)/,

        throughput:
            /Throughput\s*:\s*([0-9.]+)/,

        contextSwitches:
            /Context Switches\s*:\s*(\d+)/,

        totalExecutionTime:
            /Total Execution Time\s*:\s*(\d+)/
    };

    for (const [key, regex] of Object.entries(patterns)) {

        const match = output.match(regex);

        if (match) {

            analytics[key] =
                Number(match[1]);
        }
    }

    return analytics;
}

// ==========================================
// PARSE GANTT CHART
// ==========================================

function parseGantt(output) {

    const lines = output.split(/\r?\n/);

    const gantt = [];

    let ganttStarted = false;

    let taskLine = "";
    let timeLine = "";

    for (const line of lines) {

        if (line.includes("GANTT CHART")) {
            ganttStarted = true;
            continue;
        }

        if (!ganttStarted) {
            continue;
        }

        if (line.trim().startsWith("|")) {
            taskLine = line.trim();
        }

        // Timeline line starts with a number
        if (
            /^\s*\d+/.test(line) &&
            !line.includes("SYSTEM")
        ) {
            timeLine = line.trim();
        }
    }

    if (!taskLine || !timeLine) {
        return [];
    }

    // Extract task names between |
    const taskMatches =
        taskLine.match(/\|\s*([^|]+?)\s*(?=\|)/g);

    if (!taskMatches) {
        return [];
    }

    const taskNames = taskMatches.map(item =>
        item
            .replace(/\|/g, "")
            .trim()
    );

    // Extract all numbers from timeline
    const times =
        timeLine.match(/\d+/g)?.map(Number) || [];

    if (times.length < 2) {
        return [];
    }

    for (
        let i = 0;
        i < taskNames.length && i + 1 < times.length;
        i++
    ) {

        gantt.push({
            task: taskNames[i],
            start: times[i],
            end: times[i + 1]
        });
    }

    return gantt;
}

// ==========================================
// RUN C++ PROGRAM
// ==========================================

app.post("/api/run", (req, res) => {

    const {
        algorithm,
        quantum,
        processes
    } = req.body;

    // ------------------------------
    // Validation
    // ------------------------------

    if (
        !algorithm ||
        !processes ||
        processes.length === 0
    ) {

        return res.status(400).json({
            success: false,
            error: "Algorithm and processes are required."
        });
    }

    // ------------------------------
    // Check executable
    // ------------------------------

    if (!fs.existsSync(cppProgram)) {

        return res.status(500).json({
            success: false,
            error:
                "CPU-Task_Scheduler.exe not found."
        });
    }

    // ------------------------------
    // Menu mapping
    // ------------------------------

    const menu = {

        FCFS: "3",

        SJF: "4",

        SRTF: "5",

        PRIORITY: "6",

        RR: "7"
    };

    if (!menu[algorithm]) {

        return res.status(400).json({
            success: false,
            error: "Invalid algorithm."
        });
    }

    // ==========================================
    // CREATE INPUT FOR C++ PROGRAM
    // ==========================================

    let input = "";

    for (const process of processes) {

        // Add Task
        input += "1\n";

        // Task Name
        input += `${process.name}\n`;

        // Arrival Time
        input += `${process.arrival}\n`;

        // Burst Time
        input += `${process.burst}\n`;

        // Priority
        input += `${process.priority}\n`;
    }

    // Select algorithm
    input += `${menu[algorithm]}\n`;

    // Round Robin requires quantum
    if (algorithm === "RR") {

        input += `${quantum}\n`;
    }

    // Exit
    input += "9\n";

    console.log(
        "\n========== C++ INPUT =========="
    );

    console.log(input);

    // ==========================================
    // START C++
    // ==========================================

    const cpp = spawn(
        cppProgram,
        [],
        {
            cwd: path.dirname(cppProgram)
        }
    );

    let output = "";
    let errorOutput = "";

    // stdout
    cpp.stdout.on("data", (data) => {

        output += data.toString();
    });

    // stderr
    cpp.stderr.on("data", (data) => {

        errorOutput += data.toString();
    });

    // Spawn error
    cpp.on("error", (error) => {

        console.error(
            "C++ execution error:",
            error
        );

        if (!res.headersSent) {

            res.status(500).json({

                success: false,

                error: error.message
            });
        }
    });

    // ==========================================
    // C++ FINISHED
    // ==========================================

    cpp.on("close", (code) => {

        console.log(
            "C++ finished with code:",
            code
        );

        console.log(
            "\n========== C++ OUTPUT =========="
        );

        console.log(output);

        // Parse C++ output
        const results =
            parseResults(output);

        const analytics =
            parseAnalytics(output);

        const gantt =
            parseGantt(output);

        // ==========================================
        // SEND STRUCTURED JSON TO REACT
        // ==========================================

        res.json({

            success: code === 0,

            algorithm,

            quantum:
                algorithm === "RR"
                    ? quantum
                    : null,

            results,

            analytics,

            gantt,

            output,

            error: errorOutput
        });
    });

    // Send input to C++
    cpp.stdin.write(input);

    cpp.stdin.end();
});

// ==========================================
// START SERVER
// ==========================================

app.listen(
    5000,
    "127.0.0.1",
    () => {

        console.log(
            "===================================="
        );

        console.log(
            "CPU Scheduler Backend"
        );

        console.log(
            "Server: http://127.0.0.1:5000"
        );

        console.log(
            "===================================="
        );
    }
);