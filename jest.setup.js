// Jest setup file for additional configuration
// This file runs before all tests

// Mock console methods to reduce noise during tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  // Keep error for debugging
  error: originalConsole.error,
};

// تنظيف الموارد بعد كل اختبار
afterEach(async () => {
  // إعطاء وقت للعمليات غير المتزامنة للانتهاء
  await new Promise(resolve => setImmediate(resolve));
});

// تنظيف شامل بعد جميع الاختبارات
afterAll(async () => {
  // إعطاء وقت إضافي للتنظيف
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // تنظيف جميع handles المفتوحة
  if (global.gc) {
    global.gc();
  }
});
