const apiBaseUrl = "https://perspective-task-backend.onrender.com"; // Replace with your backend URL

let tasks = [];
let currentTaskIndex = 0;
let participantName = "";
let selectedAngle = 0;

const INSTRUCTION_TEXT = `
    This is a test of your ability to imagine different perspectives or orientations in space.
    For each question, imagine that you are standing at one object, facing another, and
    pointing to a third object. Use the circle below to select the direction.
`;

const canvas = document.getElementById("circleCanvas");
const ctx = canvas.getContext("2d");
const radius = 150; // Circle radius
canvas.width = 400;
canvas.height = 400;

// Object positions around the circle
const positions = [
    { name: "tree", angle: 90 },
    { name: "cat", angle: 45 },
    { name: "car", angle: 0 },
    { name: "traffic light", angle: -45 },
    { name: "stop sign", angle: -90 },
    { name: "flower", angle: -135 },
    { name: "house", angle: -180 },
    { name: "tree", angle: -225 }
];

// Draw the circle with object names
function drawCircle(isExample) {
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

    // Draw object names
    positions.forEach((pos) => {
        const x =
            canvas.width / 2 + radius * Math.cos((pos.angle * Math.PI) / 180);
        const y =
            canvas.height / 2 - radius * Math.sin((pos.angle * Math.PI) / 180);
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(pos.name, x, y);
    });

    // Draw example line (if applicable)
    if (isExample) {
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height / 2);
        ctx.lineTo(canvas.width / 2 + radius * 0.7, canvas.height / 2 - radius * 0.7);
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
        drawCircle(true); // Example task
    } else {
        drawCircle(false);
    }

    document.getElementById("taskSection").style.display = "block";
    document.getElementById("taskDescription").innerText = `
        Imagine you're standing at the ${task.from}, facing the ${task.to}.
        Point to the ${task.target}.
    `;
}

// Submit response
document
    .getElementById("submitResponse")
    .addEventListener("click", async () => {
        if (!selectedAngle) {
            alert("Draw your input first.");
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
                    logged_angle: selectedAngle, // Ensure 'selectedAngle' is properly initialized
                }), // <- Ensure this comma is necessary here
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