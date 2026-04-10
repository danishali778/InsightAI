import React from 'react';

export type TokenKind = 'keyword' | 'function' | 'string' | 'number' | 'comment' | 'table' | 'plain';

export const KEYWORD_PATTERNS = [
  'GROUP BY',
  'ORDER BY',
  'PARTITION BY',
  'LEFT JOIN',
  'RIGHT JOIN',
  'INNER JOIN',
  'OUTER JOIN',
  'FULL JOIN',
  'CROSS JOIN',
  'UNION ALL',
  'SELECT',
  'FROM',
  'WHERE',
  'JOIN',
  'ON',
  'AND',
  'OR',
  'AS',
  'DESC',
  'ASC',
  'LIMIT',
  'HAVING',
  'DISTINCT',
  'UNION',
  'IN',
  'NOT',
  'NULL',
  'IS',
  'LIKE',
  'BETWEEN',
  'EXISTS',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
  'WITH',
  'OVER',
  'INSERT',
  'UPDATE',
  'DELETE',
  'CREATE',
  'DROP',
  'ALTER',
  'SET',
  'VALUES',
  'INTO',
  'INTERVAL',
];

export const FUNCTION_PATTERNS = [
  'SUM',
  'COUNT',
  'AVG',
  'MAX',
  'MIN',
  'ROUND',
  'LAG',
  'LEAD',
  'ROW_NUMBER',
  'RANK',
  'DENSE_RANK',
  'COALESCE',
  'CAST',
  'EXTRACT',
  'DATE_TRUNC',
  'DATE',
  'NOW',
];

const TABLE_TRIGGERS = new Set(['FROM', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'FULL JOIN', 'CROSS JOIN']);

export function tokenizeSqlLine(line: string): Array<{ text: string; kind: TokenKind }> {
  if (!line) return [{ text: '', kind: 'plain' }];

  const tokens: Array<{ text: string; kind: TokenKind }> = [];
  let i = 0;

  const push = (text: string, kind: TokenKind) => {
    if (text) tokens.push({ text, kind });
  };

  while (i < line.length) {
    const rest = line.slice(i);

    if (rest.startsWith('--')) {
      push(rest, 'comment');
      break;
    }

    const stringMatch = rest.match(/^'([^']|'')*'/);
    if (stringMatch) {
      push(stringMatch[0], 'string');
      i += stringMatch[0].length;
      continue;
    }

    const numberMatch = rest.match(/^\b\d+(\.\d+)?\b/);
    if (numberMatch) {
      push(numberMatch[0], 'number');
      i += numberMatch[0].length;
      continue;
    }

    const keyword = KEYWORD_PATTERNS.find((pattern) => {
      const regex = new RegExp(`^${pattern.replace(/ /g, '\\s+')}\\b`, 'i');
      return regex.test(rest);
    });
    if (keyword) {
      const match = rest.match(new RegExp(`^${keyword.replace(/ /g, '\\s+')}`, 'i'));
      if (match) {
        push(match[0], 'keyword');
        i += match[0].length;
        continue;
      }
    }

    const func = FUNCTION_PATTERNS.find((pattern) => new RegExp(`^${pattern}\\b`, 'i').test(rest));
    if (func) {
      const match = rest.match(new RegExp(`^${func}`, 'i'));
      if (match) {
        push(match[0], 'function');
        i += match[0].length;
        continue;
      }
    }

    push(line[i], 'plain');
    i += 1;
  }

  // Post-process: mark plain tokens after FROM/JOIN as table names
  for (let t = 0; t < tokens.length; t++) {
    if (tokens[t].kind === 'keyword' && TABLE_TRIGGERS.has(tokens[t].text.toUpperCase().replace(/\s+/g, ' '))) {
      // Find next non-whitespace plain token
      for (let n = t + 1; n < tokens.length; n++) {
        const txt = tokens[n].text.trim();
        if (!txt) continue;
        if (tokens[n].kind === 'plain' && /^[a-zA-Z_`"]/.test(txt)) {
          tokens[n].kind = 'table';
        }
        break;
      }
    }
  }

  return tokens;
}

const CARD_COLORS: Record<TokenKind, React.CSSProperties> = {
  keyword: { color: '#0550ae', fontWeight: 700 }, // Deep Blue
  function: { color: '#8250df', fontWeight: 600 }, // Purple
  string: { color: '#1a7f37' },                   // Emerald Green
  number: { color: '#cf222e' },                   // Ruby Red
  table: { color: '#953800' },                    // Burnt Orange
  comment: { color: '#6e7781', fontStyle: 'italic' }, // Gray
  plain: { color: '#24292f' },                    // Slate
};

const PANEL_COLORS: Record<TokenKind, React.CSSProperties> = {
  keyword: { color: '#0550ae', fontWeight: 700 },
  function: { color: '#8250df', fontWeight: 600 },
  string: { color: '#1a7f37' },
  number: { color: '#cf222e' },
  table: { color: '#953800' },
  comment: { color: '#6e7781', fontStyle: 'italic' },
  plain: { color: '#24292f' },
};

export function highlightSqlInline(sql: string, scheme: 'card' | 'panel' = 'card'): React.ReactElement {
  const colors = scheme === 'card' ? CARD_COLORS : PANEL_COLORS;
  const lines = sql.replace(/\r\n/g, '\n').split('\n');

  return (
    <>
      {lines.map((line, li) => (
        <React.Fragment key={li}>
          {tokenizeSqlLine(line).map((token, ti) => (
            <span key={`${li}-${ti}`} style={colors[token.kind]}>{token.text}</span>
          ))}
          {li < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </>
  );
}

export function extractTablesFromSql(sql: string): string[] {
  const regex = /(?:FROM|JOIN)\s+([a-zA-Z_`"][a-zA-Z0-9_.`"]*)/gi;
  const tables: string[] = [];
  let match;
  while ((match = regex.exec(sql)) !== null) {
    const name = match[1].replace(/[`"]/g, '');
    if (!tables.includes(name)) tables.push(name);
  }
  return tables;
}
