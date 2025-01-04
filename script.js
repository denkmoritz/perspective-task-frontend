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

        if (tasks.length === 0) {
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
    drawShowcaseCircle(tasks[0]); // Showcase example
    document.getElementById("instructionSection").style.display = "none";
    document.getElementById("taskSection").style.display = "block";
    updateTaskDescription(tasks[0]); // Add task text
});

// Start the actual tasks
document.getElementById("startActualTasks").addEventListener("click", () => {
    currentTaskIndex = 1; // Start Task 1
    drawTaskCircle(tasks[currentTaskIndex]);
    document.getElementById("startActualTasks").style.display = "none";
    document.getElementById("submitResponse").style.display = "block";
    updateTaskDescription(tasks[currentTaskIndex]); // Add task text
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
                updateTaskDescription(tasks[currentTaskIndex]); // Add task text
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

// Add task text description
function updateTaskDescription(task) {
    const descriptionText = `
        Imagine you are standing at the ${task.from}.
        Facing the ${task.to}.
        Point to the ${task.target}.
    `;
    
    // Update both the above and below descriptions
    document.getElementById("taskDescription").innerText = descriptionText;
    document.getElementById("taskDescriptionBelow").innerText = descriptionText;
}

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
    // Clear the canvas and reset draggable state
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    selectedAngle = null; // Reset selected angle

    // Remove previous listeners to avoid duplication
    canvas.onmousedown = null;
    canvas.onmousemove = null;
    canvas.onmouseup = null;
    canvas.onmouseleave = null;

    // Draw the base circle
    drawBaseCircle(task.from, task.to);

    // Add fresh event listeners for dragging
    canvas.onmousedown = startDrag;
    canvas.onmousemove = dragLine;
    canvas.onmouseup = endDrag;
    canvas.onmouseleave = endDrag;

    // Do not draw the line initially
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

// Dragging functionality
function startDrag(event) {
    isDragging = true;

    // Calculate the angle of the mouse relative to the circle center
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left - canvas.width / 2;
    const mouseY = canvas.height / 2 - (event.clientY - rect.top); // Inverted Y-axis
    dragStartMouseAngle = Math.atan2(mouseY, mouseX) * (180 / Math.PI);

    // Save the starting angle of the draggable line
    dragStartAngle = selectedAngle !== null ? selectedAngle : 0;
}

function dragLine(event) {
    if (!isDragging) return;

    // Calculate the new mouse angle relative to the circle center
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left - canvas.width / 2;
    const mouseY = canvas.height / 2 - (event.clientY - rect.top); // Inverted Y-axis
    const currentMouseAngle = Math.atan2(mouseY, mouseX) * (180 / Math.PI);

    // Calculate the new angle for the line
    selectedAngle = (dragStartAngle + (currentMouseAngle - dragStartMouseAngle) + 360) % 360;

    // Redraw the circle and line dynamically
    const currentTask = tasks[currentTaskIndex];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBaseCircle(currentTask.from, currentTask.to);
    drawLineAndLabel(selectedAngle, currentTask.target, "orange");
}

function endDrag() {
    isDragging = false;
    dragStartMouseAngle = null;
    dragStartAngle = null;
}