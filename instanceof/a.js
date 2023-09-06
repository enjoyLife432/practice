function Animal(name) {
  this.name = name;
  this.showName = function () {
    alert(this.name);
  };
}

function Cat(name) {
  //   Animal.apply(this, [name]);
  Animal.call(this, name);
}

let cat = new Cat("咕咕");
cat.showName();
