import { sliderScroll } from './components/sliderScroll.js'
import { startTimer, stopTimer } from './components/timer.js'
import { loadTest } from './components/FileUpload.js'
import { showTestResult } from './components/TestResult.js'

let startBtn = document.querySelector('.start-button')
let questionNumber = document.querySelector('.questions-scroll')
let questionName = document.querySelector('.question-name')
let answersContainer = document.querySelector('.answers')
let questionSection = document.querySelector('.question-section')
let personalInfo = document.getElementsByClassName('personal-info-inp')
let testNameInput = document.querySelector('.test-name')

let questions = []
let currentQuestionIndex = 0
let userAnswers = []
let testTitle = ''
let spentTime = ''

let gradeThresholds = { bad: 60, ok: 75, good: 90 }
let allQuestions = [] // Для хранения всех вопросов из файла
let questionsToShow = 0 // Количество вопросов для тестируемого
let timeLimit = 0
loadTest(loadedQuestions => {
	console.log('Загруженные вопросы:', loadedQuestions)
	allQuestions = loadedQuestions

	// --- Заполняем название теста и составителя из файла ---
	if (window.lastTestLines && window.lastTestLines.length > 2) {
		const testName = window.lastTestLines[1] || ''
		const testCreator = window.lastTestLines[2] || ''
		const testNameInputElem = document.querySelector('.test-name')
		const testCreatorElem = document.querySelector('.test-creator')
		if (testNameInputElem) testNameInputElem.value = testName
		if (testCreatorElem) testCreatorElem.value = testCreator
		testTitle = testName
	}

	// Сохраняем название теста для результатов
	const testNameInputElem = document.querySelector('.test-name')
	testTitle = testNameInputElem ? testNameInputElem.value : ''

	// --- Чтение критериев оценки из тестового файла ---
	const testCreatorElem = document.querySelector('.test-creator')
	const testInfoElems = [testNameInputElem, testCreatorElem]
	const lines = []
	testInfoElems.forEach(el => {
		if (el && el.value) lines.push(el.value)
	})

	if (window.lastTestLines && window.lastTestLines.length > 14) {
		const bad = parseInt(window.lastTestLines[8], 10)
		const ok = parseInt(window.lastTestLines[9], 10)
		const good = parseInt(window.lastTestLines[10], 10)
		if (!isNaN(bad) && !isNaN(ok) && !isNaN(good)) {
			gradeThresholds = { bad, ok, good }
		}
		// Получаем количество вопросов для тестируемого (0 - все вопросы)
		const qCount = parseInt(window.lastTestLines[12], 10)
		let totalQuestions = allQuestions.length
		if (!isNaN(qCount) && qCount > 0) {
			questionsToShow = Math.min(qCount, totalQuestions)
		} else {
			// Если 0, то берём все вопросы из тестового файла
			questionsToShow = totalQuestions
		}
	} else {
		questionsToShow = allQuestions.length
	}

	// --- Чтение ограничения времени из файла теста ---
	if (window.lastTestLines && window.lastTestLines.length > 11) {
		const limitStr = window.lastTestLines[11]
		const parsedLimit = parseInt(limitStr, 10)
		timeLimit = !isNaN(parsedLimit) ? parsedLimit : 0
	}

	// Выбираем случайные вопросы
	questions = getRandomQuestions(allQuestions, questionsToShow)

	// Переименовываем вопросы для пользователя
	questions.forEach((q, i) => {
		q.text = `Вопрос ${i + 1}`
	})

	renderQuestions()
	sliderScroll() // Перепривязка слайдера после рендера вопросов
})

function getRandomQuestions(arr, count) {
	const shuffled = arr.slice().sort(() => Math.random() - 0.5)
	return shuffled.slice(0, count)
}

// Объединённый обработчик для кнопки старта
// Преобразуем HTMLCollection в массив
personalInfo = [...personalInfo]

startBtn.addEventListener('click', event => {
	const isAllFilled = personalInfo.every(input => input.value.trim() !== '')
	if (!isAllFilled) {
		alert('Заполните поля тестируемого')
		event.preventDefault()
		event.stopImmediatePropagation()
		return
	}

	if (questions.length > 0) {
		displayQuestion(0)
	} else {
		alert('Тест не загружен!')
		return
	}

	questionSection.style.display = 'flex'

	startTimer(timeLimit)
})

