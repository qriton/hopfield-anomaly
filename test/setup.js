// test/setup.js
// Suppress console.warn during tests

const originalWarn = console.warn;

beforeAll(() => { 
  console.warn = () => {};
});

afterAll(() => {
  console.warn = originalWarn;
});