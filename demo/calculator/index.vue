<template>
  <div class="calculator">
    <div class="display">{{ current || "0" }}</div>
    <div class="buttons">
      <button @click="clear">C</button>
      <button @click="square">x²</button>
      <button @click="sqrt">√</button>
      <button @click="divide">÷</button>

      <button @click="append('7')">7</button>
      <button @click="append('8')">8</button>
      <button @click="append('9')">9</button>
      <button @click="multiply">×</button>

      <button @click="append('4')">4</button>
      <button @click="append('5')">5</button>
      <button @click="append('6')">6</button>
      <button @click="subtract">-</button>

      <button @click="append('1')">1</button>
      <button @click="append('2')">2</button>
      <button @click="append('3')">3</button>
      <button @click="add">+</button>

      <button @click="append('0')" class="zero">0</button>
      <button @click="dot">.</button>
      <button @click="equal" class="equal">=</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      current: "",
      previous: null,
      operator: null,
      operatorClicked: false,
    };
  },
  methods: {
    clear() {
      this.current = "";
    },
    append(number) {
      if (this.operatorClicked) {
        this.current = "";
        this.operatorClicked = false;
      }
      this.current = `${this.current}${number}`;
    },
    dot() {
      if (this.current.indexOf(".") === -1) {
        this.append(".");
      }
    },
    setPrevious() {
      this.previous = this.current;
      this.operatorClicked = true;
    },
    add() {
      this.operator = (a, b) => a + b;
      this.setPrevious();
    },
    subtract() {
      this.operator = (a, b) => a - b;
      this.setPrevious();
    },
    multiply() {
      this.operator = (a, b) => a * b;
      this.setPrevious();
    },
    divide() {
      this.operator = (a, b) => a / b;
      this.setPrevious();
    },
    square() {
      this.current = `${parseFloat(this.current) ** 2}`;
    },
    sqrt() {
      this.current = `${Math.sqrt(parseFloat(this.current))}`;
    },
    equal() {
      this.current = `${this.operator(
        parseFloat(this.previous),
        parseFloat(this.current)
      )}`;
      this.previous = null;
    },
  },
};
</script>

<style>
.calculator {
  width: 400px;
  margin: 0 auto;
  font-size: 40px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: minmax(50px, auto);
}

.display {
  grid-column: 1 / 5;
  background: #333;
  color: white;
  padding: 10px;
  text-align: right;
}

.zero {
  grid-column: 1 / 3;
}

.equal {
  grid-column: 4;
  grid-row: 4 / 6;
}

button {
  background: #f2f2f2;
  border: 1px solid #999;
  cursor: pointer;
}

button:hover {
  background: #ddd;
}

button:active {
  background: #ccc;
}
</style>