function renderQuestions() {
	if (!questions || questions.length === 0) {
		console.error('Вопросы не загружены или пусты.')
		return
	}
	questionNumber.innerHTML = ''
	questions.forEach((question, index) => {
		const questionElement = document.createElement('div')
		questionElement.className = 'question-number'
		questionElement.textContent = `Вопрос ${index + 1}`
		questionElement.addEventListener('click', () => {
			displayQuestion(index)
		})
		questionNumber.appendChild(questionElement)
	})

	if (questions.length > 0) {
		displayQuestion(0)
	}
}

function displayQuestion(index) {
	currentQuestionIndex = index
	const question = questions[index]
	if (!question) {
		console.error(`Вопрос с индексом ${index} не найден.`)
		return
	}
	questionName.value = question.text
	answersContainer.innerHTML = ''

	if (question.type === 3) {
		if (!userAnswers[index])
			userAnswers[index] = new Array(question.left.length).fill('')

		const horizontalWrapper = document.createElement('div')
		horizontalWrapper.style.display = 'flex'
		horizontalWrapper.style.flexDirection = 'row'
		horizontalWrapper.style.marginTop = '150px'
		horizontalWrapper.style.width = '100%'

		const leftCol = document.createElement('div')
		leftCol.style.display = 'flex'
		leftCol.style.flexDirection = 'column'

		question.left.forEach((item, i) => {
			const row = document.createElement('div')
			row.style.display = 'flex'
			row.style.alignItems = 'center'
			row.style.marginBottom = '10px'

			const letterSpan = document.createElement('span')
			letterSpan.textContent = item[0]
			letterSpan.style.fontSize = '2em'
			letterSpan.style.width = '2em'
			letterSpan.style.textAlign = 'center'

			const box = document.createElement('input')
			box.type = 'number'
			box.min = 1
			box.max = question.left.length
			box.className = 'answer-input'
			box.style.width = '40px'
			box.style.textAlign = 'center'
			box.value = userAnswers[index][i] || ''

			box.addEventListener('input', () => {
				userAnswers[index][i] = box.value.trim()
			})

			row.appendChild(letterSpan)
			row.appendChild(box)
			leftCol.appendChild(row)
		})

		horizontalWrapper.appendChild(leftCol)

		if (question.image) {
			const imageElement = document.createElement('img')
			imageElement.src = question.image
			imageElement.alt = `Изображение для вопроса ${index + 1}`
			imageElement.style.display = 'block'
			imageElement.style.marginLeft = '50%'
			imageElement.style.width = '150%'
			imageElement.style.height = 'auto'
			imageElement.style.marginTop = '60px'
			imageElement.style.alignSelf = 'center'
			horizontalWrapper.appendChild(imageElement)
		}

		answersContainer.appendChild(horizontalWrapper)
	}
	// === ОТКРЫТЫЙ ТИП (4) ===
	else if (question.type === 4) {
		const input = document.createElement('input')
		input.type = 'text'
		input.className = 'answer-input'
		answersContainer.appendChild(input)
	}
	// === НА ПОСЛЕДОВАТЕЛЬНОСТЬ (2) ===
	else if (question.type === 2) {
		if (!userAnswers[index])
			userAnswers[index] = new Array(question.sequence.length).fill('')

		const horizontalWrapper = document.createElement('div')
		horizontalWrapper.style.display = 'flex'
		horizontalWrapper.style.flexDirection = 'row'
		horizontalWrapper.style.marginTop = '150px'
		horizontalWrapper.style.width = '100%'

		const leftCol = document.createElement('div')
		leftCol.style.display = 'flex'
		leftCol.style.flexDirection = 'column'
		leftCol.style.marginRight = '40px'

		question.sequence.forEach((item, i) => {
			const row = document.createElement('div')
			row.style.display = 'flex'
			row.style.alignItems = 'center'
			row.style.marginBottom = '10px'

			// Цифра позиции
			const numberSpan = document.createElement('span')
			numberSpan.textContent = (i + 1).toString()
			numberSpan.style.fontSize = '2em'
			numberSpan.style.width = '2em'
			numberSpan.style.textAlign = 'center'

			// Поле для ввода буквы
			const box = document.createElement('input')
			box.type = 'text'
			box.maxLength = 1
			box.className = 'answer-input'
			box.style.width = '30px'
			box.style.textAlign = 'center'
			box.value = userAnswers[index][i] || ''

			box.addEventListener('input', () => {
				userAnswers[index][i] = box.value.trim().toLowerCase()
			})

			row.appendChild(numberSpan)
			row.appendChild(box)
			leftCol.appendChild(row)
		})

		horizontalWrapper.appendChild(leftCol)

		if (question.image) {
			const imageElement = document.createElement('img')
			imageElement.src = question.image
			imageElement.alt = `Изображение для вопроса ${index + 1}`
			imageElement.style.display = 'block'
			imageElement.style.marginLeft = '50%'
			imageElement.style.width = '150%'
			imageElement.style.height = 'auto'
			imageElement.style.marginTop = '60px'
			imageElement.style.alignSelf = 'center'
			horizontalWrapper.appendChild(imageElement)
		}

		answersContainer.appendChild(horizontalWrapper)
	}
	// === ОДИНОЧНЫЙ/МНОЖЕСТВЕННЫЙ ВЫБОР (0, 1) ===
	else if (question.answers) {
		const horizontalWrapper = document.createElement('div')
		horizontalWrapper.style.display = 'flex'
		horizontalWrapper.style.flexDirection = 'row'
		horizontalWrapper.style.marginTop = '20px'
		horizontalWrapper.style.width = '100%'
		horizontalWrapper.style.height = '100%'

		// Левая колонка: варианты ответов
		const leftCol = document.createElement('div')
		leftCol.style.display = 'flex'
		leftCol.style.flexDirection = 'column'
		leftCol.style.marginRight = '40px'

		if (!userAnswers[index]) {
			userAnswers[index] = new Array(question.answers.length).fill(false)
		}
		question.answers.forEach((answer, ansIndex) => {
			const answerElement = document.createElement('div')
			answerElement.style.display = 'flex'
			answerElement.style.alignItems = 'center'
			answerElement.style.marginBottom = '10px'

			const input = document.createElement('input')
			input.type = question.type === 0 ? 'radio' : 'checkbox'
			input.name = `question-${index}`
			input.className = 'answer-input'
			if (userAnswers[index][ansIndex]) {
				input.checked = true
			}
			input.addEventListener('change', () => {
				if (question.type === 0) {
					userAnswers[index] = userAnswers[index].map((_, i) => i === ansIndex)
				} else {
					userAnswers[index][ansIndex] = input.checked
				}
			})

			const label = document.createElement('label')
			label.className = 'answer-name'
			label.textContent = answer.text

			answerElement.appendChild(input)
			answerElement.appendChild(label)
			leftCol.appendChild(answerElement)
		})

		horizontalWrapper.appendChild(leftCol)

		if (question.image) {
			const imageElement = document.createElement('img')
			imageElement.src = question.image
			imageElement.alt = `Изображение для вопроса ${index + 1}`
			imageElement.style.display = 'block'
			imageElement.style.marginLeft = '50%'
			imageElement.style.width = '150%'
			imageElement.style.height = 'auto'
			horizontalWrapper.appendChild(imageElement)
		}

		answersContainer.appendChild(horizontalWrapper)
	}
}

document.querySelector('.ok-btn').addEventListener('click', () => {
	stopTimer()
	showTestResult({
		questions,
		userAnswers,
		testTitle,
		spentTime: window.spentTime,
		gradeThresholds,
		arraysEqualTrimmed,
	})
})

function arraysEqualTrimmed(a, b) {
	if (a.length !== b.length) return false
	for (let i = 0; i < a.length; i++) {
		if (typeof a[i] !== 'string' || typeof b[i] !== 'string') return false
		if (a[i].trim() !== b[i].trim()) return false
	}
	return true
}

import { loadTest as origLoadTest } from './components/FileUpload.js'
function loadTestWithLines(callback) {
	origLoadTest(questions => {
		if (window.lastTestLines) {
		} else if (window._lastTestLines) {
			window.lastTestLines = window._lastTestLines
		}
		callback(questions)
	})
}
window.loadTestWithLines = loadTestWithLines
