const apiBaseUrl = "https://perspective-task-backend.onrender.com"; // Replace with your backend URL

let tasks = [];
let currentTaskIndex = 0;
let participantName = "";
let selectedAngle = 0; // Angle selected by the user

const INSTRUCTION_TEXT = `
    This is a test of your ability to imagine different perspectives or orientations in space.
    For each question, imagine that you are standing at one object, facing another, and
    pointing to a third object. Use the circle below to select the direction.
`;

// Fetch tasks on load
window.onload = () => {
    document.getElementById('instructionsText').innerText = INSTRUCTION_TEXT;

    fetch(`${apiBaseUrl}/tasks`)
        .then(response => response.json())
        .then(data => {
            tasks = data;
        })
        .catch(error => {
            console.error("Failed to load tasks:", error);
            alert("Could not load tasks. Please try again later.");
        });
};

// Start task
document.getElementById('startTask').addEventListener('click', () => {
    participantName = document.getElementById('name').value;
    if (!participantName) {
        alert("Please enter your name.");
        return;
    }

    document.getElementById('taskForm').style.display = 'none';
    document.getElementById('instructionSection').style.display = 'block';
});

// Proceed to tasks
document.getElementById('proceedToTask').addEventListener('click', () => {
    document.getElementById('instructionSection').style.display = 'none';
    document.getElementById('taskSection').style.display = 'block';
    loadTask(currentTaskIndex);
});

// Load current task
function loadTask(index) {
    if (index >= tasks.length) {
        alert("All tasks completed! Thank you.");
        document.getElementById('taskSection').style.display = 'none';
        fetchResults();
        return;
    }

    const task = tasks[index];
    document.getElementById('taskDescription').innerText = 
        `${index === 0 ? "Example: " : ""}Imagine you're standing at the ${task.from}, facing the ${task.to}. Point to the ${task.target}.`;

    drawCircle(index === 0); // Draw circle with example (task 0) or for user interaction
}

// Draw circle with two lines
function drawCircle(isExample) {
    const canvas = document.getElementById('circleCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the circle
    ctx.beginPath();
    ctx.arc(200, 200, 100, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw the north line (always pointing up)
    ctx.beginPath();
    ctx.moveTo(200, 200);
    ctx.lineTo(200, 100); // Straight up
    ctx.strokeStyle = "black";
    ctx.stroke();

    if (isExample) {
        // Example: Draw a predefined second line
        ctx.beginPath();
        ctx.moveTo(200, 200);
        ctx.lineTo(150, 250); // Example direction
        ctx.strokeStyle = "orange";
        ctx.stroke();
    } else {
        // Add click listener for selecting angle
        canvas.addEventListener('click', (event) => {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left - 200;
            const y = event.clientY - rect.top - 200;

            // Calculate angle
            selectedAngle = Math.atan2(y, x) * (180 / Math.PI);
            if (selectedAngle < 0) selectedAngle += 360;

            // Redraw circle and north line
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            ctx.arc(200, 200, 100, 0, 2 * Math.PI);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(200, 200);
            ctx.lineTo(200, 100); // Straight up
            ctx.strokeStyle = "black";
            ctx.stroke();

            // Draw user-selected line
            ctx.beginPath();
            ctx.moveTo(200, 200);
            ctx.lineTo(200 + 100 * Math.cos(selectedAngle * (Math.PI / 180)), 
                       200 + 100 * Math.sin(selectedAngle * (Math.PI / 180)));
            ctx.strokeStyle = "orange";
            ctx.stroke();
        });
    }
}

// Submit response
document.getElementById('submitResponse').addEventListener('click', () => {
    if (!selectedAngle) {
        alert("Please select a direction.");
        return;
    }

    const task = tasks[currentTaskIndex];
    fetch(`${apiBaseUrl}/submit_response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: participantName,
            task_id: task.id,
            logged_angle: selectedAngle
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error !== undefined) {
            alert(`Error for this task: ${data.error.toFixed(2)}°`);
        }
        currentTaskIndex++;
        loadTask(currentTaskIndex);
    })
    .catch(error => {
        console.error("Failed to submit response:", error);
        alert("Could not submit your response. Please try again.");
    });
});

// Fetch results
function fetchResults() {
    fetch(`${apiBaseUrl}/results`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('resultSection').style.display = 'block';
            document.getElementById('resultsSummary').innerText = 
                `Total participants: ${data.total_participants}, Average Error: ${data.average_error.toFixed(2)}°`;
        })
        .catch(error => {
            console.error("Failed to load results:", error);
            alert("Could not load results. Please try again later.");
        });
}
