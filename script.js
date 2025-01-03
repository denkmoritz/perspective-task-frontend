const apiBaseUrl = "https://perspective-task-backend.onrender.com"; // Replace with your backend URL

let tasks = [];
let currentTaskIndex = 0;
let participantName = "";
let selectedAngle = 0; // Angle selected by the user

const INSTRUCTION_TEXT = `
    This is a test of your ability to imagine different perspectives or orientations in space. 
    On each of the following screens, you will see a picture of an array of objects and an "arrow circle" with a question 
    about the direction between some of the objects. For the question on each screen, you should imagine that you are standing at 
    one object in the array (which will be named in the center of the circle) and facing another object, named at the top of the circle. 
    Your task is to draw an arrow from the center object showing the direction to a third object from this facing orientation.

    Look at the sample item in the other window. In this item, you are asked to imagine that you are standing at the flower, 
    which is named in the center of the circle, and facing the tree, which is named at the top of the circle. Your task is to draw an 
    arrow pointing to the cat. In the sample item, this arrow has been drawn for you. In the test items, your task is to draw this arrow. 
    Can you see that if you were at the flower facing the tree, the cat would be in this direction? Please ask the experimenter now if you 
    have any questions about what you are required to do.

    There are 12 items in this test, one on each screen. For each item, the array of objects is shown at the top of the window and 
    the arrow circle is shown at the bottom. Please do not pick up or turn the monitor, and do not make any marks on the maps. 
    Try to mark the correct directions but do not spend too much time on any one question.

    You will have 5 minutes for this test. Use SPACE in the other window to confirm your selections.
`;

// Fetch tasks on load
window.onload = () => {
    document.getElementById('instructionsText').innerText = INSTRUCTION_TEXT; // Set instruction text

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
        `Imagine you're standing at the ${task.from}, facing the ${task.to}. Point to the ${task.target}.`;

    drawCircle(); // Prepare the circle for selection
}

// Draw circle for angle selection
function drawCircle() {
    const canvas = document.getElementById('circleCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the circle
    ctx.beginPath();
    ctx.arc(200, 200, 100, 0, 2 * Math.PI);
    ctx.stroke();

    // Add click listener for selecting angle
    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left - 200;
        const y = event.clientY - rect.top - 200;

        // Calculate angle
        selectedAngle = Math.atan2(y, x) * (180 / Math.PI);
        if (selectedAngle < 0) selectedAngle += 360;

        // Draw arrow to indicate selection
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.arc(200, 200, 100, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(200, 200);
        ctx.lineTo(200 + 100 * Math.cos(selectedAngle * (Math.PI / 180)), 
                   200 + 100 * Math.sin(selectedAngle * (Math.PI / 180)));
        ctx.stroke();
    });
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
            renderChart(data);
        })
        .catch(error => {
            console.error("Failed to load results:", error);
            alert("Could not load results. Please try again later.");
        });
}