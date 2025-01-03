const apiBaseUrl = "https://your-app-name.onrender.com"; // Replace with your Render URL

document.getElementById('startTask').addEventListener('click', () => {
    const name = document.getElementById('name').value;
    if (!name) {
        alert("Please enter your name.");
        return;
    }

    document.getElementById('taskForm').style.display = 'none';
    document.getElementById('taskSection').style.display = 'block';
    document.getElementById('taskDescription').innerText = "Imagine you're standing at the car, facing the stop sign. Point to the tree.";
});

document.getElementById('submitResponse').addEventListener('click', () => {
    const response = document.getElementById('response').value;

    if (!response) {
        alert("Please enter your response.");
        return;
    }

    fetch(`${apiBaseUrl}/submit_data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: document.getElementById('name').value,
            task_results: [{ task_id: 1, error: parseInt(response) }]
        })
    }).then(response => {
        if (response.ok) {
            alert("Response submitted successfully!");

            fetch(`${apiBaseUrl}/results`)
                .then(res => res.json())
                .then(data => {
                    document.getElementById('taskSection').style.display = 'none';
                    document.getElementById('resultSection').style.display = 'block';
                    renderChart(data);
                });
        }
    });
});

function renderChart(data) {
    const ctx = document.getElementById('resultsChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Task 1', 'Task 2', 'Task 3'], // Adjust based on your tasks
            datasets: [{
                label: 'Average Error',
                data: data.average_error_by_task, // Update with backend response
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
