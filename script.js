const apiBaseUrl = "https://perspective-task-backend.onrender.com";

let tasks = [];
let currentTaskIndex = 0; // Start with Task 0 (Showcase)
let participantName = "";
let selectedAngle = null; // Track selected angle for actual tasks
let isDragging = false; // Track dragging state
let dragStartAngle = null; // Store the initial angle of the drag
let dragStartMouseAngle = null; // Store the mouse angle at drag start

const INSTRUCTION_TEXT = `
    This is a test of your ability to imagine different perspectives or orientations in space.
    For Task 0, the line will already be set to the correct position as an example.
    For the actual tasks, you will need to drag the line to indicate the direction.
`;

const canvas = document.getElementById("circleCanvas");
const ctx = canvas.getContext("2d");
let radius = 150; // Circle radius, will adjust dynamically
resizeCanvas();

// Adjust canvas size responsively
window.addEventListener("resize", resizeCanvas);
function resizeCanvas() {
    canvas.width = Math.min(window.innerWidth * 0.8, 400);
    canvas.height = canvas.width;
    radius = canvas.width / 3;

    if (tasks.length > 0) {
        if (currentTaskIndex === 0) {
            drawShowcaseCircle(tasks[0]);
        } else {
            drawTaskCircle(tasks[currentTaskIndex]);
        }
    }
}

// Fetch tasks and automatically load the showcase example
async function fetchTasks() {
    try {
        const response = await fetch(`${apiBaseUrl}/tasks`);
        tasks = await response.json();

        if (!tasks || tasks.length === 0) {
            alert("No tasks available from the server.");
            return;
        }

        // Automatically load Task 0 (Showcase)
        drawShowcaseCircle(tasks[0]);

        // Enable "Proceed to Tasks" button
        document.getElementById("proceedToTask").disabled = false;
    } catch (error) {
        alert("Could not load tasks. Please try again.");
        console.error("Error fetching tasks:", error);
    }
}

// Start task flow
document.getElementById("startTask").addEventListener("click", () => {
    participantName = document.getElementById("name").value;
    if (!participantName) {
        alert("Please enter your name.");
        return;
    }
    document.getElementById("taskForm").style.display = "none";
    document.getElementById("instructionSection").style.display = "block";
    document.getElementById("instructionsText").innerText = INSTRUCTION_TEXT;

    // Fetch tasks and enable proceeding
    fetchTasks();
});

// Proceed to Task 0 (Showcase Example)
document.getElementById("proceedToTask").addEventListener("click", () => {
    currentTaskIndex = 0; // Start with Task 0
    if (tasks[0]) {
        drawShowcaseCircle(tasks[0]); // Showcase example
        document.getElementById("instructionSection").style.display = "none";
        document.getElementById("taskSection").style.display = "block";
        updateTaskDescription(tasks[0]); // Add task text
    } else {
        alert("Task 0 is not available. Please try again later.");
    }
});

// Start the actual tasks
document.getElementById("startActualTasks").addEventListener("click", () => {
    currentTaskIndex = 1; // Start Task 1
    if (tasks[currentTaskIndex]) {
        drawTaskCircle(tasks[currentTaskIndex]);
        document.getElementById("startActualTasks").style.display = "none";
        document.getElementById("submitResponse").style.display = "block";
        updateTaskDescription(tasks[currentTaskIndex]); // Add task text
    } else {
        alert("No further tasks available.");
    }
});

// Submit response for actual tasks
document.getElementById("submitResponse").addEventListener("click", async () => {
    if (selectedAngle === null) {
        alert("Drag the line to set your input.");
        return;
    }

    const roundedAngle = Math.round(selectedAngle);
    const normalizedAngle = (roundedAngle + 360) % 360; // Normalize angle

    const task = tasks[currentTaskIndex];
    const payload = {
        name: participantName,
        task_id: task.id,
        logged_angle: normalizedAngle,
    };
    console.log("Submitting payload:", payload);

    try {
        const response = await fetch(`${apiBaseUrl}/submit_response`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (response.status === 204) {
            // Move to the next task
            currentTaskIndex++;
            if (currentTaskIndex < tasks.length) {
                drawTaskCircle(tasks[currentTaskIndex]);
                updateTaskDescription(tasks[currentTaskIndex]); // Add task text
            } else {
                alert("All tasks completed. Thank you!");
                document.getElementById("taskSection").style.display = "none";
                fetchResults();
            }
        } else {
            const errorText = await response.text();
            console.error("Error response from server:", errorText);
            alert("Failed to submit response. Please try again.");
        }
    } catch (error) {
        alert("Failed to submit response. Please try again later.");
        console.error("Error submitting response:", error);
    }
});

// Draw the circle and other helpers
function drawBaseCircle(from, to) {
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height / 2);
    ctx.lineTo(canvas.width / 2, canvas.height / 2 - radius);
    ctx.strokeStyle = "black";
    ctx.stroke();

    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(from, canvas.width / 2, canvas.height / 2);
    ctx.fillText(to, canvas.width / 2, canvas.height / 2 - radius - 20);
}

function drawLineAndLabel(angle, label, color) {
    const lineEndX =
        canvas.width / 2 + radius * Math.cos((angle * Math.PI) / 180);
    const lineEndY =
        canvas.height / 2 - radius * Math.sin((angle * Math.PI) / 180);

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height / 2);
    ctx.lineTo(lineEndX, lineEndY);
    ctx.strokeStyle = color;
    ctx.stroke();

    const labelX =
        canvas.width / 2 + (radius + 20) * Math.cos((angle * Math.PI) / 180);
    const labelY =
        canvas.height / 2 - (radius + 20) * Math.sin((angle * Math.PI) / 180);

    ctx.fillText(label, labelX, labelY);
}