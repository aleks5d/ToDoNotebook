class Cookie {
	parse(raw) {
		let arr = raw.split('; ');
		this.cookies = {};
		for (let i = 0; i < arr.length; i++) {
			let [key, value] = arr[i].split('=');
			this.cookies[key] = value;
		}
	}

	constructor(document) {
		this.document = document
		this.parse(document.cookie);
	}

	setValue(key, value, params = "") {
		this.cookies[key] = value;
		this.document.cookie = key + "=" + value + ";" + params;
	}

	deleteValue(key) {
		this.setValue(key, "0", "max-age=-1");
	}
};

let cookieWorker = new Cookie(document);

async function destroyNote() {
	let id = this.parentNode.id.substr(5);
	let data = {'id': id.toString()};

	await fetch('/delNote', {
		method: 'POST', 
		headers: {'Content-Type': 'application/json;charset=utf-8'},
		body: JSON.stringify(data)})
		.then((res) => res.json())
		.then((res) => {
			if (!res || res.status == 'er') {
				alert('Что-то пошло не так! Пожалуйста, попробуйте позже.');
			} else if (res.status == 'wl') {
				cookieWorker.deleteValue('jwt');
				document.location.href = "/authotization.html";
			} else if (res.status == 'ok') {
				this.parentNode.remove();
			}
		});
}

function createEmptyNote() {
	let note = document.createElement('div');
	note.classList.add('note');
	let title = document.createElement('div');
	title.classList.add('title');
	let content = document.createElement('div');
	content.classList.add('content');
	let button = document.createElement('button');
	button.classList.add('destroy');
	button.innerText = "Удалить"
	button.onclick = destroyNote;

	note.appendChild(title);
	note.appendChild(content);
	note.appendChild(button);

	return note;
}

async function addNote(titleText, contentText, id) {
	let note = createEmptyNote();
	note.querySelector('.title').innerText = titleText;
	note.querySelector('.content').innerText = contentText;
	note.id = "Note-" + id;

	let template = document.querySelector('.templateNote');
	template.parentNode.replaceChild(note, template);
	note.parentNode.insertBefore(template, note);
}

async function addNewNote() {
	let template = document.querySelector('.templateNote');
	
	let titleText = template.querySelector('.title > input').value;
	let contentText = template.querySelector('.content > textarea').value;

	document.querySelector('.title').style.border = "1px solid " + (!titleText ? "red" : "lightgrey");
	document.querySelector('.content').style.border = "1px solid " + (!contentText ? "red" : "lightgrey");

	if (!titleText || !contentText) {
		return;
	}

	this.disabled = true;

	data = {title: titleText, content: contentText};

	await fetch('/newNote', {
		method: 'POST', 
		headers: {'Content-Type': 'application/json;charset=utf-8'},
		body: JSON.stringify(data)})
		.then((res) => res.json())
		.then((res) => {
			if (!res.status || res.status == 'er') {
				alert('Что-то пошло не так! Пожалуйста, попробуйте позже.');
			} else if (res.status == 'wl') {
				cookieWorker.deleteValue('jwt');
				document.location.href = "/authotization.html";	
			} else if (res.status == 'ne') {
				alert('Слишком много заметок!');
			} else if (res.status == 'ok') {
				template.querySelector('.title > input').value = "";
				template.querySelector('.content > textarea').value = "";
				addNote(titleText, contentText, res.id);
			}
			this.disabled = false;
		});
}

function clearNotes() {
	let arr = document.querySelectorAll('.note');
	for (let i = 1; i < arr.length; ++i) {
		arr[i].remove();
	}
}

async function uploadNotes() {
	await fetch('/notes', {
		method: 'POST',
		headers: {'Content-Type': 'application/json;charset=utf-8'},
		body: ""})
		.then((res) => res.json())
		.then((res) => {
			if (!res.status || res.status == 'er') {
				alert('Что-то пошло не так! Пожалуйста, попробуйте позже.');
			} else if (res.status == 'wl') {
				cookieWorker.deleteValue('jwt');
				document.location.href = "/authotization.html";	
			} else if (res.status == 'ok') {
				document.querySelector('.account i').innerText = res.login;
				for (let i = 0; i < res.data.length; ++i) {
					addNote(res.data[i].title, res.data[i].content, res.data[i].id);
				}
			}
		});
}

function dropContent() {
	let x = this.querySelector('.dropdown-content');
	if (!x) return;
	x.classList.toggle('show');
}

function logout() {
	cookieWorker.deleteValue('jwt');
	document.location.href = "./authorization.html"
}

function about() {
	document.querySelector('.about-box').classList.toggle('show');
	document.querySelector('.about-background').classList.toggle('show');
}

async function main() {
	let append = document.querySelector('.create');
	append.onclick = addNewNote;
	let refresh = document.querySelector('.refresh');
	refresh.onclick = () => {clearNotes(); uploadNotes();};

	uploadNotes();

	let arr = document.querySelectorAll('.btn-drop');
	for (let i = 0; i < arr.length; ++i) {
		arr[i].onclick = dropContent;
	}

	document.querySelector('.logout').onclick = logout;
	document.querySelector('.about').onclick = about;
	document.querySelector('.about-title i').onclick = about;

}

main();

window.onclick = function(event) {
	if (event.target.matches('.about-background')) {
		about();
	}
};