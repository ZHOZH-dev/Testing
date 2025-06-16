const express = require('express')
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const app = express()
const PORT = 3000

// Универсальная настройка путей:
// Если переменная REMOTE_TESTS_URL задана, используется удалённый сервер для тестов,
// иначе используется локальная папка с тестами. Папка по умолчанию: "tests"
require('dotenv').config()
const REMOTE_TESTS_URL = process.env.REMOTE_TESTS_URL || null
const BASE_TESTS_FOLDER = process.env.BASE_TESTS_FOLDER || 'tests'

// Обслуживаем статические файлы из папки public
app.use('/public', express.static(path.join(__dirname, 'public')))
app.use('/tests', express.static(path.join(__dirname, BASE_TESTS_FOLDER)))

// Главная страница
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'index.html'))
})

// Страница теста
app.get('/test.html', (req, res) => {
	res.sendFile(path.join(__dirname, 'test.html'))
})

if (REMOTE_TESTS_URL) {
	// Работа с удалённым сервером
	app.get('/tests', async (req, res) => {
		try {
			const response = await axios.get(`${REMOTE_TESTS_URL}/list`)
			res.json(response.data)
		} catch (err) {
			console.error('Ошибка получения списка тестов с удалённого сервера:', err)
			res.status(500).send('Ошибка получения списка тестов')
		}
	})

	app.get('/test/:folder/:file', async (req, res) => {
		const { folder, file } = req.params
		try {
			const response = await axios.get(`${REMOTE_TESTS_URL}/${folder}/${file}`)
			res.send(response.data)
		} catch (err) {
			console.error('Ошибка получения файла теста с удалённого сервера:', err)
			res.status(500).send('Ошибка получения файла теста')
		}
	})
} else {
	// Работа с локальными файлами
	app.get('/tests', (req, res) => {
		const testsDir = path.join(__dirname, BASE_TESTS_FOLDER)
		fs.readdir(testsDir, { withFileTypes: true }, (err, files) => {
			if (err) {
				res.status(500).send('Ошибка чтения папки с тестами')
				return
			}
			// Получаем все имена папок внутри tests
			const testFolders = files
				.filter(dirent => dirent.isDirectory())
				.map(dirent => dirent.name)
			res.json(testFolders)
		})
	})

	app.get('/test/:folder/:file', (req, res) => {
		const { folder, file } = req.params
		const filePath = path.join(__dirname, BASE_TESTS_FOLDER, folder, file)
		if (!fs.existsSync(filePath)) {
			res.status(404).send('Файл теста не найден')
			return
		}
		res.sendFile(filePath)
	})
}

app.listen(PORT, () => {
	console.log(`Server is running at http://localhost:${PORT}`)
})
