const addBtn = document.getElementById("addBtn");
const list = document.getElementById("list");
const totalText = document.getElementById("total");

const authSection = document.getElementById("authSection");
const appSection = document.getElementById("appSection");
const authMessage = document.getElementById("authMessage");

let expenses = [];
let currentFilter = "All";
let currentTotal = 0;

function getToken() {
    return localStorage.getItem("token");
}

async function api(url, options = {}) {
    options.headers = {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken()
    };
    
    const response = await fetch(url, options);

    if (response.status === 401) {
        logout();
    }

    return response;
}

function logout() {
    localStorage.removeItem("token");
    expenses = [];
    showScreen();
}

function showScreen() {
    if (getToken()) {
        authSection.style.display = "none";
        appSection.style.display = "block";
        loadExpenses();
    } else {
        authSection.style.display = "block";
        appSection.style.display = "none";
    }
}

async function sendAuth(path) {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const response = await fetch("/api/auth/" + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password })
    });
    const data = await response.json();

    if (!response.ok) {
        authMessage.textContent = data.error;
        return false;
    }

    return data;
}

document.getElementById("loginBtn").addEventListener("click", async function () {  
    const data = await sendAuth("login");
    if (!data) return;

    localStorage.setItem("token", data.token);
    authMessage.textContent = "";
    showScreen();
});

document.getElementById("registerBtn").addEventListener("click", async function () {
    const data = await sendAuth("register");
    if (!data) return;

    authMessage.textContent = "Account created. Now click Login.";
});

document.getElementById("logoutBtn").addEventListener("click", logout);

async function loadExpenses() {
    const response = await api("/api/expenses");
    if (!response.ok) return;

    expenses = await response.json();
    showExpenses();
}

function showExpenses() {
    list.innerHTML = "";

    const visibleExpenses = expenses.filter(function (expense) {
        return currentFilter === "All" || expense.category === currentFilter;
    });

    if (visibleExpenses.length === 0) {
        list.innerHTML = '<li class="empty">No expenses yet</li>';
    }

    visibleExpenses.forEach(function (expense) {
        const li = document.createElement("li");

        const name = document.createElement("span");
        name.className = "name";
        name.textContent = expense.title;

        const tag = document.createElement("span");
        tag.className = "tag " + expense.category.toLowerCase();
        tag.textContent = expense.category;

        const price = document.createElement("span");
        price.className = "price";
        price.textContent = "PHP" + expense.amount.toLocaleString();

        const action = document.createElement("div");
        price.className = "action";
        
        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.className = "secondary small";
        editBtn.addEventListener("click", function () {
            editExpense(expense.id);
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "danger small";
        deleteBtn.addEventListener("click", function () {
            deleteExpense(expense.id);
        });

        action.appendChild(editBtn);
        action.appendChild(deleteBtn);
        
        li.appendChild(name);
        li.appendChild(tag);
        li.appendChild(price);
        li.appendChild(action);
        list.appendChild(li);
    });

    const total = visibleExpenses.reduce(function (sum, expense) {
        return sum + expense.amount;
    }, 0);

    currentTotal = total;
    totalText.textContent = "PHP" + total.toLocaleString();
}

async function deleteExpense(id) {
    expenses = expenses.filter(function (e) {
        return e.id !==id;
    });
    showExpenses();

    await api("/api/expenses/" + id, { method: "DELETE" });
    loadExpenses();
}

async function editExpense(id) { 
    const expense = expenses.find(function (e) {
        return e.id === id;
    });

    const newTitle = prompt("New title:", expense.title);
    const newAmount = prompt("New amount:", expense.amount);

    if (newTitle === null || newAmount === null) return;

    const response = await api("/api/expenses/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, amount: newAmount })
    });

    if (!response.ok) {
        const data = await response.json();
        alert(data.error);
        return;
    }

    loadExpenses();
}

addBtn.addEventListener("click", async function () {
    const title = document.getElementById("title").value;
    const amount = Number(document.getElementById("amount").value);
    const category = document.getElementById("category").value;

    addBtn.disabled = true;

    const response = await api("/api/expenses", {
        method: "POST",
        body: JSON.stringify({ title: title, amount: amount, category:category })
    });

    addBtn.disabled = false;

    if (!response.ok) {
        const data = await response.json();
        alert(data.error);
        return;
    }
    
    loadExpenses();
});


const filterButtons = document.querySelectorAll("#filters button");

filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        currentFilter = button.dataset.category;

        filterButtons.forEach(function (b) {
            b.classList.remove("active");
        });
        button.classList.add("active");

        showExpenses();
    });
});


const convertBtn = document.getElementById("convertBtn");
const convertedText = document.getElementById("converted");

convertBtn.addEventListener("click", async function () {
    const currency = document.getElementById("currency").value;
    convertedText.textContent = "Loading...";

    try {
        const response = await fetch(
            "https://api.frankfurter.dev/v1/latest?base=PHP&symbols=" + currency
        );
        const data = await response.json();
        const converted = (currentTotal * data.rates[currency]).toFixed(2);
        convertedText.textContent = "≈ " + converted + " " + currency;
    } catch (error) {
        convertedText.textContent = "Could not get the rate.";
    }
});

showExpenses();