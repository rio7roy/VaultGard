import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Copy, 
  Check, 
  Clock, 
  Info, 
  FileJson, 
  Trash2,
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Home,
  ArrowLeftRight,
  Wallet,
  HelpCircle
} from "lucide-react";
import { useState } from "react";
import { TransactionData } from "../services/geminiService";

const CATEGORY_ICONS: Record<string, any> = {
  "Food & Beverage": Utensils,
  "Transport": Car,
  "Groceries": ShoppingBag,
  "Utilities": Zap,
  "Shopping": ShoppingBag,
  "Rent": Home,
  "Transfer": ArrowLeftRight,
  "Salary": Wallet,
  "Unknown": HelpCircle,
};

interface ExtractionDisplayProps {
  data: TransactionData;
  rawJson: string;
  key?: string;
}

export default function ExtractionDisplay({ data, rawJson }: ExtractionDisplayProps) {
  const [copied, setCopied] = useState(false);
  const Icon = CATEGORY_ICONS[data.category] || HelpCircle;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rawJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-[#141414] text-[#E4E3E0] p-8 rounded-2xl border border-[#141414] shadow-2xl relative overflow-hidden group">
        {/* Visual Background Accent */}
        <div className="absolute -right-12 -top-12 opacity-5 scale-150 rotate-12 transition-transform duration-700 group-hover:rotate-0">
          <Icon size={300} />
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-12">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-[0.2em] opacity-50 font-mono">Category</span>
              <div className="flex items-center gap-2">
                <Icon size={18} className="text-brand-secondary" />
                <h3 className="text-lg font-medium italic serif tracking-tight">{data.category}</h3>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest border border-current ${data.is_debit ? 'text-orange-400' : 'text-emerald-400'}`}>
              {data.is_debit ? 'Debit' : 'Credit'}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.2em] opacity-50 font-mono">Merchant</span>
            <h2 className="text-4xl font-bold tracking-tighter leading-none mb-8">{data.merchant}</h2>
          </div>

          <div className="flex items-end justify-between border-t border-white/10 pt-8">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.2em] opacity-50 font-mono">Amount</span>
              <div className="flex items-center gap-3">
                {data.is_debit ? (
                  <ArrowUpRight className="text-orange-400" size={24} />
                ) : (
                  <ArrowDownLeft className="text-emerald-400" size={24} />
                )}
                <span className="text-5xl font-mono tracking-tighter">
                  ₹{data.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 opacity-50">
            <FileJson size={14} />
            <span className="text-[11px] uppercase tracking-widest font-mono">JSON Payload</span>
          </div>
          <button 
            onClick={copyToClipboard}
            className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest bg-white/50 hover:bg-white p-2 rounded transition-colors border border-[#141414]"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre className="bg-white p-6 rounded-xl border border-[#141414] font-mono text-xs overflow-x-auto leading-relaxed shadow-sm">
          {rawJson}
        </pre>
      </div>
    </motion.div>
  );
}
