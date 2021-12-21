/* eslint-disable no-console */
const success = Function.prototype.bind.call(
  console.log,
  console,
  `%c %s`,
  `color: Green`
);
const info = Function.prototype.bind.call(
  console.log,
  console,
  `%c %s`,
  `color: DodgerBlue`
);
const warning = Function.prototype.bind.call(
  console.log,
  console,
  `%c %s`,
  `color: Orange`
);
const error = Function.prototype.bind.call(
  console.log,
  console,
  `%c %s`,
  `color: Red`
);
const debug = Function.prototype.bind.call(
  console.log,
  console,
  `%c %s`,
  `color: #257559`
);

// Aliases
const cancel = error;
const ok = success;

const colorLog = (msg, color) => {
  switch (color) {
    case "success":
      return success(msg);
    case "info":
      return info(msg);
    case "error":
      return error(msg);
    case "debug":
      return debug(msg);
    case "warning":
      return warning(msg);
    default:
      return info(msg);
  }
};

export { success, info, warning, error, debug, cancel, ok };

export default colorLog;
