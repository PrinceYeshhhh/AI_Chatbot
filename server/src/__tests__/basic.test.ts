describe('Basic Tests', () => {
  test('should pass basic math test', () => {
    expect(2 + 2).toBe(4);
  });

  test('should handle strings', () => {
    expect('hello').toBe('hello');
  });

  test('should work with arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });
}); 