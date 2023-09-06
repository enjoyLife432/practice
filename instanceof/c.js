// let arr = [2, 4, 5, 7, 8, 10, 12, 111, 132, 333, 999, 55, 77];

// let maxNum = Math.max(...arr);
// console.log(maxNum);

let arr = [2, 4, 5, 7, 8, 10, 12, 111, 132, 333, 999, 55, 77];

let max = Math.max.apply(null, arr);
console.log(max);

let arr1 = [1, 2, 3];
let arr2 = [4, 5, 6];

console.log(Array.prototype.push.apply(arr1, arr2));
console.log(arr1);
