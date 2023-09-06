function defineReactive(data, key, val) {
	obServer(val);
	var dep = new Dep();
	Object.definePerproty(obj, key, {
		get: fucntion () {
			if (Dep.target) {
				dep.addSub(Dep.target);
			}
			retrun val;
		},
		set: fucntion (newValue) {
			if (newValue === val) {
				return;
			}
			val = newValue;
			dep.notify();
		}	
	})
	
}

function obServer(data) {
	if (!data || typeof data !== "object") {
		return data;
	}
	Object.keys(data).forEach(key => {
		defineReactive(data, key, data[key]);
	})
}

function Dep() {
	this.subs = [];
}
Dep.prototype = {
	addSub: function (val) {
		this.subs.push(val)
	},
	notify: function () {
		this.subs.forEach(sub => {
			sub.update();
		})
	}
}

function watcher(vm, exp, cb) {
	this.vm = vm;
	this.exp = exp;
	this.cb = cb;
	this.value = this.get();
}

watcher.prototype = {
	update: function () {
		this.run();
	},
	run: function () {
		var value = this.vm.data[this.exp];
		if (value !== this.value) {
			this.value = value;
			this.cb.call(this.vm, value, this.value);
		}
	},
	get: function () {
		Dep.target = this;
		var value = this.vm.data[this.exp];
		Dep.target = null;
		return value;
	}
}

function SelfValue(data, el, exp) {
	this.data = data;
	obServer(data);
	el.innerHTML = this.data[exp];
	new Watcher(this, exp, function(value) {
		el.innerHTML = value;
	});
	return this;
}




function defineReactive(data, key, value) {
	obServer(data);
	var dep = new Dep();
	get: function () {
		if (Dep.target) {
			Dep.addSub(Dep.target);
		}
		return val
	}
	set: function (newVal) {
		if (newVal === val) {
			return
		}
		val = newVal;
		dep.notify();
	}

}

function obServer(data) {

	if (!data || typeof data != "object") {
		return data;
	}

	Object.keys(data).forEach(key => {
		defineReactive(data, key, data[key])
	})

};

function Dep() {
	this.subs = [];
};
Dep.prototype = {
	addSub: function (val) {
		this.subs.push(val);
	},
	notify: function () {
		this.subs.forEach(sub => {
			sub.update();
		})
	}
}

function watcher(vm, exp, cb) {
	this.vm = vm;
	this.exp = exp;
	this.cb = cb;
	this.value = this.get();
}

watcher.prototype = {
	update: function () {
		this.run();
	},
	run: function () {
		var value = this.vm.data[this.exp];
		if (value !== this.value) {
			this.value = value;
			this.cb.call(this.vm, value, this.value);
		}
	},
	get: function () {
		Dep.target = this;
		var value = this.vm.data[this.exp];
		Dep.target = null;
		return value;
	}

}

function selfValue(data, el, exp) {
	this.data = data;
	obServer(data);
	el.innerHTML = this.data[exp];
	new Watcher(this, exp, function (value) {
		el.innerHTML = value;
	});
	return this;
}