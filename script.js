// State Management
let state = {
    participants: [],
    expenses: []
};

// Tutorial Data
const tutorialSteps = [
    {
        icon: 'fa-users',
        color: 'text-blue-400',
        title: '¡Bienvenido a SplitIt!',
        text: 'La forma más fácil y rápida de dividir gastos con amigos, familia o compañeros.'
    },
    {
        icon: 'fa-user-plus',
        color: 'text-purple-400',
        title: '1. Agrega Participantes',
        text: 'Escribe los nombres de las personas (ej. "Ana", "Juan") y agrégalos a la lista.'
    },
    {
        icon: 'fa-money-bill-wave',
        color: 'text-green-400',
        title: '2. Carga Gastos',
        text: 'Selecciona quién pagó, qué compró y cuánto costó. ¡Nosotros hacemos las matemáticas!'
    },
    {
        icon: 'fa-file-pdf',
        color: 'text-pink-400',
        title: '3. Resultados y PDF',
        text: 'Mira quién le debe a quién al instante y descarga un reporte en PDF.'
    }
];
let currentStep = 0;

// Formatting Utility
const formatCurrency = (amount) => {
    // Format: 1.000,00
    // We use 'es-AR' or 'de-DE' which uses dots for thousands and comma for decimals
    return amount.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    renderAll();
    checkTutorial();
});

// Tutorial Functions
function checkTutorial() {
    const seen = localStorage.getItem('splitItTutorialSeen');
    if (!seen) {
        showTutorial();
    }
}

function showTutorial() {
    state.isTutorialOpen = true;
    currentStep = 0;
    document.getElementById('tutorial-modal').classList.remove('hidden');
    renderTutorialStep();
}

function closeTutorial() {
    state.isTutorialOpen = false;
    document.getElementById('tutorial-modal').classList.add('hidden');
    localStorage.setItem('splitItTutorialSeen', 'true');
}

function nextTutorialStep() {
    if (currentStep < tutorialSteps.length - 1) {
        currentStep++;
        renderTutorialStep();
    } else {
        closeTutorial();
    }
}

function renderTutorialStep() {
    const step = tutorialSteps[currentStep];
    const content = document.getElementById('tutorial-content');
    const dots = document.getElementById('tutorial-dots');
    const btn = document.getElementById('tutorial-next-btn');

    content.innerHTML = `
        <div class="mb-6 flex justify-center">
            <div class="w-20 h-20 rounded-full bg-gray-700/50 flex items-center justify-center border border-gray-600">
                <i class="fa-solid ${step.icon} text-4xl ${step.color}"></i>
            </div>
        </div>
        <h3 class="text-2xl font-bold text-white mb-2">${step.title}</h3>
        <p class="text-gray-300 leading-relaxed">${step.text}</p>
    `;

    // Render Dots
    dots.innerHTML = tutorialSteps.map((_, i) => `
        <div class="w-2 h-2 rounded-full transition-colors ${i === currentStep ? 'bg-blue-500 w-4' : 'bg-gray-600'}"></div>
    `).join('');

    btn.textContent = currentStep === tutorialSteps.length - 1 ? '¡Empezar!' : 'Siguiente';
}

// Persistence
function saveState() {
    localStorage.setItem('splitItData', JSON.stringify({
        participants: state.participants,
        expenses: state.expenses
    }));
    renderAll();
}

function loadState() {
    const saved = localStorage.getItem('splitItData');
    if (saved) {
        const parsed = JSON.parse(saved);
        state.participants = parsed.participants || [];
        state.expenses = parsed.expenses || [];
    }
}

