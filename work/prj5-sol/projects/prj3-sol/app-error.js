class AppError {

  constructor(code, msg, widget) {
    this.code = code; this.msg = msg; this.widget = widget;
  }

  toString() { return `${this.code}: ${this.msg}`; }
}

module.exports = AppError;
