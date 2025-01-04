const backendUrl = "https://perspective-task-backend.onrender.com"; // Replace with your backend URL when deployed
let taskId = 0;
let loggedAngle = null; // Start with no line drawn
let currentTask = null;
let userName = ""; // Store user's name

document.addEventListener('DOMContentLoaded', () => {
    // Sections
    const nameSection = document.getElementById("name-section");
    const instructionSection = document.getElementById("instruction");
    const exampleSection = document.getElementById("example-section");
    const taskSection = document.getElementById("task-section");

    // Inputs and Buttons
    const nameInput = document.getElementById("name-input");
    const startButton = document.getElementById("start-button");
    const exampleButton = document.getElementById("example-button");
    const startTasksButton = document.getElementById("start-tasks-button");
    const submitButton = document.getElementById("submit-button");

    // Task Info
    const taskInfoExample = document.getElementById("task-info");
    const taskInfoTask = document.getElementById("task-info-task");

    // Canvases
    const exampleCanvas = document.getElementById("circle-canvas");
    const taskCanvas = document.getElementById("circle-canvas-task");
    const exampleCtx = exampleCanvas.getContext("2d");
    const taskCtx = taskCanvas.getContext("2d");

    // Display Name Section First
    nameSection.style.display = "block";

    // Handle Name Submission
    startButton.addEventListener("click", () => {
        userName = nameInput.value.trim();
        if (userName) {
            nameSection.style.display = "none";
            instructionSection.style.display = "block";
        } else {
            alert("Please enter your name to continue.");
        }
    });

    // Handle Navigation to Example
    exampleButton.addEventListener("click", () => {
        instructionSection.style.display = "none";
        exampleSection.style.display = "block";
        loadExample();
    });

    // Handle Navigation to Tasks
    startTasksButton.addEventListener("click", () => {
        exampleSection.style.display = "none";
        taskSection.style.display = "block";
        taskId = 1; // Move to first real task
        loadTask();
    });

    // Handle Task Submission
    submitButton.addEventListener("click", () => {
        fetch(`${backendUrl}/submit-task`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ task_id: taskId, logged_angle: loggedAngle, name: userName })
        }).then(() => {
            taskId++;
            loadTask();
        });
    });

    function drawCircle(ctx, standingAt, facingTo, pointingTo, angle = null) {
        // Ensure canvas dimensions are set correctly
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;

        // Circle center and radius
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        const radius = Math.min(canvasWidth, canvasHeight) / 2 - 40; // Ensure circle fits within canvas

        // Clear the canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // DEBUG: Log drawing dimensions
        console.log("Drawing circle with dimensions:", {
            centerX,
            centerY,
            radius,
            canvasWidth,
            canvasHeight,
        });

        // Draw the circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = "black"; // Ensure circle is black
        ctx.lineWidth = 2; // Thicker circle stroke
        ctx.stroke();

        // Draw the upright line (facing direction)
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX, centerY - radius); // Line pointing straight up
        ctx.strokeStyle = "black"; // Upright line stays black
        ctx.lineWidth = 1; // Default line width
        ctx.stroke();

        // Draw the pointing line if an angle is provided
        if (angle !== null) {
            const radians = ((angle - 90) * Math.PI) / 180; // Adjust for canvas coordinate system
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + radius * Math.cos(radians), centerY + radius * Math.sin(radians));
            ctx.strokeStyle = "orange"; // Only the draggable line is orange
            ctx.lineWidth = 3; // Thicker draggable line
            ctx.stroke();
            ctx.lineWidth = 1; // Reset line width to default
        }

        // Draw labels
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(standingAt, centerX, centerY); // Center label placed in the middle of the circle
        ctx.fillText(facingTo, centerX, centerY - radius - 10); // Top label

        // Draw dynamic pointing label if an angle is provided
        if (angle !== null) {
            const radians = ((angle - 90) * Math.PI) / 180;
            const x = centerX + radius * Math.cos(radians);
            const y = centerY + radius * Math.sin(radians);
            ctx.fillText(pointingTo, x, y);
        }
    }

    function loadExample() {
        fetch(`${backendUrl}/get-task?task_id=0`)
            .then((response) => response.json())
            .then((data) => {
                currentTask = data;
                loggedAngle = data.correct_angle || 301; // Example line pre-set
                taskInfoExample.textContent = `Imagine you are standing at the ${data.standing_at}, facing the ${data.facing_to}, and pointing to the ${data.pointing_to}.`;
                drawCircle(exampleCtx, data.standing_at, data.facing_to, data.pointing_to, loggedAngle);
            });
    }

    function loadTask() {
        fetch(`${backendUrl}/get-task?task_id=${taskId}`)
            .then((response) => response.json())
            .then((data) => {
                if (data.error) {
                    taskInfoTask.textContent = "No more tasks available.";
                    submitButton.style.display = "none";
                } else {
                    currentTask = data;
                    loggedAngle = null; // Reset the angle to make the line invisible initially
                    taskInfoTask.textContent = `Imagine you are standing at the ${data.standing_at}, facing the ${data.facing_to}, and pointing to the ${data.pointing_to}.`;
                    drawCircle(taskCtx, data.standing_at, data.facing_to, data.pointing_to);

                    taskCanvas.addEventListener("mousedown", (e) => {
                        const rect = taskCanvas.getBoundingClientRect();
                        const x = e.clientX - rect.left - taskCtx.canvas.width / 2;
                        const y = e.clientY - rect.top - taskCtx.canvas.height / 2;

                        // Compute the angle
                        loggedAngle = (Math.atan2(y, x) * 180) / Math.PI;
                        loggedAngle = (loggedAngle + 360) % 360; // Normalize to [0, 360)
                        loggedAngle = (loggedAngle + 90) % 360; // Adjust for canvas coordinate system

                        // Update the drawing
                        drawCircle(taskCtx, data.standing_at, data.facing_to, data.pointing_to, loggedAngle);
                    });
                }
            });
    }
});