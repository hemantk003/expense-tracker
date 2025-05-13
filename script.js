let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let currentTheme = localStorage.getItem('theme') || 'dark';
let categoryChart, cashflowChart;

// Initialize theme
document.body.setAttribute('data-theme', currentTheme);

// Navigation Handling
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        if(this.dataset.section) {
            document.querySelector('.nav-item.active').classList.remove('active');
            this.classList.add('active');
            const section = this.dataset.section;
            document.querySelectorAll('.section-container').forEach(sec => {
                sec.classList.remove('active');
            });
            document.getElementById(section).classList.add('active');
            if(section === 'dashboard') initializeCharts();
        }
    });
});

// Theme Toggle
function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
}

// Transaction Handling
function addTransaction() {
    const transaction = {
        id: Date.now(),
        date: document.getElementById('date').value,
        description: document.getElementById('description').value.trim(),
        category: document.getElementById('category').value,
        amount: parseFloat(document.getElementById('amount').value),
        type: document.getElementById('type').value
    };

    if (!transaction.date || !transaction.description || !transaction.amount) {
        alert('Please fill all required fields');
        return;
    }

    transactions.push(transaction);
    updateStorage();
    updateUI();
    clearForm();
}

function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    updateStorage();
    updateUI();
}

function updateStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function updateUI() {
    updateDashboard();
    updateTransactionLists();
    if(document.getElementById('dashboard').classList.contains('active')) {
        initializeCharts();
    }
}

function updateDashboard() {
    const totals = transactions.reduce((acc, t) => {
        if (t.type === 'income') acc.income += t.amount;
        if (t.type === 'extra-income') acc.extra += t.amount;
        if (t.type === 'expense') acc.expenses += t.amount;
        return acc;
    }, { income: 0, extra: 0, expenses: 0 });

    document.getElementById('total-income').textContent = `$${(totals.income + totals.extra).toFixed(2)}`;
    document.getElementById('total-expenses').textContent = `$${totals.expenses.toFixed(2)}`;
    document.getElementById('extra-income').textContent = `$${totals.extra.toFixed(2)}`;
    document.getElementById('net-balance').textContent = 
        `$${(totals.income + totals.extra - totals.expenses).toFixed(2)}`;
}

function updateTransactionLists() {
    const renderList = (type, listId) => {
        const filtered = transactions.filter(t => t.type === type);
        const list = document.getElementById(listId);
        list.innerHTML = filtered.map(t => `
            <div class="transaction-card">
                <div>
                    <span class="transaction-type ${t.type}-badge">${t.type.replace('-', ' ')}</span>
                    <span>${t.date} - ${t.description}</span>
                </div>
                <div>
                    <span>${t.category}</span>
                    <span>$${t.amount.toFixed(2)}</span>
                    <button onclick="deleteTransaction(${t.id})">🗑️</button>
                </div>
            </div>
        `).join('');
    };

    renderList('expense', 'expenses-list');
    renderList('income', 'income-list');
    renderList('extra-income', 'extra-income-list');
}

function initializeCharts() {
    if(categoryChart) categoryChart.destroy();
    if(cashflowChart) cashflowChart.destroy();

    // Category Chart
    const categories = [...new Set(transactions.filter(t => t.type === 'expense').map(t => t.category))];
    const categoryData = categories.map(cat => 
        transactions.filter(t => t.category === cat).reduce((sum, t) => sum + t.amount, 0)
    );

    categoryChart = new Chart(document.getElementById('categoryChart'), {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: categoryData,
                backgroundColor: ['#4a90e2', '#2ecc71', '#e74c3c', '#9b59b6', '#f1c40f']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Expense Categories' }
            }
        }
    });

    // Cash Flow Chart
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map((_, i) => {
        const monthTrans = transactions.filter(t => new Date(t.date).getMonth() === i);
        return {
            income: monthTrans.filter(t => t.type === 'income').reduce((a,b) => a + b.amount, 0),
            expense: monthTrans.filter(t => t.type === 'expense').reduce((a,b) => a + b.amount, 0)
        };
    });

    cashflowChart = new Chart(document.getElementById('cashflowChart'), {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Income',
                data: monthlyData.map(m => m.income),
                backgroundColor: '#2ecc71'
            }, {
                label: 'Expenses',
                data: monthlyData.map(m => m.expense),
                backgroundColor: '#e74c3c'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Monthly Cash Flow' }
            },
            scales: {
                x: { stacked: true },
                y: { beginAtZero: true }
            }
        }
    });
}

function exportData() {
    const csvContent = [
        ['ID', 'Date', 'Description', 'Category', 'Amount', 'Type'],
        ...transactions.map(t => [
            t.id,
            t.date,
            `"${t.description.replace(/"/g, '""')}"`,
            t.category,
            t.amount,
            t.type
        ])
    ].map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'transactions.csv';
    link.click();
}

function clearForm() {
    document.getElementById('date').value = '';
    document.getElementById('description').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('type').value = 'income';
}

// Initial Load
updateUI();











