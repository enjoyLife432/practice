let arr = [{ a: 1, b: 2 }];

let arr1 = arr.map((item, index) => item.arr[index].join());
console.log(arr1);
