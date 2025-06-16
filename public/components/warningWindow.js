let endBtn = document.querySelector('.end-button')
let warningEndWindow = document.querySelector('.warning-end-window-box')
let cancelBtn = document.querySelector('.cancel-btn')
let questionSection = document.querySelector('.question-section')
let infoSection = document.querySelector('.info')
let navBar = document.querySelector('.nav-bar')

function openPopUp() {
	endBtn.addEventListener('click', () => {
		warningEndWindow.style.display = 'flex'
		questionSection.style.pointerEvents = 'none'
		infoSection.style.pointerEvents = 'none'
		navBar.style.pointerEvents = 'none'
		questionSection.style.opacity = '0.3'
		infoSection.style.opacity = '0.3'
		navBar.style.opacity = '0.3'
	})
}

function closePopUp() {
	cancelBtn.addEventListener('click', () => {
		warningEndWindow.style.display = 'none'
		questionSection.style.pointerEvents = 'auto'
		infoSection.style.pointerEvents = 'auto'
		navBar.style.pointerEvents = 'auto'
		questionSection.style.opacity = '1'
		infoSection.style.opacity = '1'
		navBar.style.opacity = '1'
	})
}

export { openPopUp, closePopUp }
