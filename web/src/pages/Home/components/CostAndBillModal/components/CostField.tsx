import type { UseFormRegister } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@components/ui/field';
import { Input } from '@components/ui/input';
import type { CostAndBillFormValues } from '../costAndBillFormUtils';

type Props = {
  register: UseFormRegister<CostAndBillFormValues>;
  error: string | undefined;
  isDisabled: boolean;
};

const COST_ID = 'cost-and-bill-cost';
const COST_HINT_ID = 'cost-and-bill-cost-hint';
const COST_ERROR_ID = 'cost-and-bill-cost-error';
const COST_HINT = 'In euros, like 42,10 or 42.10. Leave it empty for no cost.';

// What the reading cost, in euros. A phone shows its number pad with a decimal key. The hint, and the error once
// there is one, sit under the field and describe it.
function CostField({ register, error, isDisabled }: Props) {
  const hasError = error !== undefined;
  const describedBy = hasError ? `${COST_HINT_ID} ${COST_ERROR_ID}` : COST_HINT_ID;

  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor={COST_ID}>Cost (€)</FieldLabel>
      <Input
        id={COST_ID}
        inputMode="decimal"
        autoComplete="off"
        disabled={isDisabled}
        aria-invalid={hasError}
        aria-describedby={describedBy}
        {...register('cost')}
      />
      <FieldDescription id={COST_HINT_ID}>{COST_HINT}</FieldDescription>
      <FieldError id={COST_ERROR_ID}>{error}</FieldError>
    </Field>
  );
}

export default CostField;
