export default function waitForElements(selectors, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const timeoutHandler = setTimeout(() => {
      reject(); // Resolve immediately if timeout is reached
    }, timeout);
    function test() {
      const foundAll = selectors.every((selector) =>
        document.querySelector(selector)
      );
      debugger;
      if (foundAll) {
        clearTimeout(timeoutHandler); // Clear the timeout if all elements are found
        // setTimeout(() => {
        resolve();
        // }, 5000);
      } else {
        setTimeout(test, 100); // Check again after 100ms
      }
    }
    test();
  });
}
