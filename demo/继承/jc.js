class Person {
  constructor(name, type) {
    this.name = name;
    this.type = type;
  }
  print() {
    console.log(this.name);
    console.log(this.type);
  }
}

class Boy extends Person {
  constructor(name, type) {
    super(name, type);
  }
  print() {
    super.print();
  }
}

const boy = new Boy("tom", "男孩");
boy.print();
