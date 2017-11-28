module.exports = delay => new Promise((onFullfilled, onRejected) => {
  setTimeout(() => {
    onFullfilled()
  }, delay);
})