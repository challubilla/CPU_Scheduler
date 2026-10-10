#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <queue>
#include <iomanip>

using namespace std;

struct Task
{
    int id;
    string name;
    int arrivalTime;
    int burstTime;
    int priority;
};

struct Result
{
    string name;
    int arrivalTime;
    int burstTime;
    int completionTime;
    int turnaroundTime;
    int waitingTime;
    int responseTime;
};

struct Segment
{
    string taskName;
    int startTime;
    int endTime;
};

struct Analytics
{
    double avgWaiting;
    double avgTurnaround;
    double avgResponse;

    double cpuUtilization;
    double throughput;

    int contextSwitches;
    int totalExecutionTime;
};

void addTask(vector<Task>& tasks)
{
    Task task;

    task.id = tasks.size() + 1;

    cout << "\nEnter Task Name: ";
    cin >> task.name;

    cout << "Enter Arrival Time: ";
    cin >> task.arrivalTime;

    cout << "Enter Burst Time: ";
    cin >> task.burstTime;

    cout << "Enter Priority: ";
    cin >> task.priority;

    if (task.arrivalTime < 0 ||
        task.burstTime <= 0 ||
        task.priority < 0)
    {
        cout << "\nInvalid task values.\n";
        return;
    }

    tasks.push_back(task);

    cout << "\nTask added successfully!\n";
}

void displayTasks(const vector<Task>& tasks)
{
    if (tasks.empty())
    {
        cout << "\nNo tasks available.\n";
        return;
    }

    cout << "\n================ ALL TASKS ================\n";

    cout << left
         << setw(8) << "ID"
         << setw(15) << "Name"
         << setw(10) << "Arrival"
         << setw(10) << "Burst"
         << setw(10) << "Priority"
         << endl;

    cout << "---------------------------------------------------------\n";

    for (const Task& task : tasks)
    {
        cout << left
             << setw(8) << task.id
             << setw(15) << task.name
             << setw(10) << task.arrivalTime
             << setw(10) << task.burstTime
             << setw(10) << task.priority
             << endl;
    }
}

vector<Task> sortByArrival(const vector<Task>& tasks)
{
    vector<Task> sorted = tasks;

    sort(sorted.begin(), sorted.end(),
         [](const Task& a, const Task& b)
         {
             if (a.arrivalTime == b.arrivalTime)
                 return a.id < b.id;

             return a.arrivalTime < b.arrivalTime;
         });

    return sorted;
}

// ============================================================
// PRINT RESULTS
// ============================================================

void printResults(const vector<Result>& results)
{
    if (results.empty())
        return;

    double totalWT = 0;
    double totalTAT = 0;
    double totalRT = 0;

    cout << "\n";

    cout << left
         << setw(10) << "Task"
         << setw(8) << "AT"
         << setw(8) << "BT"
         << setw(8) << "CT"
         << setw(8) << "TAT"
         << setw(8) << "WT"
         << setw(8) << "RT"
         << endl;

    cout << "--------------------------------------------------------\n";

    for (const Result& r : results)
    {
        cout << left
             << setw(10) << r.name
             << setw(8) << r.arrivalTime
             << setw(8) << r.burstTime
             << setw(8) << r.completionTime
             << setw(8) << r.turnaroundTime
             << setw(8) << r.waitingTime
             << setw(8) << r.responseTime
             << endl;

        totalWT += r.waitingTime;
        totalTAT += r.turnaroundTime;
        totalRT += r.responseTime;
    }

    cout << fixed << setprecision(2);

    cout << "\nAverage Waiting Time    : "
         << totalWT / results.size();

    cout << "\nAverage Turnaround Time : "
         << totalTAT / results.size();

    cout << "\nAverage Response Time   : "
         << totalRT / results.size();

    cout << "\n";
}

// ============================================================
// FCFS
// ============================================================

