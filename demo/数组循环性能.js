


// let arr = [];

// arr[1] = 1;
// arr[10000] = 10000;


// function a() {
// 	console.time();
// 	for( var i = 0; i < arr.length; i++) console.log(1);
// 	console.timeEnd();
// }

// a();
// a();

// function b() {
// 	console.time();
// 	arr.forEach(item => console.log(2));
// 	console.timeEnd();
// }

// b();
// b();


var proxy = new Proxy({}, {
	get: function (target, property) {
		return 35;
	}
})

let obj = Object.create(proxy);
console.log(obj.time)