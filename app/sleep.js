module.exports = delay => {
  return new Promise((onFullfilled, onRejected) => {
    setTimeout(() => {
      onFullfilled();
    }, delay);
  })
}