vector<Result> FCFS(const vector<Task>& tasks,
                    vector<Segment>& timeline)
{
    vector<Task> sorted = sortByArrival(tasks);

    vector<Result> results;

    int currentTime = 0;

    for (const Task& task : sorted)
    {
        if (currentTime < task.arrivalTime)
        {
            currentTime = task.arrivalTime;
        }

        int startTime = currentTime;

        int completionTime =
            startTime + task.burstTime;

        int turnaroundTime =
            completionTime - task.arrivalTime;

        int waitingTime =
            turnaroundTime - task.burstTime;

        int responseTime =
            startTime - task.arrivalTime;

        results.push_back({
            task.name,
            task.arrivalTime,
            task.burstTime,
            completionTime,
            turnaroundTime,
            waitingTime,
            responseTime
        });

        timeline.push_back({
            task.name,
            startTime,
            completionTime
        });

        currentTime = completionTime;
    }

    return results;
}

// ============================================================
// SJF NON-PREEMPTIVE
// ============================================================

vector<Result> SJF(const vector<Task>& tasks,
                   vector<Segment>& timeline)
{
    vector<Task> remaining = tasks;

    vector<Result> results;

    int currentTime = 0;

    while (!remaining.empty())
    {
        int selected = -1;

        for (int i = 0;
             i < (int)remaining.size();
             i++)
        {
            if (remaining[i].arrivalTime <= currentTime)
            {
                if (selected == -1 ||
                    remaining[i].burstTime <
                    remaining[selected].burstTime ||
                    (remaining[i].burstTime ==
                     remaining[selected].burstTime &&
                     remaining[i].arrivalTime <
                     remaining[selected].arrivalTime))
                {
                    selected = i;
                }
            }
        }

        if (selected == -1)
        {
            currentTime++;
            continue;
        }

        Task task = remaining[selected];

        int startTime = currentTime;

        int completionTime =
            startTime + task.burstTime;

        int turnaroundTime =
            completionTime - task.arrivalTime;

        int waitingTime =
            turnaroundTime - task.burstTime;

        int responseTime =
            startTime - task.arrivalTime;

        results.push_back({
            task.name,
            task.arrivalTime,
            task.burstTime,
            completionTime,
            turnaroundTime,
            waitingTime,
            responseTime
        });

        timeline.push_back({
            task.name,
            startTime,
            completionTime
        });

        currentTime = completionTime;

        remaining.erase(
            remaining.begin() + selected);
    }

    return results;
}

// ============================================================
// SRTF
// ============================================================

vector<Result> SRTF(const vector<Task>& tasks,
                     vector<Segment>& timeline)
{
    int n = tasks.size();

    vector<int> remainingTime(n);

    vector<int> completionTime(n, 0);

    vector<int> firstStart(n, -1);

    for (int i = 0; i < n; i++)
    {
        remainingTime[i] =
            tasks[i].burstTime;
    }

    int completed = 0;

    int currentTime = 0;

    string currentTask = "";

    int segmentStart = 0;

    while (completed < n)
    {
        int selected = -1;

        for (int i = 0; i < n; i++)
        {
            if (tasks[i].arrivalTime <= currentTime &&
                remainingTime[i] > 0)
            {
                if (selected == -1 ||
                    remainingTime[i] <
                    remainingTime[selected] ||
                    (remainingTime[i] ==
                     remainingTime[selected] &&
                     tasks[i].arrivalTime <
                     tasks[selected].arrivalTime))
                {
                    selected = i;
                }
            }
        }

        if (selected == -1)
        {
            currentTime++;
            continue;
        }

        string selectedName =
            tasks[selected].name;

        if (currentTask != selectedName)
        {
            if (currentTask != "")
            {
                timeline.push_back({
                    currentTask,
                    segmentStart,
                    currentTime
                });
            }

            currentTask = selectedName;
            segmentStart = currentTime;
        }

        if (firstStart[selected] == -1)
        {
            firstStart[selected] =
                currentTime;
        }

        remainingTime[selected]--;

        currentTime++;

        if (remainingTime[selected] == 0)
        {
            completionTime[selected] =
                currentTime;

            completed++;
        }
    }

    if (currentTask != "")
    {
        timeline.push_back({
            currentTask,
            segmentStart,
            currentTime
        });
    }

    vector<Result> results;

    for (int i = 0; i < n; i++)
    {
        int turnaroundTime =
            completionTime[i] -
            tasks[i].arrivalTime;

        int waitingTime =
            turnaroundTime -
            tasks[i].burstTime;

        int responseTime =
            firstStart[i] -
            tasks[i].arrivalTime;

        results.push_back({
            tasks[i].name,
            tasks[i].arrivalTime,
            tasks[i].burstTime,
            completionTime[i],
            turnaroundTime,
            waitingTime,
            responseTime
        });
    }

    return results;
}

