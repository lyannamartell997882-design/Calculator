const appDiv = document.getElementById('app');

if (appDiv) {
  appDiv.innerHTML = `
    <div class="flex-1 flex flex-col max-w-md mx-auto w-full pb-8 px-4 h-full">
      
      <!-- Display Area -->
      <div class="flex-1 flex flex-col justify-end items-end mb-6">
        <div id="prev-display" class="text-gray-400 text-3xl mb-2 h-10 overflow-hidden text-right w-full"></div>
        <div id="display" class="text-white text-6xl font-light overflow-hidden text-right w-full break-all">0</div>
      </div>

      <!-- Keypad -->
      <div class="grid grid-cols-4 gap-4">
        <!-- Row 1 -->
        <button class="btn-action" data-action="clear">AC</button>
        <button class="btn-action" data-action="delete">⌫</button>
        <button class="btn-action" data-action="operator" data-val="%">%</button>
        <button class="btn-operator" data-action="operator" data-val="/">÷</button>
        
        <!-- Row 2 -->
        <button class="btn-num" data-action="num" data-val="7">7</button>
        <button class="btn-num" data-action="num" data-val="8">8</button>
        <button class="btn-num" data-action="num" data-val="9">9</button>
        <button class="btn-operator" data-action="operator" data-val="*">×</button>
        
        <!-- Row 3 -->
        <button class="btn-num" data-action="num" data-val="4">4</button>
        <button class="btn-num" data-action="num" data-val="5">5</button>
        <button class="btn-num" data-action="num" data-val="6">6</button>
        <button class="btn-operator" data-action="operator" data-val="-">-</button>
        
        <!-- Row 4 -->
        <button class="btn-num" data-action="num" data-val="1">1</button>
        <button class="btn-num" data-action="num" data-val="2">2</button>
        <button class="btn-num" data-action="num" data-val="3">3</button>
        <button class="btn-operator" data-action="operator" data-val="+">+</button>
        
        <!-- Row 5 -->
        <button class="btn-num col-span-2" data-action="num" data-val="0">0</button>
        <button class="btn-num" data-action="num" data-val=".">.</button>
        <button class="btn-equal" data-action="calculate">=</button>
      </div>

    </div>
  `;

  // Dynamic styling classes for Tailwind
  const btnClasses = {
    num: 'bg-gray-800 text-white rounded-full h-20 text-3xl font-medium active:bg-gray-600 transition-colors flex items-center justify-center select-none shadow-lg touch-manipulation',
    action: 'bg-gray-600 text-white rounded-full h-20 text-3xl font-medium active:bg-gray-500 transition-colors flex items-center justify-center select-none shadow-lg touch-manipulation',
    operator: 'bg-blue-600 text-white rounded-full h-20 text-3xl font-medium active:bg-blue-500 transition-colors flex items-center justify-center select-none shadow-lg touch-manipulation',
    equal: 'bg-blue-500 text-white rounded-full h-20 text-3xl font-medium active:bg-blue-400 transition-colors flex items-center justify-center select-none shadow-lg touch-manipulation',
  };

  document.querySelectorAll('.btn-num').forEach(el => el.className = btnClasses.num + (el.classList.contains('col-span-2') ? ' col-span-2' : ''));
  document.querySelectorAll('.btn-action').forEach(el => el.className = btnClasses.action);
  document.querySelectorAll('.btn-operator').forEach(el => el.className = btnClasses.operator);
  document.querySelectorAll('.btn-equal').forEach(el => el.className = btnClasses.equal);

  const displayEl = document.getElementById('display') as HTMLElement;
  const prevDisplayEl = document.getElementById('prev-display') as HTMLElement;

  let currentOperand = '0';
  let previousOperand = '';
  let operator: string | null = null;
  let shouldResetScreen = false;

  const updateDisplay = () => {
    displayEl.textContent = currentOperand;
    if (operator != null) {
      prevDisplayEl.textContent = `${previousOperand} ${operator}`;
    } else {
      prevDisplayEl.textContent = previousOperand;
    }
  };

  const clear = () => {
    currentOperand = '0';
    previousOperand = '';
    operator = null;
  };

  const deleteNumber = () => {
    currentOperand = currentOperand.slice(0, -1);
    if (currentOperand === '') currentOperand = '0';
  };

  const appendNumber = (number: string) => {
    if (number === '.' && currentOperand.includes('.')) return;
    if (shouldResetScreen) {
      currentOperand = number;
      shouldResetScreen = false;
      return;
    }
    if (currentOperand === '0' && number !== '.') {
      currentOperand = number;
    } else {
      currentOperand = currentOperand.toString() + number.toString();
    }
    // simple bounds check to prevent overflow
    if (currentOperand.length > 15) {
      currentOperand = currentOperand.slice(0, 15);
    }
  };

  const chooseOperator = (op: string) => {
    if (currentOperand === '') return;
    if (previousOperand !== '') {
      calculate();
    }
    operator = op;
    previousOperand = currentOperand;
    currentOperand = '';
  };

  const calculate = () => {
    let computation: number;
    const prev = parseFloat(previousOperand);
    const current = parseFloat(currentOperand);
    if (isNaN(prev) || isNaN(current)) return;
    switch (operator) {
      case '+':
        computation = prev + current;
        break;
      case '-':
        computation = prev - current;
        break;
      case '*':
        computation = prev * current;
        break;
      case '/':
        computation = prev / current;
        break;
      case '%':
        computation = prev % current;
        break;
      default:
        return;
    }
    const resultStr = computation.toString();
    currentOperand = resultStr;
    operator = null;
    previousOperand = '';
    shouldResetScreen = true;
  };

  document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      const val = btn.getAttribute('data-val') || '';

      switch (action) {
        case 'num':
          appendNumber(val);
          break;
        case 'operator':
          chooseOperator(val);
          break;
        case 'clear':
          clear();
          break;
        case 'delete':
          deleteNumber();
          break;
        case 'calculate':
          calculate();
          break;
      }
      updateDisplay();
    });
  });
}

