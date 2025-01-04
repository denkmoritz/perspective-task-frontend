const apiBaseUrl = "https://perspective-task-backend.onrender.com"; // Replace with your backend URL

let tasks = [];
let currentTaskIndex = 0; // Start with Task 0 (Showcase)
let participantName = "";
let selectedAngle = null; // Track selected angle
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
        drawCircle(tasks[currentTaskIndex].from, tasks[currentTaskIndex].to);
    }
}

// Helper: Convert mouse position to angle
function getMouseAngle(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left - canvas.width / 2;
    const y = canvas.height / 2 - (event.clientY - rect.top);
    const angle = Math.atan2(y, x) * (180 / Math.PI);
    return (angle + 360) % 360; // Normalize angle
}

// Draw the circle with specific labels
function drawCircle(from, to) {
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

    // Draw labels
    const labelPositions = [
        { name: from, xOffset: 0, yOffset: 0 }, // Center
        { name: to, xOffset: 0, yOffset: -radius - 20 }, // Top
    ];

    labelPositions.forEach((label) => {
        const x = canvas.width / 2 + (label.xOffset || 0);
        const y = canvas.height / 2 + (label.yOffset || 0);
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(label.name, x, y);
    });

    // Draw draggable line
    const task = tasks[currentTaskIndex];
    const angle = currentTaskIndex === 0 ? task.angle : selectedAngle; // Correct angle for Task 0
    if (angle !== null) {
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height / 2);
        ctx.lineTo(
            canvas.width / 2 + radius * Math.cos((angle * Math.PI) / 180),
            canvas.height / 2 - radius * Math.sin((angle * Math.PI) / 180)
        );
        ctx.strokeStyle = currentTaskIndex === 0 ? "green" : "orange"; // Green for Task 0
        ctx.stroke();

        // Display target label dynamically
        const target = tasks[currentTaskIndex].target;
        const targetX =
            canvas.width / 2 + (radius + 20) * Math.cos((angle * Math.PI) / 180);
        const targetY =
            canvas.height / 2 - (radius + 20) * Math.sin((angle * Math.PI) / 180);
        ctx.fillText(target, targetX, targetY);
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

// Proceed to Task 0 (Showcase Example)
document
    .getElementById("proceedToTask")
    .addEventListener("click", () => loadTask(currentTaskIndex));

// Load task
function loadTask(index) {
    const task = tasks[index];
    drawCircle(task.from, task.to); // Draw circle with labels

    document.getElementById("taskSection").style.display = "block";
    document.getElementById("taskDescription").innerText = `
        Imagine you are standing at the ${task.from}.
        Facing the ${task.to}.
        Point to the ${task.target}.
    `;

    // For tasks 1 and onward, allow dragging
    if (index > 0) {
        canvas.addEventListener("mousedown", startDrag);
        canvas.addEventListener("mousemove", dragLine);
        canvas.addEventListener("mouseup", endDrag);
        canvas.addEventListener("mouseleave", endDrag);
        document.getElementById("submitResponse").style.display = "block";
        document.getElementById("startActualTasks").style.display = "none";
    } else {
        document.getElementById("submitResponse").style.display = "none";
        document.getElementById("startActualTasks").style.display = "block";
    }
}

// Start the actual tasks
document
    .getElementById("startActualTasks")
    .addEventListener("click", () => {
        currentTaskIndex = 1; // Move to Task 1
        document.getElementById("startActualTasks").style.display = "none";
        document.getElementById("submitResponse").style.display = "block";
        loadTask(currentTaskIndex);
    });

// Handle drag start
function startDrag(event) {
    isDragging = true;
}

// Handle dragging
function dragLine(event) {
    if (!isDragging) return;
    selectedAngle = getMouseAngle(event);
    drawCircle(tasks[currentTaskIndex].from, tasks[currentTaskIndex].to);
}

// Handle drag end
function endDrag(event) {
    if (!isDragging) return;
    isDragging = false;
}

// Submit response
document.getElementById("submitResponse").addEventListener("click", async () => {
    if (selectedAngle === null) {
        alert("Drag the line to set your input.");
        return;
    }

    const roundedAngle = Math.round(selectedAngle); // Ensure angle is an integer
    const normalizedAngle = (roundedAngle + 360) % 360; // Normalize angle
    console.log("Submitting angle:", normalizedAngle);

    const task = tasks[currentTaskIndex];
    try {
        const response = await fetch(`${apiBaseUrl}/submit_response`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: participantName,
                task_id: task.id,
                logged_angle: normalizedAngle, // Submit normalized angle
            }),
        });

        if (response.status === 204) {
            // Move to the next task
            currentTaskIndex++;
            if (currentTaskIndex < tasks.length) {
                loadTask(currentTaskIndex);
            } else {
                alert("All tasks completed. Thank you!");
                document.getElementById("taskSection").style.display = "none";
                fetchResults();
            }
        } else {
            console.error("Unexpected response:", response);
            alert("Failed to submit response. Please try again.");
        }
    } catch (error) {
        console.error("Error submitting response:", error);
        alert("Failed to submit response. Please try again later.");
    }
});