// ============================================================
// PRIORITY SCHEDULING
// Lower number = Higher Priority
// ============================================================

vector<Result> PriorityScheduling(
    const vector<Task>& tasks,
    vector<Segment>& timeline)
{
    vector<Task> remaining = tasks;

    vector<Result> results;

    int currentTime = 0;

    while (!remaining.empty())
    {
        int selected = -1;

        for (int i = 0;
             i < (int)remaining.size();
             i++)
        {
            if (remaining[i].arrivalTime <= currentTime)
            {
                if (selected == -1 ||
                    remaining[i].priority <
                    remaining[selected].priority ||
                    (remaining[i].priority ==
                     remaining[selected].priority &&
                     remaining[i].arrivalTime <
                     remaining[selected].arrivalTime))
                {
                    selected = i;
                }
            }
        }

        if (selected == -1)
        {
            currentTime++;
            continue;
        }

        Task task = remaining[selected];

        int startTime = currentTime;

        int completionTime =
            startTime + task.burstTime;

        int turnaroundTime =
            completionTime - task.arrivalTime;

        int waitingTime =
            turnaroundTime - task.burstTime;

        int responseTime =
            startTime - task.arrivalTime;

        results.push_back({
            task.name,
            task.arrivalTime,
            task.burstTime,
            completionTime,
            turnaroundTime,
            waitingTime,
            responseTime
        });

        timeline.push_back({
            task.name,
            startTime,
            completionTime
        });

        currentTime = completionTime;

        remaining.erase(
            remaining.begin() + selected);
    }

    return results;
}

// ============================================================
// ROUND ROBIN
// ============================================================

vector<Result> RoundRobin(
    const vector<Task>& tasks,
    int quantum,
    vector<Segment>& timeline)
{
    int n = tasks.size();

    vector<Task> sorted =
        sortByArrival(tasks);

    vector<int> remaining(n);

    vector<int> completion(n, 0);

    vector<int> response(n, -1);

    for (int i = 0; i < n; i++)
    {
        remaining[i] =
            sorted[i].burstTime;
    }

    queue<int> readyQueue;

    int currentTime = 0;

    int nextTask = 0;

    int completed = 0;

    while (completed < n)
    {
        while (nextTask < n &&
               sorted[nextTask].arrivalTime <=
               currentTime)
        {
            readyQueue.push(nextTask);
            nextTask++;
        }

        if (readyQueue.empty())
        {
            if (nextTask < n)
            {
                currentTime =
                    sorted[nextTask].arrivalTime;
                continue;
            }
        }

        int index = readyQueue.front();

        readyQueue.pop();

        if (response[index] == -1)
        {
            response[index] =
                currentTime -
                sorted[index].arrivalTime;
        }

        int startTime = currentTime;

        int executionTime =
            min(quantum, remaining[index]);

        remaining[index] -=
            executionTime;

        currentTime += executionTime;

        timeline.push_back({
            sorted[index].name,
            startTime,
            currentTime
        });

        while (nextTask < n &&
               sorted[nextTask].arrivalTime <=
               currentTime)
        {
            readyQueue.push(nextTask);
            nextTask++;
        }

        if (remaining[index] > 0)
        {
            readyQueue.push(index);
        }
        else
        {
            completion[index] =
                currentTime;

            completed++;
        }
    }

    vector<Result> results;

    for (int i = 0; i < n; i++)
    {
        int turnaroundTime =
            completion[i] -
            sorted[i].arrivalTime;

        int waitingTime =
            turnaroundTime -
            sorted[i].burstTime;

        results.push_back({
            sorted[i].name,
            sorted[i].arrivalTime,
            sorted[i].burstTime,
            completion[i],
            turnaroundTime,
            waitingTime,
            response[i]
        });
    }

    return results;
}