function resetApp() {
    if (confirm('¿Estás seguro de que quieres borrar todos los datos?')) {
        state.participants = [];
        state.expenses = [];
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

    state.expenses.unshift(expense);

    descInput.value = '';
    amountInput.value = '';
    descInput.focus();

    saveState();
}

function deleteExpense(id) {
    if (confirm('¿Borrar este gasto?')) {
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

    list.innerHTML = '';
    const currentPayer = select.value;
    select.innerHTML = '';

    if (state.participants.length === 0) {
        overlay.classList.remove('opacity-0', 'pointer-events-none');
    } else {
        overlay.classList.add('opacity-0', 'pointer-events-none');
    }

    state.participants.forEach(name => {
        const badge = document.createElement('div');
        badge.className = 'bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 transition-colors border border-gray-600';
        badge.innerHTML = `
            <span>${name}</span>
            <button onclick="removeParticipant('${name}')" class="text-gray-400 hover:text-red-400"><i class="fa-solid fa-xmark"></i></button>
        `;
        list.appendChild(badge);

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
                <span class="font-bold text-green-400">$${formatCurrency(expense.amount)}</span>
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

    document.getElementById('total-spent').textContent = formatCurrency(total);
    document.getElementById('participant-count').textContent = count;
    document.getElementById('average-cost').textContent = formatCurrency(avg);

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

    const balances = {};
    state.participants.forEach(p => balances[p] = 0);
    state.expenses.forEach(e => {
        balances[e.payer] += e.amount;
    });
    state.participants.forEach(p => {
        balances[p] -= avg;
    });

    const balanceContainer = document.getElementById('individual-balances');
    balanceContainer.innerHTML = '';

    const sortedParticipants = Object.keys(balances).sort((a, b) => balances[b] - balances[a]);

    sortedParticipants.forEach(p => {
        const bal = balances[p];
        const isPositive = bal >= 0;
        const colorClass = isPositive ? 'text-green-400' : 'text-red-400';
        const barColor = isPositive ? 'bg-green-500' : 'bg-red-500';
        const widthPercent = Math.min(Math.abs(bal) / (total || 1) * 100 * 2, 100);

        const el = document.createElement('div');
        el.className = 'flex items-center gap-3 text-sm';
        el.innerHTML = `
            <div class="w-24 shrink-0 truncate text-white font-medium">${p}</div>
            <div class="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden flex ${isPositive ? 'justify-start' : 'justify-end'}">
                 <div class="h-full ${barColor} opacity-80" style="width: ${widthPercent}%;"></div>
            </div>
            <div class="w-24 text-right font-bold ${colorClass}">
                ${bal > 0 ? '+' : ''}${formatCurrency(bal)}
            </div>
        `;
        balanceContainer.appendChild(el);
    });

    // Settlement Logic
    let debtors = [];
    let creditors = [];
    for (const [p, amount] of Object.entries(balances)) {
        if (amount < -0.01) debtors.push({ name: p, amount: amount });
        if (amount > 0.01) creditors.push({ name: p, amount: amount });
    }
    debtors.sort((a, b) => a.amount - b.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const settlementContainer = document.getElementById('settlement-plan');
    settlementContainer.innerHTML = '';

    if (debtors.length === 0 && creditors.length === 0) {
        settlementContainer.innerHTML = '<div class="text-green-400 font-bold">¡Todo está equilibrado!</div>';
        return;
    }

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        const amount = Math.min(Math.abs(debtor.amount), creditor.amount);

        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700/50';
        div.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="font-bold text-red-300">${debtor.name}</span>
                <i class="fa-solid fa-arrow-right-long text-gray-500"></i>
                <span class="font-bold text-green-300">${creditor.name}</span>
            </div>
            <span class="font-bold text-white">$${formatCurrency(amount)}</span>
        `;
        settlementContainer.appendChild(div);

        debtor.amount += amount;
        creditor.amount -= amount;

        if (Math.abs(debtor.amount) < 0.01) i++;
        if (Math.abs(creditor.amount) < 0.01) j++;
    }
}

// PDF Generation
function downloadPDF() {
    if (!window.jspdf) {
        alert('Error cargando librería PDF');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const primaryColor = [79, 70, 229];
    const secondaryColor = [100, 100, 100];

    doc.setFontSize(22);
    doc.setTextColor(...primaryColor);
    doc.text("Reporte de Gastos - SplitIt", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(...secondaryColor);
    doc.text(`Generado el: ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`, 14, 28);

    let total = state.expenses.reduce((acc, curr) => acc + curr.amount, 0);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Gastado: $${formatCurrency(total)}`, 14, 40);
    doc.text(`Promedio por Persona: $${formatCurrency(total / state.participants.length)}`, 14, 46);

    const tableData = state.expenses.map(e => [
        new Date(e.date).toLocaleDateString(),
        e.payer,
        e.description,
        `$${formatCurrency(e.amount)}`
    ]);

    doc.autoTable({
        startY: 55,
        head: [['Fecha', 'Pagó', 'Concepto', 'Monto']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        styles: { font: "helvetica", fontSize: 10 },
    });

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
        transactions.push([debtors[i].name, creditors[j].name, `$${formatCurrency(amount)}`]);
        debtors[i].amount += amount;
        creditors[j].amount -= amount;
        if (Math.abs(debtors[i].amount) < 0.01) i++;
        if (Math.abs(creditors[j].amount) < 0.01) j++;
    }

    const finalY = doc.lastAutoTable.finalY || 150;
    doc.setFontSize(14);
    doc.setTextColor(...primaryColor);
    doc.text("Plan de Pagos (Quién debe a Quién)", 14, finalY + 15);

    doc.autoTable({
        startY: finalY + 20,
        head: [['Deudor (Entregar $)', 'Acreedor (Recibir $)', 'Monto']],
        body: transactions,
        theme: 'grid',
        headStyles: { fillColor: [40, 167, 69] },
    });

    doc.save("resumen-gastos.pdf");
}
