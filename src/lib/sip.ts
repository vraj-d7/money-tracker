// What a monthly SIP could grow to, at an assumed 10% a year (illustration only)
const MONTHLY_RATE = 0.1 / 12;

function futureValue(monthly: number, months: number): number {
  return monthly * ((Math.pow(1 + MONTHLY_RATE, months) - 1) / MONTHLY_RATE) * (1 + MONTHLY_RATE);
}

export function sipProjection(monthly: number) {
  return [
    { years: 1, label: '1 year' },
    { years: 5, label: '5 years' },
    { years: 10, label: '10 years' },
  ].map((y) => ({
    ...y,
    value: Math.round(futureValue(monthly, y.years * 12) / 100) * 100,
    invested: monthly * 12 * y.years,
  }));
}