// ============================================================
// GANTT CHART
// ============================================================

void displayGanttChart(
    const vector<Segment>& timeline)
{
    if (timeline.empty())
        return;

    cout << "\n\n================ GANTT CHART ================\n\n";

    cout << " ";

    for (const Segment& s : timeline)
    {
        cout << "--------";
    }

    cout << "-\n";

    cout << "|";

    for (const Segment& s : timeline)
    {
        cout << setw(7)
             << s.taskName
             << " |";
    }

    cout << "\n ";

    for (const Segment& s : timeline)
    {
        cout << "--------";
    }

    cout << "-\n";

    cout << timeline[0].startTime;

    for (const Segment& s : timeline)
    {
        cout << setw(9)
             << s.endTime;
    }

    cout << "\n";
}

// ============================================================
// CALCULATE CONTEXT SWITCHES
// ============================================================

int calculateContextSwitches(
    const vector<Segment>& timeline)
{
    if (timeline.size() <= 1)
        return 0;

    int switches = 0;

    for (size_t i = 1;
         i < timeline.size();
         i++)
    {
        if (timeline[i - 1].taskName !=
            timeline[i].taskName)
        {
            switches++;
        }
    }

    return switches;
}

// ============================================================
// CALCULATE ANALYTICS
// ============================================================

Analytics calculateAnalytics(
    const vector<Result>& results,
    const vector<Segment>& timeline,
    const vector<Task>& tasks)
{
    Analytics a{};

    if (results.empty())
        return a;

    double totalWT = 0;
    double totalTAT = 0;
    double totalRT = 0;

    int totalBurstTime = 0;

    int firstArrival = tasks[0].arrivalTime;

    int lastCompletion = 0;

    for (const Result& r : results)
    {
        totalWT += r.waitingTime;
        totalTAT += r.turnaroundTime;
        totalRT += r.responseTime;

        if (r.completionTime > lastCompletion)
            lastCompletion = r.completionTime;
    }

    for (const Task& task : tasks)
    {
        totalBurstTime +=
            task.burstTime;

        if (task.arrivalTime < firstArrival)
            firstArrival = task.arrivalTime;
    }

    double totalTime =
        lastCompletion - firstArrival;

    a.avgWaiting =
        totalWT / results.size();

    a.avgTurnaround =
        totalTAT / results.size();

    a.avgResponse =
        totalRT / results.size();

    a.totalExecutionTime =
        totalTime;

    if (totalTime > 0)
    {
        a.cpuUtilization =
            ((double)totalBurstTime /
             totalTime) * 100.0;

        a.throughput =
            ((double)tasks.size() /
             totalTime);
    }

    a.contextSwitches =
        calculateContextSwitches(timeline);

    return a;
}

// ============================================================
// DISPLAY ANALYTICS
// ============================================================

void displayAnalytics(
    const Analytics& a)
{
    cout << "\n\n============================================\n";
    cout << "             SYSTEM ANALYTICS\n";
    cout << "============================================\n";

    cout << fixed << setprecision(2);

    cout << "Average Waiting Time    : "
         << a.avgWaiting << "\n";

    cout << "Average Turnaround Time : "
         << a.avgTurnaround << "\n";

    cout << "Average Response Time   : "
         << a.avgResponse << "\n";

    cout << "CPU Utilization         : "
         << a.cpuUtilization << "%\n";

    cout << "Throughput              : "
         << a.throughput
         << " tasks/unit time\n";

    cout << "Context Switches        : "
         << a.contextSwitches << "\n";

    cout << "Total Execution Time    : "
         << a.totalExecutionTime << "\n";

    cout << "============================================\n";
}

// ============================================================
// RUN FCFS
// ============================================================

