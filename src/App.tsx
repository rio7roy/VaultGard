import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  Terminal, 
  History, 
  Trash2, 
  AlertCircle,
  Loader2,
  Sparkles,
  Info,
  Wallet,
  Lock,
  TrendingDown,
  PieChart as PieIcon,
  ShieldAlert,
  ChevronRight,
  Plus,
  Settings,
  BarChart3
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { parseTransaction, TransactionData } from "./services/geminiService";
import ExtractionDisplay from "./components/ExtractionDisplay";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as ChartTooltip,
  Legend
} from 'recharts';

const COLORS = ['#141414', '#4b5563', '#9ca3af', '#d1d5db', '#1f2937', '#374151', '#4b5563', '#6b7280'];

interface ExtractionRecord {
  id: string;
  data: TransactionData;
  rawJson: string;
  timestamp: number;
  input: string;
}

export default function App() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRecord, setCurrentRecord] = useState<ExtractionRecord | null>(null);
  const [history, setHistory] = useState<ExtractionRecord[]>(() => {
    const saved = localStorage.getItem('spend_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Virtual Partitioning State
  const [totalBalance, setTotalBalance] = useState<number>(() => {
    const saved = localStorage.getItem('total_balance');
    return saved ? parseFloat(saved) : 50000;
  });
  const [lockedSavings, setLockedSavings] = useState<number>(() => {
    const saved = localStorage.getItem('locked_savings');
    return saved ? parseFloat(saved) : 20000;
  });
  const [showAlert, setShowAlert] = useState<{ amount: number; merchant: string } | null>(null);
  const [pendingRecord, setPendingRecord] = useState<ExtractionRecord | null>(null);

  useEffect(() => {
    localStorage.setItem('spend_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('total_balance', totalBalance.toString());
  }, [totalBalance]);

  useEffect(() => {
    localStorage.setItem('locked_savings', lockedSavings.toString());
  }, [lockedSavings]);

  const spendableBalance = Number(totalBalance) - Number(lockedSavings);
  const isCrisis = spendableBalance < 0;

  const commitTransaction = (record: ExtractionRecord) => {
    if (record.data.is_debit) {
      setTotalBalance(prev => Number(prev) - Number(record.data.amount));
    } else {
      setTotalBalance(prev => Number(prev) + Number(record.data.amount));
    }

    setHistory(prev => [record, ...prev].slice(0, 50));
    setCurrentRecord(record);
    setPendingRecord(null);
    setShowAlert(null);
    setInput("");
  };

  const handleParse = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await parseTransaction(input);
      
      const record: ExtractionRecord = {
        id: Date.now().toString(),
        data,
        rawJson: JSON.stringify(data, null, 2),
        timestamp: Date.now(),
        input: input.trim()
      };

      // 1. Strict Balance Check
      if (data.is_debit && data.amount > Number(totalBalance)) {
        throw new Error("INSUFFICIENT FUNDS: Transaction amount exceeds your actual total balance.");
      }

      // 2. Virtual Partitioning Trigger
      if (data.is_debit && data.amount > spendableBalance) {
        setPendingRecord(record);
        setShowAlert({ amount: data.amount, merchant: data.merchant });
      } else {
        commitTransaction(record);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    setCurrentRecord(null);
  };

  // Stats Logic
  const monthlySpend = history
    .filter(r => r.data.is_debit)
    .reduce((acc, curr) => acc + curr.data.amount, 0);

  const chartData = useMemo(() => {
    const categories = history
      .filter(r => r.data.is_debit)
      .reduce((acc, curr) => {
        acc[curr.data.category] = (acc[curr.data.category] || 0) + curr.data.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => Number(b.value) - Number(a.value));
  }, [history]);

  const categoryTotals = history
    .filter(r => r.data.is_debit)
    .reduce((acc, curr) => {
      acc[curr.data.category] = (acc[curr.data.category] || 0) + curr.data.amount;
      return acc;
    }, {} as Record<string, number>);

  const highestCategory = Object.entries(categoryTotals).sort((a,b) => Number(b[1]) - Number(a[1]))[0]?.[0] || "None";
  const savingsProgress = (Number(lockedSavings) / (Math.max(Number(totalBalance), Number(lockedSavings) + Number(spendableBalance)) || 1)) * 100;

  return (
    <div 
      className="min-h-screen bg-[#E4E3E0] text-[#141414] selection:bg-[#141414] selection:text-[#E4E3E0] relative"
    >
      {/* Crisis mode top gradient overlay */}
      <AnimatePresence>
        {isCrisis && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 top-0 h-[600px] pointer-events-none z-0 bg-gradient-to-b from-red-500/20 to-transparent"
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 font-sans">
        {/* Homescreen Widget Header */}
        <motion.section 
          animate={{ 
            backgroundColor: isCrisis ? "#7f1d1d" : "#141414",
            borderColor: isCrisis ? "#991b1b" : "#141414"
          }}
          className="text-[#E4E3E0] py-8 px-6 border-b transition-colors duration-700"
        >
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className={`flex items-center gap-2 opacity-60 font-mono text-[10px] uppercase tracking-widest ${isCrisis ? 'text-red-100' : ''}`}>
                <Wallet size={14} /> Spendable Balance
              </div>
              <div>
                <div className={`text-4xl font-mono tracking-tighter ${isCrisis ? 'text-white' : ''}`}>
                  ₹{spendableBalance.toLocaleString('en-IN')}
                </div>
                <div className={`text-[10px] opacity-40 font-mono italic mt-1.5 uppercase tracking-wider ${isCrisis ? 'text-red-100' : ''}`}>
                  Actual Balance: ₹{Number(totalBalance).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          <div className="space-y-4 border-l border-white/10 pl-8">
            <div className="flex items-center gap-2 opacity-60 font-mono text-[10px] uppercase tracking-widest">
              <PieIcon size={14} /> Top Burner
            </div>
            <div className="text-2xl font-medium italic tracking-tight">{highestCategory}</div>
          </div>
          <div className="space-y-4 border-l border-white/10 pl-8">
            <div className="flex items-center justify-between opacity-60 font-mono text-[10px] uppercase tracking-widest">
              <span className="flex items-center gap-2"><Lock size={14} /> Savings Progress</span>
              <span>{Math.min(100, Math.round(savingsProgress))}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, savingsProgress)}%` }}
                className="h-full bg-emerald-400"
              />
            </div>
          </div>
        </div>
      </motion.section>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-start">
          
          {/* Main Workspace */}
          <div className="space-y-12">
            {/* Input Console */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 opacity-50">
                  <Terminal size={14} />
                  <span className="text-[11px] uppercase tracking-widest font-mono">Neural Parser Console</span>
                </div>
                <button 
                  onClick={() => setInput("")}
                  className="text-[10px] uppercase font-mono tracking-widest hover:underline opacity-50"
                >
                  Reset
                </button>
              </div>
              
              <div className="relative group">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Paste notification text here..."
                  className="w-full h-40 bg-white border border-[#141414] p-6 rounded-3xl font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[#141414] transition-all resize-none shadow-sm"
                />
                <button 
                  onClick={handleParse}
                  disabled={loading || !input.trim()}
                  className="absolute bottom-4 right-4 bg-[#141414] text-[#E4E3E0] px-6 py-4 rounded-2xl font-mono text-xs uppercase tracking-widest flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {loading ? 'Processing' : 'Extract Data'}
                </button>
              </div>

              {/* Real-time Buffer Progress Indicator */}
              <div className="bg-white/40 border border-[#141414]/10 p-4 rounded-2xl flex items-center gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-[9px] font-mono uppercase tracking-widest opacity-50">
                    <span>Buffer Capacity</span>
                    <span>₹{spendableBalance.toLocaleString()} remaining</span>
                  </div>
                  <div className="h-1 bg-[#141414]/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${Math.max(0, Math.min(100, (spendableBalance / (totalBalance || 1)) * 100))}%`,
                        backgroundColor: spendableBalance < (totalBalance * 0.1) ? "#ef4444" : "#10b981"
                      }}
                      className="h-full"
                    />
                  </div>
                </div>
                {spendableBalance < (totalBalance * 0.1) && (
                  <motion.div 
                    animate={{ opacity: [1, 0.4, 1] }} 
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="text-red-500"
                  >
                    <ShieldAlert size={16} />
                  </motion.div>
                )}
              </div>

              {/* Spending Insights Section */}
              <div className="bg-white border border-[#141414] rounded-[2.5rem] p-8 shadow-sm space-y-8 overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 opacity-50 font-mono text-[10px] uppercase tracking-widest">
                      <BarChart3 size={14} /> Analytics
                    </div>
                    <h3 className="text-xl font-bold tracking-tighter">SPENDING INSIGHTS</h3>
                  </div>
                  <div className="bg-[#141414] text-[#E4E3E0] px-4 py-2 rounded-xl text-[10px] font-mono uppercase tracking-widest">
                    Month-to-Date
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 items-center">
                  {/* Pie Chart */}
                  <div className="h-[200px] relative">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            animationDuration={1000}
                          >
                            {chartData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip 
                            contentStyle={{ 
                              backgroundColor: '#141414', 
                              border: 'none', 
                              borderRadius: '8px', 
                              color: '#E4E3E0',
                              fontSize: '10px',
                              fontFamily: 'monospace'
                            }}
                            itemStyle={{ color: '#E4E3E0' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full border-2 border-dashed border-[#141414]/10 rounded-full flex items-center justify-center opacity-20">
                        <PieIcon size={48} strokeWidth={1} />
                      </div>
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[8px] font-mono opacity-50 uppercase tracking-widest">Total</span>
                      <span className="text-lg font-mono font-bold tracking-tighter">₹{Math.round(monthlySpend).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Stats & Legend */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#E4E3E0]/30 p-4 rounded-2xl border border-dotted border-[#141414]/20">
                        <span className="text-[9px] uppercase tracking-widest font-mono opacity-50 block mb-1">Top Drain</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold truncate italic">{highestCategory}</span>
                        </div>
                      </div>
                      <div className="bg-[#141414] text-[#E4E3E0] p-4 rounded-2xl">
                        <span className="text-[9px] uppercase tracking-widest font-mono opacity-40 block mb-1">Local Savings</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-bold tracking-tight">₹{lockedSavings.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[9px] font-mono opacity-50 uppercase tracking-widest mb-3">
                        <span>Allocation by Category</span>
                        <span>{chartData.length} active</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                        {chartData.slice(0, 4).map((entry, index) => (
                          <div key={entry.name} className="flex items-center justify-between text-[10px] group cursor-help">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              <span className="opacity-70 group-hover:opacity-100 transition-opacity truncate max-w-[80px]">{entry.name}</span>
                            </div>
                            <span className="font-mono font-medium">₹{entry.value.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-xs font-mono"
                >
                  <AlertCircle size={14} />
                  {error}
                </motion.div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {currentRecord && (
                <ExtractionDisplay 
                  key={currentRecord.id}
                  data={currentRecord.data}
                  rawJson={currentRecord.rawJson}
                />
              )}
              {!currentRecord && <EmptyState />}
            </AnimatePresence>
          </div>

          {/* Sidebar - Settings & Storage */}
          <aside className="space-y-8">
            {/* Virtual Partition Settings */}
            <div className="bg-white p-8 rounded-[2rem] border border-[#141414] shadow-sm space-y-8">
              <div className="flex items-center gap-2 border-b border-[#141414] pb-4">
                <Settings size={16} />
                <h3 className="text-[11px] uppercase font-mono font-bold tracking-[0.2em]">Partition Config</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase font-mono opacity-50 block mb-3">Core Balance</label>
                  <div className="flex items-center gap-3 bg-[#E4E3E0]/30 p-4 rounded-xl">
                    <span className="text-sm font-mono opacity-50">₹</span>
                    <input 
                      type="number" 
                      value={totalBalance}
                      onChange={(e) => setTotalBalance(parseFloat(e.target.value) || 0)}
                      className="bg-transparent w-full font-mono text-2xl focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono opacity-50 block mb-3">Locked Savings Buffer</label>
                  <div className="flex items-center gap-3 bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <span className="text-sm font-mono opacity-50 text-orange-600">₹</span>
                    <input 
                      type="number" 
                      value={lockedSavings}
                      onChange={(e) => setLockedSavings(parseFloat(e.target.value) || 0)}
                      className="bg-transparent w-full font-mono text-2xl text-orange-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="text-[10px] font-mono leading-relaxed opacity-50 italic">
                * Spendable logic: Your safe spending limit is capped at ₹{(Number(totalBalance) - Number(lockedSavings)).toLocaleString()}.
              </div>
            </div>

            {/* History Feed */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#141414] pb-4">
                <div className="flex items-center gap-2 uppercase tracking-widest font-mono text-[11px]">
                  <History size={14} /> Ledger
                </div>
                {history.length > 0 && (
                  <button onClick={clearHistory} className="text-red-500 hover:scale-110 p-1 transition-transform">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence initial={false}>
                  {history.map((record) => (
                    <motion.button
                      key={record.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      onClick={() => setCurrentRecord(record)}
                      className={`w-full text-left p-4 rounded-2xl border border-[#141414] transition-all ${currentRecord?.id === record.id ? 'bg-[#141414] text-[#E4E3E0]' : 'bg-white hover:bg-white/80 shadow-sm'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-mono opacity-50">
                          {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${record.data.is_debit ? 'bg-orange-400' : 'bg-emerald-400'}`} />
                      </div>
                      <div className="font-bold tracking-tight truncate leading-tight">
                        {record.data.merchant}
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[9px] font-mono opacity-50 uppercase tracking-widest">{record.data.category}</span>
                        <span className="font-mono text-[10px] font-bold">₹{record.data.amount}</span>
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
                {history.length === 0 && (
                  <div className="py-12 flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-[#141414] rounded-2xl">
                    <History size={32} strokeWidth={1} />
                    <p className="text-[10px] mt-4 font-mono uppercase tracking-widest">No local records</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* System Warning Overlay */}
      <AnimatePresence>
        {showAlert && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#141414]/95 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#E4E3E0] max-w-sm w-full p-8 rounded-[2.5rem] border-4 border-orange-500 shadow-2xl space-y-8"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="bg-orange-500 text-white p-5 rounded-[2rem] shadow-lg shadow-orange-500/20">
                  <ShieldAlert size={48} />
                </div>
                <h2 className="text-3xl font-bold tracking-tighter leading-none px-4">PARTITION BREACH</h2>
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-60">Locked Savings Intrusion Detected</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-[#141414] space-y-4 shadow-inner">
                <p className="text-xs italic leading-relaxed text-center opacity-80">
                  Transaction of <span className="font-bold text-orange-600">₹{showAlert.amount}</span> at {showAlert.merchant} will exhaust your Spendable Balance.
                </p>
                <div className="flex justify-between items-center bg-orange-50 p-3 rounded-xl border border-orange-100">
                  <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest">Spendable Cap</span>
                  <span className="font-mono font-bold text-orange-700">₹{spendableBalance.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => pendingRecord && commitTransaction(pendingRecord)}
                  className="w-full bg-[#141414] text-[#E4E3E0] p-5 rounded-2xl font-mono text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                >
                  Authorize Use of Savings
                </button>
                <button 
                  onClick={() => {
                    setShowAlert(null);
                    setPendingRecord(null);
                  }}
                  className="w-full border border-[#141414] p-5 rounded-2xl font-mono text-[10px] uppercase tracking-widest opacity-50 hover:bg-white hover:opacity-100 transition-all"
                >
                  Abort Transaction
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  </div>
);
}

function EmptyState() {
  return (
    <div className="py-24 flex flex-col items-center justify-center opacity-30">
      <div className="relative">
        <Terminal size={64} strokeWidth={1} />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-[#141414] rounded-full blur-[1px]"
        />
      </div>
      <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.4em] text-center max-w-[200px] leading-relaxed">
        Awaiting input pulse...
      </p>
    </div>
  );
}
