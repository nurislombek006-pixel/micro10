let allQuestions = [];       // Массив для всех вопросов из JSON
let testQuestions = [];      // Вопросы, отобранные для текущего теста
let currentQuestionIndex = 0;
let score = 0;
let answered = false;        // Флаг: ответил ли пользователь на текущий вопрос

// Автоматическая загрузка вопросов при старте страницы
window.onload = function() {
    fetch('micro_tests.json')
        .then(response => {
            if (!response.ok) throw new Error("Не удалось загрузить JSON-файл");
            return response.json();
        })
        .then(data => {
            allQuestions = data;
            console.log(`Успешно загружено вопросов: ${allQuestions.length}`);
        })
        .catch(error => {
            alert("Ошибка загрузки базы тестов. Убедитесь, что файл micro_tests.json лежит в той же папке.");
            console.error(error);
        });
};

// Переключение экранов
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// Запуск теста
function startTest() {
    if (allQuestions.length === 0) {
        alert("База вопросов еще не загрузилась. Подождите секунду.");
        return;
    }

    const countSetting = document.getElementById('setting-count').value;
    const orderSetting = document.getElementById('setting-order').value;

    // Копируем массив, чтобы не испортить исходный
    let pool = [...allQuestions];

    // Если выбран случайный порядок, перемешиваем весь пул
    if (orderSetting === 'random') {
        pool = shuffleArray(pool);
    }

    // Определяем количество вопросов
    let count = countSetting === 'all' ? pool.length : parseInt(countSetting);
    testQuestions = pool.slice(0, count);

    // Сброс параметров теста
    currentQuestionIndex = 0;
    score = 0;
    
    showScreen('screen-test');
    renderQuestion();
}

// Функция перемешивания массива
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Отрендерить текущий вопрос
function renderQuestion() {
    answered = false;
    document.getElementById('btn-next').disabled = true;

    const currentQuestion = testQuestions[currentQuestionIndex];
    
    // Счетчик
    document.getElementById('question-counter').innerText = `Вопрос ${currentQuestionIndex + 1} из ${testQuestions.length}`;
    
    // Текст вопроса
    document.getElementById('question-text').innerText = `${currentQuestion.id}. ${currentQuestion.question}`;
    
    // Варианты ответов
    const container = document.getElementById('options-container');
    container.innerHTML = '';

    currentQuestion.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.innerText = option;
        button.onclick = () => selectOption(index, button);
        container.appendChild(button);
    });
}

// Обработка выбора ответа
function selectOption(selectedIndex, clickedButton) {
    if (answered) return; // Если уже ответил, кликать нельзя
    answered = true;

    const currentQuestion = testQuestions[currentQuestionIndex];
    const correctIndex = currentQuestion.correct_index;
    const buttons = document.querySelectorAll('.option-btn');

    if (selectedIndex === correctIndex) {
        clickedButton.classList.add('correct');
        score++;
    } else {
        clickedButton.classList.add('wrong');
        // Подсвечиваем правильный, чтобы пользователь учился
        buttons[correctIndex].classList.add('correct');
    }

    // Активируем кнопку "Дальше"
    document.getElementById('btn-next').disabled = false;
}

// Переход к следующему вопросу
function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < testQuestions.length) {
        renderQuestion();
    } else {
        finishTest();
    }
}

// Завершение теста (когда прошли до конца)
function finishTest() {
    saveToHistory(score, testQuestions.length);
    alert(`Тест завершен! Ваш результат: ${score} из ${testQuestions.length}`);
    showScreen('screen-menu');
}

// Логика модального окна (Досрочный выход)
function confirmExit() {
    document.getElementById('modal-confirm').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal-confirm').style.display = 'none';
}

function exitTest() {
    closeModal();
    // Сохраняем результат досрочно за те вопросы, на которые успели ответить
    saveToHistory(score, currentQuestionIndex + (answered ? 1 : 0));
    showScreen('screen-menu');
}

// Сохранение в LocalStorage
function saveToHistory(score, total) {
    const history = JSON.parse(localStorage.getItem('quiz_history') || '[]');
    const now = new Date();
    const dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    history.unshift({
        date: dateStr,
        score: score,
        total: total
    });

    localStorage.setItem('quiz_history', JSON.stringify(history));
}

// Показ экрана истории
function showHistoryScreen() {
    showScreen('screen-history');
    const container = document.getElementById('history-list');
    container.innerHTML = '';

    const history = JSON.parse(localStorage.getItem('quiz_history') || '[]');

    if (history.length === 0) {
        container.innerHTML = '<p style="color:#666; text-align:center; padding: 20px;">История пока пуста</p>';
        return;
    }

    history.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <span>📅 ${item.date}</span>
            <strong>🏆 ${item.score} / ${item.total}</strong>
        `;
        container.appendChild(div);
    });
}

// Очистка истории
function clearHistory() {
    if (confirm("Вы точно хотите удалить всю историю прохождений?")) {
        localStorage.removeItem('quiz_history');
        showHistoryScreen();
    }
}