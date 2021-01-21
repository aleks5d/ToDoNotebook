class Cookie {
	parse(raw) {
		let arr = raw.split(';');
		this.cookies = {};
		this.names = []
		for (let i = 0; i < arr.length; i++) {
			let [key, value] = arr[i].split('=');
			this.cookies[key] = value;
			this.names.push(key);
		}
	}

	set() {
		let cookie = ""
		for (let i of this.names) {
			cookie += this.cookies[i].key + '=' + this.cookies[i].value + ';'
		}
		this.document.cookie = cookie;
	}

	constructor(document) {
		this.document = document
		this.parse(document.cookie);
	}

	setValue(key, value) {
		if (!this.cookies[key]) {
			this.names.push(key);
		}
		this[key] = value;
	}

	clearValue(key) {
		for (let i = 0; i < this.names.length; ++i) {
			if (this.names[i] == key) {
				this.names[i] = this.names[this.names.length - 1];
				this.names.pop();
				break;
			}
		}
		if (this.cookies[key]) {
			delete(this.cookies.key);
		}
	}



	clear() {
		for (let i = 0; i < this.names.length; ++i) {
			delete(this.cookies[this.names[i]]);
		}
		while (this.names.length > 0) {
			this.names.pop();
		}
	}
}

let cookiesWorker = new Cookie(document);

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
	
	console.log('upload');
}

main();
