function Class10() {
  this.showSub = function (a, b) {
    alert(a - b);
  };
}

function Class11() {
  this.showAdd = function (a, b) {
    alert(a + b);
  };
}

function Class12() {
  Class10.apply(this);
  Class11.apply(this);
}

let c2 = new Class12();
c2.showSub(3, 1);
c2.showAdd(3, 1);
