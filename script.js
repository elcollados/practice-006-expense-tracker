const addBtn = document.getElementById("addBtn");
const list = document.getElementById("list");
const totalText = document.getElementById("total");

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
function saveExpenses() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
}
let currentFilter = "All";
let currentTotal = 0;


function showExpenses() {
    list.innerHTML = "";

    const visibleExpense = expenses.filter(function (expense) {
        return currentFilter === "All" || expense.category === currentFilter;
    })

    visibleExpense.forEach(function (expense) {
        const li = document.createElement("li");
        li.textContent = expense.title + " - PHP" + expense.amount + " (" + expense.category + ")";
        
        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", function () {
            editExpense(expense.id);
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", function () {
            deleteExpense(expense.id);
        });
        
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);
        list.appendChild(li);
    });

    const total = visibleExpense.reduce(function (sum, expense) {
        return sum + expense.amount;
    }, 0);

    currentTotal = total;
    totalText.textContent = "Total: PHP" + total;
}







addBtn.addEventListener("click", function () {
    const title = document.getElementById("title").value;
    const amount = Number (document.getElementById("amount").value);
    const category = document.getElementById("category").value;

    const expense = { id: Date.now(), title: title, amount: amount, category:category };
    expenses.push(expense);

    saveExpenses();
    showExpenses();
});

function deleteExpense(id) {
    expenses =expenses.filter(function (expense) {
        return expense.id !== id;
    });
    saveExpenses();
    showExpenses();
}

function editExpense(id) {
    const expense = expenses.find(function (e) {
        return e.id === id;
    });

    const newTitle = prompt("New title", expense.title);
    const newAmount = prompt("New amount", expense.amount);

    if (newTitle === null || newAmount === null) return;

    expense.title = newTitle;
    expense.amount = Number(newAmount);

    saveExpenses();
    showExpenses();
}




const filterButtons = document.querySelectorAll("#filters button");

filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        currentFilter = button.dataset.category;
        showExpenses();
    });
});

showExpenses();

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
