export const formatEuro = (value) =>
  new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0);

export const normalizeName = (name) => String(name || '').trim().toLowerCase();