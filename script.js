// Updated script.js for draggable line functionality and improved label placement
const apiBaseUrl = "https://perspective-task-backend.onrender.com"; // Replace with your backend URL

let tasks = [];
let currentTaskIndex = 0;
let participantName = "";
let selectedAngle = null; // Track selected angle
let isDragging = false; // Track dragging state

const INSTRUCTION_TEXT = `
    This is a test of your ability to imagine different perspectives or orientations in space.
    For each question, imagine that you are standing at one object, facing another, and
    pointing to a third object. Drag the line to indicate the direction.
`;

const canvas = document.getElementById("circleCanvas");
const ctx = canvas.getContext("2d");
const radius = 150; // Circle radius
canvas.width = 400;
canvas.height = 400;
let dragStartAngle = null;

// Helper: Convert mouse position to angle
function getMouseAngle(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - canvas.width / 2;
    const y = canvas.height / 2 - (event.clientY - rect.top);
    const angle = Math.atan2(y, x) * (180 / Math.PI);
    return (angle + 360) % 360; // Normalize angle
}

// Draw the circle with specific labels
function drawCircle(from, to, target) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw circle
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw north line
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height / 2);
    ctx.lineTo(canvas.width / 2, canvas.height / 2 - radius);
    ctx.strokeStyle = "black";
    ctx.stroke();

    // Draw specific labels
    const labelPositions = [
        { name: from, angle: 0 },
        { name: to, angle: 180 },
        { name: target, angle: 90 },
    ];

    labelPositions.forEach((label) => {
        const x =
            canvas.width / 2 + (radius + 20) * Math.cos((label.angle * Math.PI) / 180);
        const y =
            canvas.height / 2 - (radius + 20) * Math.sin((label.angle * Math.PI) / 180);
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(label.name, x, y);
    });

    // Draw draggable line if angle is set
    if (selectedAngle !== null) {
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height / 2);
        ctx.lineTo(
            canvas.width / 2 + radius * Math.cos((selectedAngle * Math.PI) / 180),
            canvas.height / 2 - radius * Math.sin((selectedAngle * Math.PI) / 180)
        );
        ctx.strokeStyle = "orange";
        ctx.stroke();
    }
}

// Fetch tasks
fetch(`${apiBaseUrl}/tasks`)
    .then((response) => response.json())
    .then((data) => (tasks = data))
    .catch((error) => alert("Could not load tasks."));

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
});

// Proceed to task
document
    .getElementById("proceedToTask")
    .addEventListener("click", () => loadTask(currentTaskIndex));

// Load task
function loadTask(index) {
    const task = tasks[index];
    if (index === 0) {
        drawCircle("flower", "tree", "cat"); // Example task
    } else {
        drawCircle(task.from, task.to, task.target);
    }

    document.getElementById("taskSection").style.display = "block";
    document.getElementById("taskDescription").innerText = `
        Imagine you're standing at the ${task.from}, facing the ${task.to}.
        Point to the ${task.target}.
    `;

    canvas.addEventListener("mousedown", startDrag);
    canvas.addEventListener("mousemove", dragLine);
    canvas.addEventListener("mouseup", endDrag);
    canvas.addEventListener("mouseleave", endDrag);
}

// Handle drag start
function startDrag(event) {
    isDragging = true;
    dragStartAngle = getMouseAngle(event);
}

// Handle dragging
function dragLine(event) {
    if (!isDragging) return;
    selectedAngle = getMouseAngle(event);
    drawCircle(tasks[currentTaskIndex].from, tasks[currentTaskIndex].to, tasks[currentTaskIndex].target);
}

// Handle drag end
function endDrag(event) {
    if (!isDragging) return;
    isDragging = false;
    dragStartAngle = null;
}

// Submit response
document
    .getElementById("submitResponse")
    .addEventListener("click", async () => {
        if (selectedAngle === null) {
            alert("Drag the line to set your input.");
            return;
        }
        const task = tasks[currentTaskIndex];
        try {
            const response = await fetch(`${apiBaseUrl}/submit_response`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: participantName,
                    task_id: task.id,
                    logged_angle: selectedAngle,
                }),
            });

            const result = await response.json();

            if (result.error) {
                alert(`Error: ${result.error}`);
                return;
            }

            // Move to the next task
            currentTaskIndex++;
            if (currentTaskIndex < tasks.length) {
                loadTask(currentTaskIndex);
            } else {
                alert("All tasks completed. Thank you!");
                document.getElementById("taskSection").style.display = "none";
                fetchResults();
            }
        } catch (error) {
            console.error("Error submitting response:", error);
            alert("Failed to submit response. Please try again later.");
        }
    });