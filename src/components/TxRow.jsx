import { ArrowUpIcon, ArrowDownIcon, TrashIcon } from './icons.jsx';
import { categoryColor, categoryColorBg } from './categoryColors.js';
import { fmtCents } from '../utils/format.js';

export default function TxRow({ tx, onDelete }) {
  const isExpense = tx.type === 'expense';
  return (
    <div className="txrow">
      <div className="swatch" style={{ background: isExpense ? 'var(--accent-expense-bg)' : 'var(--accent-income-bg)' }}>
        {isExpense ? (
          <ArrowUpIcon stroke="var(--accent-expense)" />
        ) : (
          <ArrowDownIcon stroke="var(--accent-income)" />
        )}
      </div>
      <div className="mid">
        <div className="cat">
          {isExpense ? tx.category_label || 'Uncategorized' : tx.job_name}
          {isExpense && tx.merchant_name && <span className="detail"> · {tx.merchant_name}</span>}
          {!isExpense && <span className="detail"> · paycheck</span>}
        </div>
        {isExpense && tx.necessary && (
          <span
            className="chip"
            style={{
              background: categoryColorBg(tx.category_label, tx.category_type),
              color: categoryColor(tx.category_label, tx.category_type),
            }}
          >
            {tx.necessary}
          </span>
        )}
      </div>
      <div className="amt" style={{ color: isExpense ? 'var(--accent-expense)' : 'var(--accent-income)' }}>
        {isExpense ? '-' : '+'}
        {fmtCents(tx.amount)}
      </div>
      {onDelete && (
        <button className="del" onClick={onDelete} aria-label="Delete entry" type="button">
          <TrashIcon />
        </button>
      )}
    </div>
  );
}
