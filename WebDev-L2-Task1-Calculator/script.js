const expressionDisplay = document.getElementById("expression");
const resultDisplay = document.getElementById("result");
const keypad = document.getElementById("keypad");

let currentInput = "0";
let expression = "";
let justCalculated = false;
let hasError = false;

function updateDisplay() {
    resultDisplay.textContent = currentInput;
    expressionDisplay.textContent = expression || "Ready when you are";
    resultDisplay.classList.toggle("error", hasError);
}

function clearCalculator() {
    currentInput = "0";
    expression = "";
    justCalculated = false;
    hasError = false;
    updateDisplay();
}

function showError(message) {
    currentInput = message;
    expression = "";
    hasError = true;
    justCalculated = false;
    updateDisplay();
}

function formatNumber(number) {
    if (!Number.isFinite(number)) {
        throw new Error("Invalid calculation");
    }

    const rounded = Number(number.toPrecision(12));
    return Object.is(rounded, -0) ? "0" : String(rounded);
}

function appendNumber(number) {
    if (hasError || justCalculated) {
        currentInput = number;
        expression = "";
        hasError = false;
        justCalculated = false;
        updateDisplay();
        return;
    }

    if (currentInput.length >= 15) return;

    if (currentInput === "0") {
        currentInput = number;
    } else if (currentInput === "-0") {
        currentInput = "-" + number;
    } else {
        currentInput += number;
    }

    updateDisplay();
}

function appendDecimal() {
    if (hasError || justCalculated) {
        currentInput = "0.";
        expression = "";
        hasError = false;
        justCalculated = false;
        updateDisplay();
        return;
    }

    if (!currentInput.includes(".")) {
        currentInput += ".";
    }

    updateDisplay();
}

function appendOperator(operator) {
    if (hasError) {
        clearCalculator();
        return;
    }

    if (justCalculated) {
        expression = currentInput;
        justCalculated = false;
    } else if (expression && /[+\-*/]$/.test(expression) && currentInput === "0") {
        expression = expression.slice(0, -1);
    } else {
        expression += currentInput;
    }

    expression += operator;
    currentInput = "0";
    updateDisplay();
}

function tokenize(input) {
    const tokens = input.match(/\d*\.?\d+|[+\-*/]/g);

    if (!tokens || tokens.join("") !== input.replace(/\s/g, "")) {
        throw new Error("Invalid expression");
    }

    return tokens;
}

function calculate(input) {
    const tokens = tokenize(input);
    let position = 0;

    function parseNumber() {
        let sign = 1;

        while (tokens[position] === "+" || tokens[position] === "-") {
            if (tokens[position] === "-") {
                sign *= -1;
            }

            position++;
        }

        const token = tokens[position];

        if (token === undefined || !/^\d*\.?\d+$/.test(token)) {
            throw new Error("Invalid expression");
        }

        position++;
        return sign * Number(token);
    }

    function parseMultiplication() {
        let value = parseNumber();

        while (tokens[position] === "*" || tokens[position] === "/") {
            const operator = tokens[position++];
            const right = parseNumber();

            if (operator === "/" && right === 0) {
                throw new Error("Cannot divide by zero");
            }

            value = operator === "*" ? value * right : value / right;
        }

        return value;
    }

    function parseAddition() {
        let value = parseMultiplication();

        while (tokens[position] === "+" || tokens[position] === "-") {
            const operator = tokens[position++];
            const right = parseMultiplication();

            value = operator === "+" ? value + right : value - right;
        }

        return value;
    }

    const result = parseAddition();

    if (position !== tokens.length || !Number.isFinite(result)) {
        throw new Error("Invalid expression");
    }

    return result;
}

function calculateResult() {
    if (hasError) return;

    const fullExpression = expression
        ? expression + currentInput
        : currentInput;

    try {
        const answer = calculate(fullExpression);

        expression = fullExpression + " =";
        currentInput = formatNumber(answer);
        justCalculated = true;
        hasError = false;
    } catch (error) {
        showError(
            error.message === "Cannot divide by zero"
                ? "Cannot divide by zero"
                : "Invalid expression"
        );
        return;
    }

    updateDisplay();
}

function backspace() {
    if (hasError || justCalculated) {
        clearCalculator();
        return;
    }

    currentInput = currentInput.length > 1
        ? currentInput.slice(0, -1)
        : "0";

    if (currentInput === "-") {
        currentInput = "0";
    }

    updateDisplay();
}

function toggleSign() {
    if (hasError) {
        clearCalculator();
        return;
    }

    currentInput = currentInput.startsWith("-")
        ? currentInput.slice(1)
        : "-" + currentInput;

    justCalculated = false;
    updateDisplay();
}

function applyPercentage() {
    if (hasError) {
        clearCalculator();
        return;
    }

    currentInput = formatNumber(Number(currentInput) / 100);
    justCalculated = false;
    updateDisplay();
}

function handleAction(action) {
    switch (action) {
        case "clear":
            clearCalculator();
            break;
        case "backspace":
            backspace();
            break;
        case "decimal":
            appendDecimal();
            break;
        case "equals":
            calculateResult();
            break;
        case "sign":
            toggleSign();
            break;
        case "percent":
            applyPercentage();
            break;
    }
}

keypad.addEventListener("click", function (event) {
    const button = event.target.closest("button");

    if (!button || !keypad.contains(button)) return;

    if (button.dataset.number !== undefined) {
        appendNumber(button.dataset.number);
    } else if (button.dataset.operator) {
        appendOperator(button.dataset.operator);
    } else if (button.dataset.action) {
        handleAction(button.dataset.action);
    }
});

document.addEventListener("keydown", function (event) {
    const key = event.key;

    if (/^[0-9]$/.test(key)) {
        appendNumber(key);
    } else if (key === ".") {
        appendDecimal();
    } else if (["+", "-", "*", "/"].includes(key)) {
        appendOperator(key);
    } else if (key === "Enter" || key === "=") {
        calculateResult();
    } else if (key === "Backspace") {
        backspace();
    } else if (key === "Escape" || key === "Delete") {
        clearCalculator();
    } else if (key === "%") {
        applyPercentage();
    } else {
        return;
    }

    event.preventDefault();
});

updateDisplay();