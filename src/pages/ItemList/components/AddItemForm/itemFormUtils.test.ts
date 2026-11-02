import { getInitialValues, itemFormSchema, toPayload } from './itemFormUtils';

describe('getInitialValues', () => {
  it('starts with an empty name', () => {
    expect(getInitialValues()).toEqual({ name: '' });
  });
});

describe('itemFormSchema', () => {
  it('rejects an empty name', async () => {
    await expect(itemFormSchema.validate({ name: '  ' })).rejects.toThrow('Name is required');
  });

  it('rejects a name longer than 100 characters', async () => {
    await expect(itemFormSchema.validate({ name: 'a'.repeat(101) })).rejects.toThrow(
      'Name must be at most 100 characters',
    );
  });
});

describe('toPayload', () => {
  it('maps the form values to the API payload', () => {
    expect(toPayload({ name: 'Stapler' })).toEqual({ name: 'Stapler' });
  });
});
