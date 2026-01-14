// State Management
let state = {
    participants: [],
    expenses: []
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    renderAll();
});

// Persistence
function saveState() {
    localStorage.setItem('splitItData', JSON.stringify(state));
    renderAll();
}

function loadState() {
    const saved = localStorage.getItem('splitItData');
    if (saved) {
        state = JSON.parse(saved);
    }
}

function resetApp() {
    if(confirm('¿Estás seguro de que quieres borrar todos los datos?')) {
        state = { participants: [], expenses: [] };
        saveState();
    }
}

// Actions
function addParticipant() {
    const input = document.getElementById('new-participant-name');
    const name = input.value.trim();
    
    if (name) {
        if (state.participants.includes(name)) {
            alert('¡Ese nombre ya existe!');
            return;
        }
        state.participants.push(name);
        input.value = '';
        saveState();
    }
}

function removeParticipant(name) {
    // Check if user has expenses involved
    const hasExpenses = state.expenses.some(e => e.payer === name);
    if (hasExpenses) {
        alert('No se puede eliminar un participante que ya tiene gastos registrados.');
        return;
    }
    
    state.participants = state.participants.filter(p => p !== name);
    saveState();
}

function addExpense() {
    const payerSelect = document.getElementById('expense-payer');
    const descInput = document.getElementById('expense-desc');
    const amountInput = document.getElementById('expense-amount');

    const payer = payerSelect.value;
    const description = descInput.value.trim() || 'Varios';
    const amount = parseFloat(amountInput.value);

    if (!payer) {
        alert('Por favor agrega participantes primero.');
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        alert('Ingresa un monto válido.');
        return;
    }

    const expense = {
        id: Date.now(),
        payer,
        description,
        amount,
        date: new Date().toISOString()
    };

    state.expenses.unshift(expense); // Add to top
    
    // Reset inputs
    descInput.value = '';
    amountInput.value = '';
    descInput.focus();
    
    saveState();
}

function deleteExpense(id) {
    if(confirm('¿Borrar este gasto?')) {
        state.expenses = state.expenses.filter(e => e.id !== id);
        saveState();
    }
}

// Rendering
function renderAll() {
    renderParticipants();
    renderExpenses();
    renderDashboard();
    calculateAndRenderResults();
}

function renderParticipants() {
    const list = document.getElementById('participants-list');
    const select = document.getElementById('expense-payer');
    const overlay = document.getElementById('expense-overlay');
    
    // Clear current
    list.innerHTML = '';
    const currentPayer = select.value; // Try to preserve selection
    select.innerHTML = '';

    // Overlay logic
    if (state.participants.length === 0) {
        overlay.classList.remove('opacity-0', 'pointer-events-none');
    } else {
        overlay.classList.add('opacity-0', 'pointer-events-none');
    }

    state.participants.forEach(name => {
        // Badge in list
        const badge = document.createElement('div');
        badge.className = 'bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 transition-colors border border-gray-600';
        badge.innerHTML = `
            <span>${name}</span>
            <button onclick="removeParticipant('${name}')" class="text-gray-400 hover:text-red-400"><i class="fa-solid fa-xmark"></i></button>
        `;
        list.appendChild(badge);

        // Option in select
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });

    if (state.participants.includes(currentPayer)) {
        select.value = currentPayer;
    }
}

function renderExpenses() {
    const container = document.getElementById('expenses-history');
    const countBadge = document.getElementById('expense-count-badge');
    
    countBadge.textContent = `${state.expenses.length} items`;
    
    if (state.expenses.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-600 py-10 italic">No hay gastos registrados aún.</div>';
        return;
    }

    container.innerHTML = '';
    state.expenses.forEach(expense => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-3 rounded-xl bg-gray-800/40 hover:bg-gray-800/60 transition-colors border border-transparent hover:border-gray-700 group scale-enter';
        item.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="bg-gray-700 w-10 h-10 rounded-full flex items-center justify-center text-gray-300 font-bold shrink-0">
                    ${expense.payer.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h4 class="font-semibold text-white leading-tight">${expense.description}</h4>
                    <p class="text-xs text-gray-400">Pagado por <span class="text-blue-400">${expense.payer}</span></p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <span class="font-bold text-green-400">$${expense.amount.toFixed(2)}</span>
                <button onclick="deleteExpense(${expense.id})" class="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(item);
    });
}

