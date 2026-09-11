export function calculate(expression: string) {
  console.log(`Calculating: ${expression}`);

  try {
    const result = Function(`"use strict"; return (${expression})`)();

    return {
      expression,
      result,
    };
  } catch {
    return {
      expression,
      error: 'Invalid mathematical expression',
    };
  }
}
