let fileUploadBtn = document.querySelector('.file-upload') // Кнопка для выбора файла теста и папки с изображениями
let testName = document.querySelector('.test-name')
let testCreator = document.querySelector('.test-creator')
let personalInfo = document.getElementsByClassName('personal-info-inp')

export function fileUpload(callback) {
	if (!fileUploadBtn) {
		console.error('Элемент .file-upload не найден.')
		return
	}

	personalInfo = [...personalInfo] // Преобразуем HTMLCollection в массив для удобства
	// fileUploadBtn.addEventListener('click', event => {
	// 	const isAllFilled = personalInfo.every(input => input.value.trim() !== '')
	// 	if (!isAllFilled) {
	// 		alert('Заполните поля тестируемого')
	// 		event.preventDefault() // предотвращает открытие окна выбора файлов
	// 	}
	// })
	fileUploadBtn.addEventListener('change', () => {
		const files = Array.from(fileUploadBtn.files)
		personalInfo.forEach(input => {
			input.disabled = true // Скрываем поля ввода после выбора файла
		})
		// Создаем карту изображений: ключ – имя файла, значение – объект File
		const imageFilesMap = {}
		files.forEach(file => {
			// Если файл изображение
			if (file.type.startsWith('image/')) {
				// Используем только имя файла (без пути)
				imageFilesMap[file.name] = file
			}
		})

		// Определяем файл теста
		const testFile = files.find(
			file => file.name.endsWith('.tst') || file.name.endsWith('.txt')
		)
		if (!testFile) {
			alert('Файл теста (.tst или .txt) не найден!')
			return
		}

		// Папка теста (относительный путь)
		const folderPath = testFile.webkitRelativePath
			.split('/')
			.slice(0, -1)
			.join('/')
		console.log('Путь к папке с тестом:', folderPath)

		const reader = new FileReader()
		reader.onload = () => {
			const decoder = new TextDecoder('windows-1251')
			const fileContent = decoder.decode(reader.result)
			const lines = fileContent.split(/\r?\n/).map(line => line.trim())
			console.log('lines[13]:', lines[13]) // Для отладки

			let questionCountStr = lines[13]
			questionCountStr = questionCountStr.replace(/[^\d]/g, '')
			const questionCount = parseInt(questionCountStr, 10)
			if (isNaN(questionCount) || questionCount <= 0) {
				console.error('Некорректное количество вопросов:', questionCountStr)
				return
			}

			const questions = []
			let questionIndex = 15 // <-- исправлено, было 14

			for (let i = 0; i < questionCount; i++) {
				console.log(
					`Обрабатываем вопрос ${i + 1}, текущий индекс: ${questionIndex}`
				)

				// Считываем два поля для изображения:
				// Первое поле – не используется (флаг)
				let flag = lines[questionIndex++]
				// Второе поле – имя изображения, если задано, или "0"
				let potentialImage = lines[questionIndex++]
				let hasImage = false
				let imageName = null
				let imageURL = null // <-- объявляем imageURL сразу

				if (
					potentialImage !== '0' &&
					/\.(bmp|png|jpg|jpeg)$/i.test(potentialImage)
				) {
					hasImage = true
					imageName = potentialImage
				} else {
					hasImage = false
				}

				// Для fileUpload (локальная загрузка)
				if (typeof imageFilesMap !== 'undefined') {
					if (hasImage && imageName) {
						const imageFile = imageFilesMap[imageName]
						if (imageFile) {
							imageURL = URL.createObjectURL(imageFile)
						}
					}
				}
				// Для loadTest (HTTP загрузка)
				if (typeof testFolder !== 'undefined') {
					if (hasImage && imageName) {
						imageURL = `/tests/${testFolder}/${imageName}`
					}
				}

				// Далее считываем тип вопроса
				if (questionIndex >= lines.length) {
					console.error(`Недостаточно данных для типа вопроса ${i + 1}`)
					break
				}
				const questionType = parseInt(lines[questionIndex], 10)
				questionIndex++

				if (questionType === 3) {
					const chainLength = parseInt(lines[questionIndex], 10)
					questionIndex++
					const leftItems = []
					for (let j = 0; j < chainLength; j++) {
						leftItems.push(lines[questionIndex++])
					}
					const rightItems = []
					for (let j = 0; j < chainLength; j++) {
						rightItems.push(lines[questionIndex++])
					}
					questions.push({
						text: `Вопрос ${i + 1}`,
						type: questionType,
						left: leftItems, // буквы (а, б, в...)
						right: rightItems, // цифры (1, 2, 3...) — правильный порядок
						image: imageURL,
					})
					continue // переход к следующему вопросу
				}

				if (questionType === 2) {
					// на последовательность
					const chainLength = parseInt(lines[questionIndex], 10)
					questionIndex++
					const sequenceAnswers = []
					for (let j = 0; j < chainLength; j++) {
						sequenceAnswers.push(lines[questionIndex++])
					}
					questions.push({
						text: `Вопрос ${i + 1}`,
						type: questionType,
						sequence: sequenceAnswers,
						image: imageURL,
					})
					continue
				}

				// Считываем количество ответов
				if (questionIndex >= lines.length) {
					console.error(
						`Недостаточно данных для количества ответов вопроса ${i + 1}`
					)
					break
				}
				const answerCount = parseInt(lines[questionIndex], 10)
				questionIndex++

				if (isNaN(questionType) || isNaN(answerCount)) {
					console.error(
						`Некорректные данные для вопроса ${
							i + 1
						}: тип или количество ответов не число.`
					)
					break
				}

				// Проверяем, что достаточно строк для ответов (каждый ответ – 2 строки)
				if (questionIndex + answerCount * 2 > lines.length) {
					console.error(`Недостаточно данных для ответов вопроса ${i + 1}`)
					break
				}

				// Извлекаем ответы
				const answers = []
				for (let j = 0; j < answerCount; j++) {
					const isCorrectStr = lines[questionIndex + j * 2]
					const answerText = lines[questionIndex + j * 2 + 1]
					answers.push({
						isCorrect: isCorrectStr === '1',
						text: answerText,
					})
				}

				// Формируем текст вопроса (номера, если текста нет)
				const questionText = `Вопрос ${i + 1}`

				questions.push({
					text: questionText,
					type: questionType,
					answers,
					image: imageURL,
				})

				// Обновляем индекс: уже считаны 2 строки для картинок, 1 строка для типа, 1 для количества,
				// и затем answerCount * 2 строк для ответов.
				questionIndex += answerCount * 2
			}

			console.log('Загруженные вопросы:', questions)
			callback(questions)
		}

		reader.readAsArrayBuffer(testFile)
	})
}

