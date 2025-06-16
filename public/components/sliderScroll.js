export function sliderScroll() {
	let currentIndex = 0
	const questionsScroll = document.querySelector('.questions-scroll')
	const questionsPerPage = 5 // Количество вопросов на странице

	document.querySelector('.next-button').addEventListener('click', () => {
		const questionNumbers = document.querySelectorAll('.question-number')
		const totalQuestions = questionNumbers.length

		if (currentIndex < totalQuestions - questionsPerPage) {
			currentIndex += questionsPerPage // Сдвигаем на 5 вопросов
			updateQuestionScroll()
		}
	})

	document.querySelector('.previous-button').addEventListener('click', () => {
		if (currentIndex > 0) {
			currentIndex -= questionsPerPage // Сдвигаем на 5 вопросов
			updateQuestionScroll()
		}
	})

	function updateQuestionScroll() {
		const offset = currentIndex * -20 // Сдвиг на 20% за каждый вопрос
		questionsScroll.style.transform = `translateX(${offset}%)`
	}

	// Сброс смещения при инициализации
	updateQuestionScroll()
}
