// Maps the 16 preset category names to the curated CSS color tokens from the
// mockup. Custom/renamed categories fall back to their type's plain accent
// color — renaming a preset (categories are user-editable) just means it loses
// its distinct hue and falls back too, which is a fine, expected degradation.
const PRESET_TOKENS = {
  Rent: 'rent',
  Utilities: 'utilities',
  Transportation: 'transportation',
  Groceries: 'groceries',
  'Eating out / order in': 'eating-out',
  Health: 'health',
  Dependents: 'dependents',
  Supplies: 'supplies',
  Fun: 'fun',
  Entertainment: 'entertainment',
  Debts: 'debts',
  Education: 'education',
  Giving: 'giving',
  'Retirement saving': 'retirement',
  'Short term savings': 'shortterm',
  Savings: 'bigpurchase',
};

const TYPE_FALLBACK = {
  necessary: 'var(--accent-necessary)',
  discretionary: 'var(--accent-discretionary)',
  savings: 'var(--cat-retirement)',
};

const TYPE_FALLBACK_BG = {
  necessary: 'var(--accent-necessary-bg)',
  discretionary: 'var(--accent-discretionary-bg)',
  savings: 'var(--cat-retirement-bg)',
};

export function categoryColor(label, type) {
  const token = PRESET_TOKENS[label];
  return token ? `var(--cat-${token})` : TYPE_FALLBACK[type] || 'var(--text-secondary)';
}

export function categoryColorBg(label, type) {
  const token = PRESET_TOKENS[label];
  return token ? `var(--cat-${token}-bg)` : TYPE_FALLBACK_BG[type] || 'var(--bg-tertiary)';
}