// Новый метод для загрузки теста через HTTP
export function loadTest(callback) {
	// Получаем имя теста из параметра test в URL
	const params = new URLSearchParams(window.location.search)
	const testFolder = params.get('test')
	if (!testFolder) {
		console.error('Не удалось определить папку теста из параметра test')
		return
	}

	// Формируем имя файла: имя папки + .tst
	let testFileName = `${testFolder}.tst`
	let testFilePath = `/test/${testFolder}/${testFileName}`

	// Если файл .tst не найден, пробуем .txt
	fetch(testFilePath)
		.then(response => {
			if (!response.ok) {
				// Пробуем загрузить .txt файл
				testFileName = `${testFolder}.txt`
				testFilePath = `/test/${testFolder}/${testFileName}`
				return fetch(testFilePath)
			}
			return response
		})
		.then(response => {
			if (!response.ok) {
				throw new Error('Ошибка загрузки тестового файла')
			}
			return response.arrayBuffer()
		})
		.then(buffer => {
			const decoder = new TextDecoder('windows-1251')
			const fileContent = decoder.decode(buffer)
			const lines = fileContent.split(/\r?\n/).map(line => line.trim())
			window.lastTestLines = lines

			// Обработка содержимого файла
			let questionCountStr = lines[12]
			questionCountStr = questionCountStr.replace(/[^\d]/g, '')
			const questionCount = parseInt(questionCountStr, 10)
			if (isNaN(questionCount) || questionCount <= 0) {
				console.error('Некорректное количество вопросов:', questionCountStr)
				return
			}

			const questions = []
			let questionIndex = 15
			for (let i = 0; i < questionCount; i++) {
				console.log(
					`Обрабатываем вопрос ${i + 1}, текущий индекс: ${questionIndex}`
				)
				// Считываем два поля для изображения:
				let flag = lines[questionIndex++]
				let potentialImage = lines[questionIndex++]
				let hasImage = false
				let imageName = null
				let imageURL = null // <-- объявляем imageURL сразу

				if (
					potentialImage !== '0' &&
					/\.(bmp|png|jpg|jpeg)$/i.test(potentialImage)
				) {
					hasImage = true
					imageName = potentialImage
				} else {
					hasImage = false
				}

				// Для fileUpload (локальная загрузка)
				if (typeof imageFilesMap !== 'undefined') {
					if (hasImage && imageName) {
						const imageFile = imageFilesMap[imageName]
						if (imageFile) {
							imageURL = URL.createObjectURL(imageFile)
						}
					}
				}
				// Для loadTest (HTTP загрузка)
				if (typeof testFolder !== 'undefined') {
					if (hasImage && imageName) {
						imageURL = `/tests/${testFolder}/${imageName}`
					}
				}

				if (questionIndex >= lines.length) {
					console.error(`Недостаточно данных для типа вопроса ${i + 1}`)
					break
				}
				const questionType = parseInt(lines[questionIndex], 10)
				questionIndex++

				if (questionType === 3) {
					const chainLength = parseInt(lines[questionIndex], 10)
					questionIndex++
					const leftItems = []
					for (let j = 0; j < chainLength; j++) {
						leftItems.push(lines[questionIndex++])
					}
					const rightItems = []
					for (let j = 0; j < chainLength; j++) {
						rightItems.push(lines[questionIndex++])
					}
					questions.push({
						text: `Вопрос ${i + 1}`,
						type: questionType,
						left: leftItems, // буквы (а, б, в...)
						right: rightItems, // цифры (1, 2, 3...) — правильный порядок
						image: imageURL,
					})
					continue // переход к следующему вопросу
				}

				if (questionType === 2) {
					// на последовательность
					const chainLength = parseInt(lines[questionIndex], 10)
					questionIndex++
					const sequenceAnswers = []
					for (let j = 0; j < chainLength; j++) {
						sequenceAnswers.push(lines[questionIndex++])
					}
					questions.push({
						text: `Вопрос ${i + 1}`,
						type: questionType,
						sequence: sequenceAnswers,
						image: imageURL,
					})
					continue
				}

				if (questionIndex >= lines.length) {
					console.error(
						`Недостаточно данных для количества ответов вопроса ${i + 1}`
					)
					break
				}
				const answerCount = parseInt(lines[questionIndex], 10)
				questionIndex++

				if (isNaN(questionType) || isNaN(answerCount)) {
					console.error(
						`Некорректные данные для вопроса ${
							i + 1
						}: тип или количество ответов не число.`
					)
					break
				}

				if (questionIndex + answerCount * 2 > lines.length) {
					console.error(`Недостаточно данных для ответов вопроса ${i + 1}`)
					break
				}

				const answers = []
				for (let j = 0; j < answerCount; j++) {
					const isCorrectStr = lines[questionIndex + j * 2]
					const answerText = lines[questionIndex + j * 2 + 1]
					answers.push({
						isCorrect: isCorrectStr === '1',
						text: answerText,
					})
				}

				const questionText = `Вопрос ${i + 1}`

				questions.push({
					text: questionText,
					type: questionType,
					answers,
					image: imageURL,
				})

				questionIndex += answerCount * 2
			}
			console.log('Загруженные вопросы:', questions)
			callback(questions)
		})
		.catch(err => {
			console.error('Ошибка загрузки теста:', err)
		})
}
