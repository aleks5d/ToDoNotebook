let id = 0;
let count = 0;

function destroyNote() {
	// db request
	this.parentNode.remove();
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

function addNote(titleText, contentText, id) {
	let note = createEmptyNote();
	note.querySelector('.title').innerText = titleText;
	note.querySelector('.content').innerText = contentText;
	note.id = "Note-" + id;

	let template = document.querySelector('.templateNote');
	template.parentNode.replaceChild(note, template);
	note.parentNode.insertBefore(template, note);
}

function addNewNote() {
	let template = document.querySelector('.templateNote');
	
	let titleText = template.querySelector('.title > input').value;
	let contentText = template.querySelector('.content > textarea').value;
	id++;

	// db request 
	// if it's ok

	template.querySelector('.title > input').value = "";
	template.querySelector('.content > textarea').value = "";

	addNote(titleText, contentText, id);
	
	// else 
	// alert('Error!');

}

function main() {
	let append = document.querySelector('.create');
	append.onclick = addNewNote;
	let destroy = document.querySelector('.destroy');
	destroy.onclick = destroyNote;

	// db request for old notes
}

main();