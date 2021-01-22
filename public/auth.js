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
		console.log('hmmm');
		this.setValue(key, "0", "max-age=-1");
	}
}

const errorsText = {
	'er': 'Произошла непредвиденная ошибка! попробуйте позже',
	'wp': 'Неверный логин или пароль.',
	'ue': 'Пользователь с таким логином уже сущесвтует.'
};

let cookiesWorker;

function checkForm(form) {
	let login = form.querySelector('.login').value;
	let password = form.querySelector('.password').value;
	if (!login.match(`^[a-zA-Z0-9]{1,20}$`) || !password.match(`^[a-zA-Z0-9]{5,20}$`)) {
		form.style.borderColor = "red";
		return false;
	}
	return true;
}


function main() {
	cookiesWorker = new Cookie(document);
	console.log(cookiesWorker.cookies);
	if (cookiesWorker.cookies.authRes && cookiesWorker.cookies.authMethod && errorsText[cookiesWorker.cookies.authRes]) {
		if (cookiesWorker.cookies.authMethod == 'in') {
			document.querySelector('.signin .error').innerText = errorsText[cookiesWorker.cookies.authRes];
		} else if (cookiesWorker.cookies.authMethod == 'up') {
			document.querySelector('.signup .error').innerText = errorsText[cookiesWorker.cookies.authRes];
		}
		cookiesWorker.deleteValue("authRes");
		cookiesWorker.deleteValue("authMethod");
	}
	console.log('upload');
}

main();
