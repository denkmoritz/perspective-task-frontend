const apiBaseUrl = "https://perspective-task-backend.onrender.com"; // Replace with your backend URL

let tasks = [];
let currentTaskIndex = 0;
let participantName = "";

// Fetch tasks from backend on load
window.onload = () => {
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
}

// Submit response
document.getElementById('submitResponse').addEventListener('click', () => {
    const response = document.getElementById('response').value;
    if (!response || isNaN(response) || response < 0 || response > 360) {
        alert("Please enter a valid angle (0-360).");
        return;
    }

    const task = tasks[currentTaskIndex];
    fetch(`${apiBaseUrl}/submit_response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: participantName,
            task_id: task.id,
            logged_angle: parseFloat(response)
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error !== undefined) {
            alert(`Error for this task: ${data.error}°`);
        }
        currentTaskIndex++;
        loadTask(currentTaskIndex);
    })
    .catch(error => {
        console.error("Failed to submit response:", error);
        alert("Could not submit your response. Please try again.");
    });
});

// Fetch and display results
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

// Render results chart
function renderChart(data) {
    const ctx = document.getElementById('resultsChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: tasks.map(task => `Task ${task.id + 1}`),
            datasets: [{
                label: 'Average Error by Task',
                data: data.errors_by_task || [],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}