void runFCFS(const vector<Task>& tasks)
{
    vector<Segment> timeline;

    cout << "\n========== FCFS SCHEDULING ==========\n";

    vector<Result> results =
        FCFS(tasks, timeline);

    printResults(results);

    displayGanttChart(timeline);

    Analytics analytics =
        calculateAnalytics(
            results,
            timeline,
            tasks);

    displayAnalytics(analytics);
}

// ============================================================
// RUN SJF
// ============================================================

void runSJF(const vector<Task>& tasks)
{
    vector<Segment> timeline;

    cout << "\n========== SJF SCHEDULING ==========\n";

    vector<Result> results =
        SJF(tasks, timeline);

    printResults(results);

    displayGanttChart(timeline);

    Analytics analytics =
        calculateAnalytics(
            results,
            timeline,
            tasks);

    displayAnalytics(analytics);
}

// ============================================================
// RUN SRTF
// ============================================================

void runSRTF(const vector<Task>& tasks)
{
    vector<Segment> timeline;

    cout << "\n========== SRTF SCHEDULING ==========\n";

    vector<Result> results =
        SRTF(tasks, timeline);

    printResults(results);

    displayGanttChart(timeline);

    Analytics analytics =
        calculateAnalytics(
            results,
            timeline,
            tasks);

    displayAnalytics(analytics);
}

// ============================================================
// RUN PRIORITY
// ============================================================

void runPriority(const vector<Task>& tasks)
{
    vector<Segment> timeline;

    cout << "\n========== PRIORITY SCHEDULING ==========\n";

    vector<Result> results =
        PriorityScheduling(
            tasks,
            timeline);

    printResults(results);

    displayGanttChart(timeline);

    Analytics analytics =
        calculateAnalytics(
            results,
            timeline,
            tasks);

    displayAnalytics(analytics);
}

// ============================================================
// RUN ROUND ROBIN
// ============================================================

void runRoundRobin(const vector<Task>& tasks)
{
    int quantum;

    cout << "\nEnter Time Quantum: ";
    cin >> quantum;

    if (quantum <= 0)
    {
        cout << "\nInvalid time quantum.\n";
        return;
    }

    vector<Segment> timeline;

    cout << "\n========== ROUND ROBIN ==========\n";

    vector<Result> results =
        RoundRobin(
            tasks,
            quantum,
            timeline);

    printResults(results);

    displayGanttChart(timeline);

    Analytics analytics =
        calculateAnalytics(
            results,
            timeline,
            tasks);

    displayAnalytics(analytics);
}

// ============================================================
// COMPARE ALL ALGORITHMS
// ============================================================

