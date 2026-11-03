import { SaveIcon } from 'lucide-react';
import ErrorAlert from '@components/ErrorAlert';
import { Button } from '@components/ui/button';
import { Spinner } from '@components/ui/spinner';
import { formatIsoDate } from '@utils/dateUtils';
import { getCostAndBillLabel } from '@pages/Home/costAndBillUtils';
import ResponsiveDialog from '@components/ResponsiveDialog';
import BillField from './components/BillField';
import CostField from './components/CostField';
import { useCostAndBill } from './hooks/useCostAndBill';

const DESCRIPTION_PREFIX = 'What the reading of';
const DESCRIPTION_SUFFIX = 'cost, and its bill. Neither is ever part of its email.';
const SAVE_LABEL = 'Save';
const SAVING_LABEL = 'Saving…';
// The footer's Save sits outside the form, so it names the form it submits.
const FORM_ID = 'cost-and-bill-form';

// The reading's cost and bill, added, changed or removed after it is saved. Open for as long as its route is: closing
// it goes back to the same page of the history.
function CostAndBillModal() {
  'use no memo';

  const {
    reading,
    register,
    costError,
    billError,
    isBillRemoved,
    chooseBillFile,
    toggleBillRemoved,
    isSaving,
    failureMessage,
    handleOpenChange,
    saveCostAndBill,
  } = useCostAndBill();

  const footer = (
    <Button type="submit" form={FORM_ID} disabled={isSaving}>
      {isSaving ? <Spinner aria-hidden="true" /> : <SaveIcon aria-hidden="true" />}
      {isSaving ? SAVING_LABEL : SAVE_LABEL}
    </Button>
  );

  return (
    <ResponsiveDialog
      title={getCostAndBillLabel(reading)}
      description={`${DESCRIPTION_PREFIX} ${formatIsoDate(reading.date)} ${DESCRIPTION_SUFFIX}`}
      isOpen
      onOpenChange={handleOpenChange}
      footer={footer}
    >
      <form id={FORM_ID} noValidate onSubmit={(event) => void saveCostAndBill(event)} className="flex flex-col gap-5">
        <CostField register={register} error={costError} isDisabled={isSaving} />
        <BillField
          savedBill={reading.bill}
          isBillRemoved={isBillRemoved}
          error={billError}
          isDisabled={isSaving}
          onFileChange={chooseBillFile}
          onToggleRemoved={toggleBillRemoved}
        />
      </form>
      {failureMessage && <ErrorAlert message={failureMessage} />}
    </ResponsiveDialog>
  );
}

export default CostAndBillModal;