function renderDashboard() {
    const total = state.expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const count = state.participants.length;
    const avg = count > 0 ? total / count : 0;

    // Animate numbers (simple implementation)
    document.getElementById('total-spent').textContent = total.toFixed(2);
    document.getElementById('participant-count').textContent = count;
    document.getElementById('average-cost').textContent = avg.toFixed(2);

    const btnDownload = document.getElementById('btn-download');
    if (state.expenses.length > 0 && count > 1) {
        btnDownload.disabled = false;
        document.getElementById('results-section').classList.remove('hidden');
    } else {
        btnDownload.disabled = true;
        document.getElementById('results-section').classList.add('hidden');
    }
}

function calculateAndRenderResults() {
    if (state.participants.length < 2 || state.expenses.length === 0) return;

    const total = state.expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const avg = total / state.participants.length;
    
    // Calculate balances
    const balances = {};
    state.participants.forEach(p => balances[p] = 0);
    
    state.expenses.forEach(e => {
        balances[e.payer] += e.amount;
    });

    state.participants.forEach(p => {
        balances[p] -= avg; // Subtract average to see if they are +/-
    });

    // Render Balances Visuals
    const balanceContainer = document.getElementById('individual-balances');
    balanceContainer.innerHTML = '';
    
    // Sort logic for display: High positive (Creditors) to High negative (Debtors)
    const sortedParticipants = Object.keys(balances).sort((a, b) => balances[b] - balances[a]);

    sortedParticipants.forEach(p => {
        const bal = balances[p];
        const isPositive = bal >= 0; // Floating point safety normally needed, but js handles small diffs
        const colorClass = isPositive ? 'text-green-400' : 'text-red-400';
        const barColor = isPositive ? 'bg-green-500' : 'bg-red-500';
        const widthPercent = Math.min(Math.abs(bal) / (total || 1) * 100 * 2, 100); // Visual scaling

        const el = document.createElement('div');
        el.className = 'flex items-center gap-3 text-sm';
        el.innerHTML = `
            <div class="w-24 shrink-0 truncate text-white font-medium">${p}</div>
            <div class="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden flex ${isPositive ? 'justify-start' : 'justify-end'}">
                 <!-- Just for visual, simplified bar -->
                 <div class="h-full ${barColor} opacity-80" style="width: ${widthPercent}%;"></div>
            </div>
            <div class="w-20 text-right font-bold ${colorClass}">
                ${bal > 0 ? '+' : ''}${bal.toFixed(2)}
            </div>
        `;
        balanceContainer.appendChild(el);
    });

    // Calculate Debts (Settlement)
    // Greedy algorithm
    let debtors = [];
    let creditors = [];

    for (const [p, amount] of Object.entries(balances)) {
        if (amount < -0.01) debtors.push({ name: p, amount: amount });
        if (amount > 0.01) creditors.push({ name: p, amount: amount });
    }

    debtors.sort((a, b) => a.amount - b.amount); // Ascending (most negative first)
    creditors.sort((a, b) => b.amount - a.amount); // Descending (most positive first)

    const settlementContainer = document.getElementById('settlement-plan');
    settlementContainer.innerHTML = '';
    
    if (debtors.length === 0 && creditors.length === 0) {
        settlementContainer.innerHTML = '<div class="text-green-400 font-bold">¡Todo está equilibrado!</div>';
        return;
    }

    let i = 0; // debtor index
    let j = 0; // creditor index
    const transactions = [];

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        // The amount to settle is the minimum of what debtor owes and creditor is owed
        const amount = Math.min(Math.abs(debtor.amount), creditor.amount);

        transactions.push({ from: debtor.name, to: creditor.name, amount: amount });

        // Adjust remaining logic
        debtor.amount += amount;
        creditor.amount -= amount;

        // If settled (close to 0), move to next
        if (Math.abs(debtor.amount) < 0.01) i++;
        if (Math.abs(creditor.amount) < 0.01) j++;
    }

    transactions.forEach(t => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700/50';
        div.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="font-bold text-red-300">${t.from}</span>
                <i class="fa-solid fa-arrow-right-long text-gray-500"></i>
                <span class="font-bold text-green-300">${t.to}</span>
            </div>
            <span class="font-bold text-white">$${t.amount.toFixed(2)}</span>
        `;
        settlementContainer.appendChild(div);
    });
}

// PDF Generation
function downloadPDF() {
    if(!window.jspdf) {
        alert('Error cargando librería PDF');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Theme Colors
    const primaryColor = [79, 70, 229]; // Indigo
    const secondaryColor = [100, 100, 100];

    // Header
    doc.setFontSize(22);
    doc.setTextColor(...primaryColor);
    doc.text("Reporte de Gastos - SplitIt", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(...secondaryColor);
    doc.text(`Generado el: ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`, 14, 28);
    
    // Summary Section
    let total = state.expenses.reduce((acc, curr) => acc + curr.amount, 0);
    doc.setFontSize(12);
    doc.setTextColor(0,0,0);
    doc.text(`Total Gastado: $${total.toFixed(2)}`, 14, 40);
    doc.text(`Promedio por Persona: $${(total / state.participants.length).toFixed(2)}`, 14, 46);

    // Expenses Table
    const tableData = state.expenses.map(e => [
        new Date(e.date).toLocaleDateString(),
        e.payer,
        e.description,
        `$${e.amount.toFixed(2)}`
    ]);

    doc.autoTable({
        startY: 55,
        head: [['Fecha', 'Pagó', 'Concepto', 'Monto']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        styles: { font: "helvetica", fontSize: 10 },
    });

    // Settlement Table (Logic Re-run essentially)
    // We can extract the transactions visually from the existing DOM or re-calc. Better re-calc for purity.
    // Re-calc logic (simplified copy from above)
    const balances = {};
    const avg = total / state.participants.length;
    state.participants.forEach(p => balances[p] = -avg);
    state.expenses.forEach(e => balances[e.payer] += e.amount);
    
    let debtors = [];
    let creditors = [];
    for (const [p, amount] of Object.entries(balances)) {
        if (amount < -0.01) debtors.push({ name: p, amount: amount });
        if (amount > 0.01) creditors.push({ name: p, amount: amount });
    }
    debtors.sort((a, b) => a.amount - b.amount);
    creditors.sort((a, b) => b.amount - a.amount);
    
    const transactions = [];
    let i = 0; j = 0;
    while (i < debtors.length && j < creditors.length) {
        const amount = Math.min(Math.abs(debtors[i].amount), creditors[j].amount);
        transactions.push([debtors[i].name, creditors[j].name, `$${amount.toFixed(2)}`]);
        debtors[i].amount += amount;
        creditors[j].amount -= amount;
        if (Math.abs(debtors[i].amount) < 0.01) i++;
        if (Math.abs(creditors[j].amount) < 0.01) j++;
    }

    // Add Transactions Table below expenses
    const finalY = doc.lastAutoTable.finalY || 150;
    
    doc.setFontSize(14);
    doc.setTextColor(...primaryColor);
    doc.text("Plan de Pagos (Quién debe a Quién)", 14, finalY + 15);

    doc.autoTable({
        startY: finalY + 20,
        head: [['Deudor (Entregar $)', 'Acreedor (Recibir $)', 'Monto']],
        body: transactions,
        theme: 'grid',
        headStyles: { fillColor: [40, 167, 69] }, // Green for money
    });

    doc.save("resumen-gastos.pdf");
}
