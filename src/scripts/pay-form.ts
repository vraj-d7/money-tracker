// Wires up the FixedPayFields component: reads what's typed and shows what will land in the bank.
import { inr } from '../lib/format';
import { fixedTaxNote } from './profile-store';

const rupees = (v: string) => Number(v.split('.')[0].replace(/\D/g, ''));
const withCommas = (n: number) => (n ? n.toLocaleString('en-IN') : '');

export function wireFixedPay(start: { fixedMonthly: number; fixedCuts: number }) {
  const box = document.querySelector<HTMLElement>('[data-fixed-pay]')!;
  const amount = box.querySelector<HTMLInputElement>('[data-fixed-amount]')!;
  const cuts = box.querySelector<HTMLInputElement>('[data-fixed-cuts]')!;
  const cutsBox = box.querySelector<HTMLElement>('[data-fixed-cuts-box]')!;
  const error = box.querySelector<HTMLElement>('[data-fixed-error]')!;
  const result = box.querySelector<HTMLElement>('[data-fixed-result]')!;
  const taxNote = box.querySelector<HTMLElement>('[data-fixed-tax]')!;
  let hasCuts = start.fixedCuts > 0;

  amount.value = withCommas(start.fixedMonthly);
  cuts.value = withCommas(start.fixedCuts);

  const values = () => ({ fixedMonthly: rupees(amount.value), fixedCuts: hasCuts ? rupees(cuts.value) : 0 });

  function render() {
    const v = values();
    box.querySelectorAll<HTMLElement>('[data-fixed-cut]').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.fixedCut === 'yes') === hasCuts)));
    cutsBox.hidden = !hasCuts;
    const ok = v.fixedMonthly > 0 && v.fixedCuts < v.fixedMonthly;
    result.hidden = !ok;
    if (ok) result.textContent = `${inr(v.fixedMonthly - v.fixedCuts)} lands in your bank each month`;
    const note = v.fixedMonthly > 0 ? fixedTaxNote(v.fixedMonthly) : '';
    taxNote.hidden = !note;
    taxNote.textContent = note;
  }

  const format = (input: HTMLInputElement) => {
    input.value = withCommas(rupees(input.value));
    error.hidden = true;
    render();
  };
  amount.addEventListener('input', () => format(amount));
  cuts.addEventListener('input', () => format(cuts));
  box.querySelectorAll<HTMLElement>('[data-fixed-cut]').forEach((b) =>
    b.addEventListener('click', () => {
      hasCuts = b.dataset.fixedCut === 'yes';
      render();
      if (hasCuts) cuts.focus();
    }),
  );
  render();

  return {
    /** Show or hide the whole group */
    show(on: boolean) {
      box.hidden = !on;
    },
    values,
    /** Checks the answers and points at any problem. True when they're fine. */
    validate(): boolean {
      const v = values();
      const problem = v.fixedMonthly <= 0 ? 'Enter your monthly salary.' : v.fixedCuts >= v.fixedMonthly ? 'What’s cut has to be less than your salary.' : '';
      error.textContent = problem;
      error.hidden = !problem;
      if (problem) (v.fixedMonthly <= 0 ? amount : cuts).focus();
      return !problem;
    },
  };
}
