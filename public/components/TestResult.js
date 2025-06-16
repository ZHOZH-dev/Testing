export function showTestResult({
	questions,
	userAnswers,
	testTitle,
	spentTime,
	gradeThresholds,
	arraysEqualTrimmed,
}) {
	const testResultSection = document.querySelector('.test-result')
	const questionSection = document.querySelector('.question-section')
	const personalInputs = Array.from(
		document.getElementsByClassName('personal-info-inp')
	)

	// Получаем ФИО
	const fio = personalInputs
		.slice(0, 3)
		.map(input => input.value.trim())
		.filter(Boolean)
		.join(' ')

	// Подсчет баллов
	let correctCount = 0
	let totalCount = 0

	questions.forEach((question, idx) => {
		if (question.type === 0 || question.type === 1) {
			const correct = question.answers.map(a => !!a.isCorrect)
			const user = userAnswers[idx] || []
			if (JSON.stringify(correct) === JSON.stringify(user)) correctCount++
			totalCount++
		}
		if (question.type === 2 && question.sequence) {
			const user = (userAnswers[idx] || []).map(x => (x || '').toLowerCase())
			const right = question.sequence.map(x => x[0].toLowerCase())
			if (arraysEqualTrimmed(user, right)) correctCount++
			totalCount++
		}
		if (question.type === 3 && question.left && question.right) {
			const user = (userAnswers[idx] || []).map(x => String(x || '').trim())
			const right = question.right.map(x => String(x).trim())
			if (arraysEqualTrimmed(user, right)) correctCount++
			totalCount++
		}
	})

	if (totalCount === 0) totalCount = questions.length

	const percent =
		totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0

	let grade = 'Неудовлетворительно'
	if (percent >= gradeThresholds.good) grade = 'Отлично'
	else if (percent >= gradeThresholds.ok) grade = 'Хорошо'
	else if (percent >= gradeThresholds.bad) grade = 'Удовлетворительно'

	testResultSection.innerHTML = `
        <div style="margin: 30px 0;">
            <strong>Тестируемый:</strong>
            <input type="text" value="${fio}" readonly style="font-size: 1.2em;">
        </div>
        <div style="margin: 30px 0;">
            <strong>Название теста:</strong>
            <input type="text" value="${testTitle}" readonly style=" font-size: 1.2em;">
        </div>
        <div style="margin: 30px 0;">
            <strong>Затраченное время:</strong>
            <input type="text" value="${spentTime}" readonly style=" font-size: 1.2em;">
        </div>
        <div style="margin: 30px 0;">
            <strong>Результат:</strong>
            <span style="font-size: 1.3em;">${percent}%</span>
        </div>
        <div style="margin: 30px 0;">
            <strong>Оценка:</strong>
            <span style="font-size: 1.3em;">${grade}</span>
        </div>
    `

	questionSection.style.display = 'none'
	testResultSection.style.display = 'block'
}
