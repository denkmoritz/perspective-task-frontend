const apiBaseUrl = "https://perspective-task-backend.onrender.com";

let tasks = [];
let currentTaskIndex = 0; // Start with Task 0 (Showcase)
let participantName = "";
let selectedAngle = null; // Track selected angle for actual tasks
let isDragging = false; // Track dragging state

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

// Fetch tasks
async function fetchTasks() {
    try {
        const response = await fetch(`${apiBaseUrl}/tasks`);
        tasks = await response.json();

        if (tasks.length === 0) {
            alert("No tasks available from the server.");
            return;
        }

        // Enable "Proceed to Tasks" button after successful fetch
        document.getElementById("proceedToTask").disabled = false;
    } catch (error) {
        alert("Could not load tasks. Please try again.");
        console.error("Error fetching tasks:", error);
    }
}

// Start task
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
document
    .getElementById("proceedToTask")
    .addEventListener("click", () => {
        currentTaskIndex = 0; // Start with Task 0
        drawShowcaseCircle(tasks[0]);
        document.getElementById("instructionSection").style.display = "none";
        document.getElementById("taskSection").style.display = "block";
    });

// Start the actual tasks
document
    .getElementById("startActualTasks")
    .addEventListener("click", () => {
        currentTaskIndex = 1; // Start Task 1
        drawTaskCircle(tasks[currentTaskIndex]);
        document.getElementById("startActualTasks").style.display = "none";
        document.getElementById("submitResponse").style.display = "block";
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
    try {
        const response = await fetch(`${apiBaseUrl}/submit_response`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: participantName,
                task_id: task.id,
                logged_angle: normalizedAngle,
            }),
        });

        if (response.status === 204) {
            // Move to the next task
            currentTaskIndex++;
            if (currentTaskIndex < tasks.length) {
                drawTaskCircle(tasks[currentTaskIndex]);
            } else {
                alert("All tasks completed. Thank you!");
                document.getElementById("taskSection").style.display = "none";
                fetchResults();
            }
        } else {
            alert("Failed to submit response. Please try again.");
        }
    } catch (error) {
        alert("Failed to submit response. Please try again later.");
        console.error("Error submitting response:", error);
    }
});

// Showcase Example (Task 0)
function drawShowcaseCircle(task) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the circle and north line
    drawBaseCircle(task.from, task.to);

    // Pre-set the line to the correct angle
    const angle = (90 - task.angle + 360) % 360;
    drawLineAndLabel(angle, task.target, "green");
    document.getElementById("startActualTasks").style.display = "block";
    document.getElementById("submitResponse").style.display = "none";
}

// Actual Tasks (Task 1+)
function drawTaskCircle(task) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the circle and north line
    drawBaseCircle(task.from, task.to);

    // Add drag event listeners for the task
    canvas.addEventListener("mousedown", startDrag);
    canvas.addEventListener("mousemove", dragLine);
    canvas.addEventListener("mouseup", endDrag);
    canvas.addEventListener("mouseleave", endDrag);

    // Reset the selected angle for dragging
    selectedAngle = null;
}

// Draw the base circle and labels
function drawBaseCircle(from, to) {
    // Draw the circle
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw the north line
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height / 2);
    ctx.lineTo(canvas.width / 2, canvas.height / 2 - radius);
    ctx.strokeStyle = "black";
    ctx.stroke();

    // Draw labels
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(from, canvas.width / 2, canvas.height / 2);
    ctx.fillText(to, canvas.width / 2, canvas.height / 2 - radius - 20);
}

// Draw the line and label dynamically
function drawLineAndLabel(angle, label, color) {
    const lineEndX =
        canvas.width / 2 + radius * Math.cos((angle * Math.PI) / 180);
    const lineEndY =
        canvas.height / 2 - radius * Math.sin((angle * Math.PI) / 180);

    // Draw the line
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height / 2);
    ctx.lineTo(lineEndX, lineEndY);
    ctx.strokeStyle = color;
    ctx.stroke();

    // Draw the label
    const labelX =
        canvas.width / 2 + (radius + 20) * Math.cos((angle * Math.PI) / 180);
    const labelY =
        canvas.height / 2 - (radius + 20) * Math.sin((angle * Math.PI) / 180);

    ctx.fillText(label, labelX, labelY);
}

// Dragging Logic
function startDrag(event) {
    isDragging = true;
}

function dragLine(event) {
    if (!isDragging) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - canvas.width / 2;
    const y = canvas.height / 2 - (event.clientY - rect.top);

    let angle = Math.atan2(y, x) * (180 / Math.PI);
    angle = (90 - angle + 360) % 360;

    selectedAngle = angle;
    drawTaskCircle(tasks[currentTaskIndex]); // Redraw the task with the updated line
    drawLineAndLabel(selectedAngle, tasks[currentTaskIndex].target, "orange");
}

function endDrag(event) {
    isDragging = false;
}