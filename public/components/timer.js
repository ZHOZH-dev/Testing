let startBtn = document.querySelector('.start-button')
let endBtn = document.querySelector('.end-button')
let timer = document.getElementById('timer')
let warningEndWindow = document.querySelector('.warning-end-window-box')
let questionSection = document.querySelector('.question-section')
let infoSection = document.querySelector('.info')
let navBar = document.querySelector('.nav-bar')
let okBtn = document.querySelector('.ok-btn')
let testName = document.querySelector('.test-name')
let testCreator = document.querySelector('.test-creator')

import { openPopUp, closePopUp } from './warningWindow.js'

let totalSeconds = 0
let interval
let timerLimit = 0 // в минутах, если 0 — без ограничения
let elapsedSeconds = 0 // <--- добавлено

function updateTime() {
	if (timerLimit > 0) {
		// Обратный отсчет
		if (totalSeconds <= 0) {
			timer.textContent = '00:00:00'
			clearInterval(interval)
			alert('Время теста истекло! Тест будет завершён автоматически.')
			if (typeof window.forceFinishTest === 'function') {
				window.forceFinishTest()
			} else if (okBtn) {
				okBtn.click()
			}
			return
		}
		const hours = Math.floor(totalSeconds / 3600)
		const minutes = Math.floor((totalSeconds % 3600) / 60)
		const seconds = totalSeconds % 60
		timer.textContent = `${hours.toString().padStart(2, '0')}:${minutes
			.toString()
			.padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
		totalSeconds--
		elapsedSeconds++ // <--- увеличиваем потраченное время
	} else {
		// Обычный счетчик вверх
		totalSeconds++
		elapsedSeconds++
		const hours = Math.floor(totalSeconds / 3600)
		const minutes = Math.floor((totalSeconds % 3600) / 60)
		const seconds = totalSeconds % 60
		timer.textContent = `${hours.toString().padStart(2, '0')}:${minutes
			.toString()
			.padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
	}
}

// Запускаем таймер по вызову этой функции
export function startTimer(limitMinutes = 0) {
	timerLimit = parseInt(limitMinutes, 10) || 0
	if (timerLimit > 0) {
		totalSeconds = timerLimit * 60
	} else {
		totalSeconds = 0
	}
	elapsedSeconds = 0 // <--- сбросить потраченное время
	clearInterval(interval)
	updateTime()
	interval = setInterval(updateTime, 1000)
	startBtn.style.pointerEvents = 'none'
	startBtn.style.opacity = '0.3'
	endBtn.style.pointerEvents = 'auto'
	endBtn.style.opacity = '1'
}

// Функция остановки таймера (вызывается при нажатии на ок в окне завершения)
export function stopTimer() {
	const timerElem = document.getElementById('timer')
	if (timerElem) {
		// Сохраняем именно потраченное время
		const hours = Math.floor(elapsedSeconds / 3600)
		const minutes = Math.floor((elapsedSeconds % 3600) / 60)
		const seconds = elapsedSeconds % 60
		window.spentTime = `${hours.toString().padStart(2, '0')}:${minutes
			.toString()
			.padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
	}
	clearInterval(interval)
	timer.textContent = '00:00:00'
	// startBtn.style.pointerEvents = 'auto'
	// startBtn.style.opacity = '1'
	endBtn.style.pointerEvents = 'none'
	endBtn.style.opacity = '0.3'
	warningEndWindow.style.display = 'none'
	questionSection.style.pointerEvents = 'auto'
	infoSection.style.pointerEvents = 'auto'
	navBar.style.pointerEvents = 'auto'
	questionSection.style.opacity = '1'
	infoSection.style.opacity = '1'
	navBar.style.opacity = '1'
	questionSection.style.display = 'none'

	// Включаем поля ввода после завершения теста
	const personalInputs = Array.from(
		document.getElementsByClassName('personal-info-inp')
	)
	personalInputs.forEach(input => {
		input.disabled = false
	})

	testName.value = ''
	testCreator.value = ''
}

openPopUp()
closePopUp()

// --- Для автозавершения теста по таймеру ---
window.forceFinishTest = function () {
	if (okBtn) okBtn.click()
}
