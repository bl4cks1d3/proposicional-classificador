/**
 * Propositional Logic Parser and Evaluator
 */

export type VariableValues = Record<string, boolean>;

export const OPERATORS = {
  NEG: '¬',
  AND: '∧',
  OR: '∨',
  IMP: '→',
  BI: '↔',
};

// Help symbols for input
export const SYMBOLS = [
  { char: 'p', type: 'var' },
  { char: 'q', type: 'var' },
  { char: 'r', type: 'var' },
  { char: 's', type: 'var' },
  { char: OPERATORS.NEG, type: 'op' },
  { char: OPERATORS.AND, type: 'op' },
  { char: OPERATORS.OR, type: 'op' },
  { char: OPERATORS.IMP, type: 'op' },
  { char: OPERATORS.BI, type: 'op' },
  { char: '(', type: 'paren' },
  { char: ')', type: 'paren' },
];

/**
 * Normalizes input to a consistent format
 */
export function normalizeExpression(expr: string): string {
  return expr
    .replace(/\s+/g, '')
    .replace(/~/g, OPERATORS.NEG)
    .replace(/&/g, OPERATORS.AND)
    .replace(/v/g, OPERATORS.OR)
    .replace(/->/g, OPERATORS.IMP)
    .replace(/<->/g, OPERATORS.BI);
}

/**
 * Extracts unique variables from the expression
 */
export function getVariables(expr: string): string[] {
  const vars = new Set<string>();
  const matches = expr.match(/[p-z]/g);
  if (matches) {
    matches.forEach(v => vars.add(v));
  }
  return Array.from(vars).sort();
}

/**
 * Simplistic recursive decent parser/evaluator
 * Note: For a "book style" table, we want to extract sub-expressions too.
 */
export function evaluate(expr: string, values: VariableValues): boolean {
  // Replace variables with their values
  let processed = expr;
  const vars = getVariables(expr);
  vars.forEach(v => {
    processed = processed.replace(new RegExp(v, 'g'), values[v] ? 'T' : 'F');
  });

  const evalExp = (exp: string): boolean => {
    // 1. Resolve Parentheses
    while (exp.includes('(')) {
      let openIdx = -1;
      let closeIdx = -1;
      let depth = 0;

      for (let i = 0; i < exp.length; i++) {
        if (exp[i] === '(') {
          if (depth === 0) openIdx = i;
          depth++;
        } else if (exp[i] === ')') {
          depth--;
          if (depth === 0) {
            closeIdx = i;
            break;
          }
        }
      }

      if (openIdx !== -1 && closeIdx !== -1) {
        const subExp = exp.substring(openIdx + 1, closeIdx);
        const result = evalExp(subExp);
        exp = exp.substring(0, openIdx) + (result ? 'T' : 'F') + exp.substring(closeIdx + 1);
      } else {
        break;
      }
    }

    // 2. Negation (¬) - Right to left
    while (exp.includes(OPERATORS.NEG)) {
      const idx = exp.lastIndexOf(OPERATORS.NEG);
      const right = exp[idx + 1];
      const val = right === 'T';
      exp = exp.substring(0, idx) + (!val ? 'T' : 'F') + exp.substring(idx + 2);
    }

    // 3. Conjunction (∧)
    while (exp.includes(OPERATORS.AND)) {
      const idx = exp.indexOf(OPERATORS.AND);
      const left = exp[idx - 1] === 'T';
      const right = exp[idx + 1] === 'T';
      exp = exp.substring(0, idx - 1) + (left && right ? 'T' : 'F') + exp.substring(idx + 2);
    }

    // 4. Disjunction (∨)
    while (exp.includes(OPERATORS.OR)) {
      const idx = exp.indexOf(OPERATORS.OR);
      const left = exp[idx - 1] === 'T';
      const right = exp[idx + 1] === 'T';
      exp = exp.substring(0, idx - 1) + (left || right ? 'T' : 'F') + exp.substring(idx + 2);
    }

    // 5. Implication (→)
    while (exp.includes(OPERATORS.IMP)) {
      const idx = exp.indexOf(OPERATORS.IMP);
      const left = exp[idx - 1] === 'T';
      const right = exp[idx + 1] === 'T';
      // P -> Q is !P || Q
      exp = exp.substring(0, idx - 1) + (!left || right ? 'T' : 'F') + exp.substring(idx + 2);
    }

    // 6. Biconditional (↔)
    while (exp.includes(OPERATORS.BI)) {
      const idx = exp.indexOf(OPERATORS.BI);
      const left = exp[idx - 1] === 'T';
      const right = exp[idx + 1] === 'T';
      exp = exp.substring(0, idx - 1) + (left === right ? 'T' : 'F') + exp.substring(idx + 2);
    }

    return exp === 'T';
  };

  try {
    return evalExp(normalizeExpression(processed));
  } catch (e) {
    console.error("Evaluation error", e);
    return false;
  }
}

/**
 * Extracts sub-expressions to build columns of truth table
 * e.g. "p -> (p v q)" -> ["p", "q", "(p v q)", "p -> (p v q)"]
 */
export function getSubExpressions(expr: string): string[] {
  const normalized = normalizeExpression(expr);
  const result: string[] = [];
  const vars = getVariables(normalized);
  
  // Add variables first
  vars.forEach(v => result.push(v));

  // Extract nested parts
  const extractParts = (text: string) => {
    let depth = 0;
    let start = -1;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '(') {
            if (depth === 0) start = i;
            depth++;
        } else if (text[i] === ')') {
            depth--;
            if (depth === 0 && start !== -1) {
                const part = text.substring(start, i + 1);
                if (!result.includes(part)) result.push(part);
                // Also recursively check inside
                extractParts(text.substring(start + 1, i));
            }
        }
    }
    
    // Check for negation sub-expressions if not caught
    // Simplified: handles ¬p, ¬(expr)
    const negMatches = text.match(/¬([a-z]|\([^)]+\))/g);
    if (negMatches) {
        negMatches.forEach(m => {
            if (!result.includes(m)) result.push(m);
        });
    }
  };

  extractParts(normalized);
  
  // Finally add the full expression if not already there
  if (!result.includes(normalized)) {
    result.push(normalized);
  }

  // Sort by complexity (approx length)
  return result.sort((a, b) => a.length - b.length || a.localeCompare(b));
}
