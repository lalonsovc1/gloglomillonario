// Variables y elementos
const questionTextEl = document.getElementById('question-text');
const answersEls = document.querySelectorAll('.answer');
const circles = document.querySelectorAll('.circle');
const resultEl = document.getElementById('result');
const callTimerEl = document.getElementById('call-timer');
const btnFifty = document.getElementById('fifty');
const btnCall = document.getElementById('call');
const btnRoulette = document.getElementById('roulette');
const btnWizard = document.getElementById('wizard');

let preguntas = [];

let currentQuestionIndex = 0;
let currentAnswerIndex = 0;  // respuestas mostradas
let isWriting = false;
let canStartWriting = false; // indica si ya cargó la pregunta pero espera space para empezar a escribir
let canShowAnswers = false;  // indica que terminó de escribir la pregunta y puede mostrar respuestas con space
let selectedAnswer = null;
let confirmed = false;
let usedComodines = {
  fifty: false, call: false, roulette: false, wizard: false
};

function resetEstadoPregunta() {
  currentAnswerIndex = 0;
  isWriting = false;
  canStartWriting = false;
  canShowAnswers = false;
  selectedAnswer = null;
  confirmed = false;
  answersEls.forEach(a => {
    a.style.opacity = '0';
    a.classList.remove('selected', 'correct', 'incorrect', 'hidden');
  });
  questionTextEl.textContent = '';
  resultEl.classList.add('hidden');
  callTimerEl.style.display = 'none';
}

function escribirTexto(text, callback) {
  let i = 0;
  isWriting = true;
  questionTextEl.textContent = '';
  const interval = setInterval(() => {
    questionTextEl.textContent += text.charAt(i++);
    if (i >= text.length) {
      clearInterval(interval);
      isWriting = false;
      canShowAnswers = true;
      if (callback) callback();
    }
  }, 50);
}

function prepararPregunta() {
  resetEstadoPregunta();
  const p = preguntas[currentQuestionIndex];
  answersEls.forEach((el, i) => el.querySelector('span').textContent = p.answers[i]);
  // no escribe la pregunta todavía, solo indica que está lista para empezar
  canStartWriting = true;
}

function mostrarRespuesta(i) {
  if (i < answersEls.length) {
    answersEls[i].style.opacity = '1';
  }
}

function actualizarSeleccion() {
  answersEls.forEach((el, i) => el.classList.toggle('selected', i === selectedAnswer));
}

function manejarRespuesta() {
  const correcta = preguntas[currentQuestionIndex].correct;
  if (selectedAnswer === correcta) {
    answersEls[selectedAnswer].classList.add('correct');
    circles[currentQuestionIndex].classList.add('active');
    resultEl.classList.remove('hidden');
    resultEl.style.color = 'lime';
    resultEl.textContent = "Respuesta correcta 👍";
    currentQuestionIndex++;
    if (currentQuestionIndex >= preguntas.length) {
      setTimeout(() => mostrarResultado(true), 1500);
    } else {
      setTimeout(() => {
        resultEl.classList.add('hidden');
        prepararPregunta();
      }, 1500);
    }
  } else {
    answersEls[selectedAnswer].classList.add('incorrect');
    resultEl.classList.remove('hidden');
    resultEl.style.color = 'red';
    resultEl.textContent = "Respuesta incorrecta ❌ Fin del juego.";
  }
}

function mostrarResultado(gano) {
  canShowAnswers = false;
  canStartWriting = false;
  isWriting = false;
  resultEl.classList.remove('hidden');
  resultEl.textContent = gano ? "¡Felicidades! Has ganado el Concursillo." : "Has fallado. Fin del juego.";
  resultEl.style.color = gano ? 'lime' : 'red';
}

window.addEventListener('keydown', (e) => {
  if (isWriting) return;

  if (e.code === 'Space') {
    e.preventDefault();
    if (canStartWriting) {
      // primer espacio, comienza a escribir la pregunta
      const p = preguntas[currentQuestionIndex];
      escribirTexto(p.question);
      canStartWriting = false;
      return;
    }

    if (canShowAnswers && !confirmed) {
      // mostrar respuestas una por una con space
      if (currentAnswerIndex < answersEls.length) {
        mostrarRespuesta(currentAnswerIndex++);
      }
      return;
    }
  }

  // Sólo permitir selección si ya se mostraron todas las respuestas
  if (currentAnswerIndex === answersEls.length && !confirmed) {
    if (['1','2','3','4'].includes(e.key)) {
      selectedAnswer = Number(e.key) - 1;
      actualizarSeleccion();
    } else if (e.key === 'Enter' && selectedAnswer !== null) {
      confirmed = true;
      manejarRespuesta();
    }
  }
});

fetch('preguntas.json')
  .then(res => res.json())
  .then(data => {
    preguntas = data;
    prepararPregunta();
  })
  .catch(err => {
    questionTextEl.textContent = "Error cargando preguntas.";
    console.error(err);
  });


// 50/50: oculta 2 respuestas incorrectas
btnFifty.addEventListener('click', () => {
  if (usedComodines.fifty || !canShowAnswers) return;
  usedComodines.fifty = true;
  btnFifty.style.opacity = '0.4';
  const correcta = preguntas[currentQuestionIndex].correct;
  let ocultadas = 0;
  for (let i = 0; i < 4; i++) {
    if (i !== correcta && ocultadas < 2) {
      answersEls[i].classList.add('hidden');
      ocultadas++;
    }
  }
});

// Llamada: muestra un contador de 60 segundos
btnCall.addEventListener('click', () => {
  if (usedComodines.call || !canShowAnswers) return;
  usedComodines.call = true;
  let tiempo = 60;
  callTimerEl.style.display = 'block';
  callTimerEl.textContent = `⏱️ Llamada: ${tiempo}s`;
  const interval = setInterval(() => {
    tiempo--;
    callTimerEl.textContent = `⏱️ Llamada: ${tiempo}s`;
    if (tiempo <= 0) {
      clearInterval(interval);
      callTimerEl.style.display = 'none';
    }
  }, 1000);
});

// Ruleta: elimina de 1 a 3 respuestas incorrectas al azar
btnRoulette.addEventListener('click', () => {
  if (usedComodines.roulette || !canShowAnswers) return;
  usedComodines.roulette = true;
  const correcta = preguntas[currentQuestionIndex].correct;
  let cantidad = Math.floor(Math.random() * 3) + 1; // de 1 a 3
  let eliminadas = 0;
  let intentos = 0;
  while (eliminadas < cantidad && intentos < 10) {
    const i = Math.floor(Math.random() * 4);
    if (i !== correcta && !answersEls[i].classList.contains('hidden')) {
      answersEls[i].classList.add('hidden');
      eliminadas++;
    }
    intentos++;
  }
});

// Mago: pasa directamente a la siguiente pregunta
btnWizard.addEventListener('click', () => {
  if (usedComodines.wizard || !canShowAnswers) return;
  usedComodines.wizard = true;
  circles[currentQuestionIndex].classList.add('active');
  currentQuestionIndex++;
  if (currentQuestionIndex >= preguntas.length) {
    mostrarResultado(true);
  } else {
    prepararPregunta();
  }
});

function mostrarRespuesta(i) {
  if (i < answersEls.length) {
    answersEls[i].style.opacity = '1';
    answersEls[i].classList.add('visible');
  }
}

