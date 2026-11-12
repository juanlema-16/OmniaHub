const formatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatQ = (value) => {
  const number = Number(value) || 0;
  const sign = number < 0 ? '-' : '';
  return `${sign}Q ${formatter.format(Math.abs(number))}`;
};