void compareAlgorithms(
    const vector<Task>& tasks)
{
    if (tasks.empty())
    {
        cout << "\nNo tasks available.\n";
        return;
    }

    int quantum;

    cout << "\nEnter Time Quantum for Round Robin: ";
    cin >> quantum;

    if (quantum <= 0)
    {
        cout << "\nInvalid time quantum.\n";
        return;
    }

    vector<Segment> fcfsTimeline;
    vector<Segment> sjfTimeline;
    vector<Segment> srtfTimeline;
    vector<Segment> priorityTimeline;
    vector<Segment> rrTimeline;

    vector<Result> fcfs =
        FCFS(tasks, fcfsTimeline);

    vector<Result> sjf =
        SJF(tasks, sjfTimeline);

    vector<Result> srtf =
        SRTF(tasks, srtfTimeline);

    vector<Result> priority =
        PriorityScheduling(
            tasks,
            priorityTimeline);

    vector<Result> rr =
        RoundRobin(
            tasks,
            quantum,
            rrTimeline);

    Analytics a1 =
        calculateAnalytics(
            fcfs,
            fcfsTimeline,
            tasks);

    Analytics a2 =
        calculateAnalytics(
            sjf,
            sjfTimeline,
            tasks);

    Analytics a3 =
        calculateAnalytics(
            srtf,
            srtfTimeline,
            tasks);

    Analytics a4 =
        calculateAnalytics(
            priority,
            priorityTimeline,
            tasks);

    Analytics a5 =
        calculateAnalytics(
            rr,
            rrTimeline,
            tasks);

    cout << "\n\n";
    cout << "==============================================================\n";
    cout << "                  ALGORITHM COMPARISON\n";
    cout << "==============================================================\n";

    cout << left
         << setw(15) << "Algorithm"
         << setw(12) << "Avg WT"
         << setw(12) << "Avg TAT"
         << setw(12) << "Avg RT"
         << setw(12) << "CPU %"
         << setw(12) << "Switches"
         << endl;

    cout << "--------------------------------------------------------------\n";

    cout << left
         << setw(15) << "FCFS"
         << setw(12) << fixed << setprecision(2)
         << a1.avgWaiting
         << setw(12)
         << a1.avgTurnaround
         << setw(12)
         << a1.avgResponse
         << setw(12)
         << a1.cpuUtilization
         << setw(12)
         << a1.contextSwitches
         << endl;

    cout << left
         << setw(15) << "SJF"
         << setw(12)
         << a2.avgWaiting
         << setw(12)
         << a2.avgTurnaround
         << setw(12)
         << a2.avgResponse
         << setw(12)
         << a2.cpuUtilization
         << setw(12)
         << a2.contextSwitches
         << endl;

    cout << left
         << setw(15) << "SRTF"
         << setw(12)
         << a3.avgWaiting
         << setw(12)
         << a3.avgTurnaround
         << setw(12)
         << a3.avgResponse
         << setw(12)
         << a3.cpuUtilization
         << setw(12)
         << a3.contextSwitches
         << endl;

    cout << left
         << setw(15) << "Priority"
         << setw(12)
         << a4.avgWaiting
         << setw(12)
         << a4.avgTurnaround
         << setw(12)
         << a4.avgResponse
         << setw(12)
         << a4.cpuUtilization
         << setw(12)
         << a4.contextSwitches
         << endl;

    cout << left
         << setw(15) << "Round Robin"
         << setw(12)
         << a5.avgWaiting
         << setw(12)
         << a5.avgTurnaround
         << setw(12)
         << a5.avgResponse
         << setw(12)
         << a5.cpuUtilization
         << setw(12)
         << a5.contextSwitches
         << endl;

    cout << "==============================================================\n";

    cout << "\nRound Robin Quantum: "
         << quantum << "\n";
}

// ============================================================
// MAIN
// ============================================================

int main()
{
    vector<Task> tasks;

    int choice;

    cout << "============================================\n";
    cout << "          CPU TASK SCHEDULER\n";

    cout << "============================================\n";

    do
    {
        cout << "\n========== MAIN MENU ==========\n";

        cout << "1. Add Task\n";
        cout << "2. Display All Tasks\n";
        cout << "3. FCFS Scheduling\n";
        cout << "4. SJF Scheduling\n";
        cout << "5. SRTF Scheduling\n";
        cout << "6. Priority Scheduling\n";
        cout << "7. Round Robin Scheduling\n";
        cout << "8. Compare All Algorithms\n";
        cout << "9. Exit\n";

        cout << "===============================\n";

        cout << "Enter your choice: ";
        cin >> choice;

        switch (choice)
        {
            case 1:
                addTask(tasks);
                break;

            case 2:
                displayTasks(tasks);
                break;

            case 3:
                if (!tasks.empty())
                    runFCFS(tasks);
                else
                    cout << "\nNo tasks available.\n";
                break;

            case 4:
                if (!tasks.empty())
                    runSJF(tasks);
                else
                    cout << "\nNo tasks available.\n";
                break;

            case 5:
                if (!tasks.empty())
                    runSRTF(tasks);
                else
                    cout << "\nNo tasks available.\n";
                break;

            case 6:
                if (!tasks.empty())
                    runPriority(tasks);
                else
                    cout << "\nNo tasks available.\n";
                break;

            case 7:
                if (!tasks.empty())
                    runRoundRobin(tasks);
                else
                    cout << "\nNo tasks available.\n";
                break;

            case 8:
                compareAlgorithms(tasks);
                break;

            case 9:
                cout << "\nExiting CPU Task Scheduler...\n";
                break;

            default:
                cout << "\nInvalid choice! Try again.\n";
        }

    } while (choice != 9);

    return 0;
}