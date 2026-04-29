import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  Trash2, 
  Info, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Hash
} from 'lucide-react';
import { 
  SYMBOLS, 
  evaluate, 
  getVariables, 
  getSubExpressions, 
  VariableValues,
  OPERATORS
} from './logicParser';

export default function App() {
  const [expression, setExpression] = useState('p → (p ∨ q)');
  const [tableData, setTableData] = useState<{
    headers: string[];
    rows: (boolean | string)[][];
    classification: 'Tautologia' | 'Contradição' | 'Contingência' | null;
  }>({ headers: [], rows: [], classification: null });

  const variables = useMemo(() => getVariables(expression), [expression]);

  useEffect(() => {
    if (!expression.trim()) {
      setTableData({ headers: [], rows: [], classification: null });
      return;
    }

    try {
      const subExprs = getSubExpressions(expression);
      const vars = getVariables(expression);
      
      if (vars.length === 0 && expression.length > 0) {
        setTableData({ headers: [], rows: [], classification: null });
        return;
      }

      const numRows = Math.pow(2, vars.length);
      const rows: (boolean | string)[][] = [];
      const results: boolean[] = [];

      for (let i = 0; i < numRows; i++) {
        const rowAssignment: VariableValues = {};
        vars.forEach((v, vIdx) => {
           const bit = (i >> (vars.length - 1 - vIdx)) & 1;
           rowAssignment[v] = bit === 1; // 1 is V, 0 is F
        });

        const rowValues: (boolean | string)[] = [];
        subExprs.forEach(expr => {
          rowValues.push(evaluate(expr, rowAssignment));
        });
        
        rows.push(rowValues);
        const finalResult = evaluate(expression, rowAssignment);
        results.push(finalResult);
      }

      const allTrue = results.every(r => r === true);
      const allFalse = results.every(r => r === false);
      let classification: 'Tautologia' | 'Contradição' | 'Contingência' = 'Contingência';
      if (allTrue) classification = 'Tautologia';
      if (allFalse) classification = 'Contradição';

      setTableData({ headers: subExprs, rows, classification });
    } catch (e) {
      console.error(e);
      setTableData({ headers: [], rows: [], classification: null });
    }
  }, [expression]);

  const handleAddSymbol = (symbol: string) => {
    setExpression(prev => prev + symbol);
  };

  const clearExpression = () => {
    setExpression('');
  };

  const backspace = () => {
    setExpression(prev => prev.slice(0, -1));
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#FAFAFA] font-sans text-[#111827]">
      {/* Sidebar */}
      <aside className="w-full lg:w-[360px] bg-white border-b lg:border-b-0 lg:border-r border-[#E5E7EB] p-10 flex flex-col gap-10 overflow-y-auto">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-[#6B7280] font-bold mb-2">Resolutor Lógico</div>
          <h1 className="text-2xl font-black tracking-tight leading-none">LOGOS.v1</h1>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-widest text-[#6B7280] font-bold mb-4 flex items-center gap-2">
            <Hash size={14} /> FÓRMULA DE ENTRADA
          </div>
          <div className="relative group">
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="p → q"
              className="w-full font-mono text-lg p-4 border border-[#E5E7EB] rounded-md bg-[#FAFAFA] outline-none focus:border-[#2563EB] transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
              <button onClick={backspace} className="p-1.5 text-[#6B7280] hover:text-[#2563EB] transition-colors"><Trash2 size={18} /></button>
              <button onClick={clearExpression} className="p-1.5 text-[#6B7280] hover:text-red-500 font-bold transition-colors">C</button>
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-1.5 mt-4">
            {SYMBOLS.map((s) => (
              <button
                key={s.char}
                onClick={() => handleAddSymbol(s.char)}
                className={`
                  h-10 rounded text-sm font-bold transition-all border
                  ${s.type === 'var' ? 'bg-white text-[#111827] border-[#E5E7EB] hover:bg-[#FAFAFA]' : ''}
                  ${s.type === 'op' ? 'bg-[#FAFAFA] text-[#2563EB] border-transparent hover:border-[#2563EB]' : ''}
                  ${s.type === 'paren' ? 'bg-[#FAFAFA] text-orange-600 border-transparent hover:border-orange-600' : ''}
                `}
              >
                {s.char}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-lg border border-[#E5E7EB] bg-white">
          <div className="text-[11px] uppercase tracking-widest text-[#6B7280] font-bold mb-3">Classificação</div>
          {tableData.classification ? (
            <div>
              <div className="text-xl font-bold mb-2">{tableData.classification}</div>
              <div className={`
                inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider
                ${tableData.classification === 'Tautologia' ? 'bg-[#D1FAE5] text-[#065F46]' : ''}
                ${tableData.classification === 'Contradição' ? 'bg-[#FEE2E2] text-[#991B1B]' : ''}
                ${tableData.classification === 'Contingência' ? 'bg-[#FEF3C7] text-[#92400E]' : ''}
              `}>
                {tableData.classification === 'Tautologia' ? 'Sempre Válida' : 'Satisfatibilidade Mista'}
              </div>
            </div>
          ) : (
            <div className="text-sm text-[#6B7280] italic">Aguardando fórmula...</div>
          )}
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-widest text-[#6B7280] font-bold mb-4">Precedência de Operadores</div>
          <ul className="text-xs space-y-3 font-medium text-[#6B7280]">
            <li className="flex justify-between pb-2 border-b border-[#E5E7EB] border-dashed italic"><span>1. Negação</span><span className="font-mono font-bold text-[#111827]">{OPERATORS.NEG}</span></li>
            <li className="flex justify-between pb-2 border-b border-[#E5E7EB] border-dashed italic"><span>2. Conjunção</span><span className="font-mono font-bold text-[#111827]">{OPERATORS.AND}</span></li>
            <li className="flex justify-between pb-2 border-b border-[#E5E7EB] border-dashed italic"><span>3. Disjunção</span><span className="font-mono font-bold text-[#111827]">{OPERATORS.OR}</span></li>
            <li className="flex justify-between pb-2 border-b border-[#E5E7EB] border-dashed italic"><span>4. Condicional</span><span className="font-mono font-bold text-[#111827]">{OPERATORS.IMP}</span></li>
            <li className="flex justify-between pb-2 border-b border-[#E5E7EB] border-dashed italic"><span>5. Bicondicional</span><span className="font-mono font-bold text-[#111827]">{OPERATORS.BI}</span></li>
          </ul>
        </div>
        
        <div className="mt-auto pt-10 text-[10px] text-[#6B7280] font-medium uppercase tracking-widest opacity-50 flex items-center justify-between">
          <span>IFG - Luziânia</span>
          <span>v1.0.0</span>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <AnimatePresence mode="wait">
          {tableData.headers.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-10"
            >
              <div>
                <div className="text-[11px] uppercase tracking-widest text-[#6B7280] font-bold mb-4">Formatação Acadêmica</div>
                <div className="bg-white border border-[#E5E7EB] border-dashed rounded-lg p-10 text-center font-serif italic text-3xl text-[#111827] shadow-sm">
                  {expression.replace(/\s/g, '').split('').map((char, i) => (
                    <span key={i} className="mx-1">{char}</span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-widest text-[#6B7280] font-bold mb-4 flex justify-between items-center">
                  <span>Análise de Tabela da Verdade</span>
                  <span className="normal-case opacity-50 font-normal">Colunas por complexidade</span>
                </div>
                <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                          {tableData.headers.map((h, i) => (
                            <th key={i} className="px-6 py-4 font-mono text-[13px] text-[#6B7280] font-medium border-r border-[#E5E7EB] last:border-r-0 whitespace-nowrap uppercase">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-[#FAFAFA] transition-colors group">
                            {row.map((val, cIdx) => (
                              <td 
                                key={cIdx} 
                                className={`px-6 py-4 font-mono text-sm border-b border-[#E5E7EB] border-r border-[#E5E7EB] last:border-r-0 transition-colors
                                  ${val === true ? 'text-[#059669] font-bold' : val === false ? 'text-[#DC2626] font-bold' : ''}
                                `}
                              >
                                {val === true ? 'V' : val === false ? 'F' : val}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 rounded-lg border border-[#E5E7EB] bg-white shadow-sm flex flex-col gap-4">
                  <div className="text-[11px] uppercase tracking-widest text-[#6B7280] font-bold">Validade Lógica</div>
                  <div className="text-sm leading-relaxed text-[#6B7280]">
                    {tableData.classification === 'Tautologia' 
                      ? 'A fórmula avalia-se como VERDADEIRA para todas as possíveis interpretações lógicas.' 
                      : tableData.classification === 'Contradição'
                      ? 'A fórmula avalia-se como FALSA para todas as possíveis interpretações lógicas.'
                      : 'A fórmula possui valores variáveis dependendo da atribuição das proposições simples.'}
                  </div>
                  <div className={`
                    mt-auto inline-block w-fit px-4 py-1.5 rounded text-[10px] font-black tracking-[0.2em] uppercase
                    ${tableData.classification === 'Tautologia' ? 'bg-[#DBEAFE] text-[#1E40AF]' : 'bg-[#FAFAFA] border border-[#E5E7EB] text-[#6B7280]'}
                  `}>
                    {tableData.classification === 'Tautologia' ? 'VÁLIDA (VALID)' : 'NÃO-VÁLIDA'}
                  </div>
                </div>

                <div className="p-8 rounded-lg border border-[#E5E7EB] bg-white shadow-sm flex flex-col gap-4">
                  <div className="text-[11px] uppercase tracking-widest text-[#6B7280] font-bold">Forma Resultante</div>
                  <div className="text-sm leading-relaxed text-[#6B7280]">
                    Esta expressão é classificada como uma <strong>{tableData.classification}</strong> na lógica clássica proposicional.
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-[#6B7280]">
                    <Info size={14} />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Identidade analítica</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-40">
              <Calculator size={80} strokeWidth={1} />
              <p className="mt-6 text-xl font-light uppercase tracking-[0.2em]">Insira uma Proposição</p>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
