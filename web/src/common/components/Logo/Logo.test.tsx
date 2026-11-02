import { render, screen } from '@test-utils';
import Logo from '@components/Logo';

it('stays hidden from screen readers when it sits next to the app name', () => {
  render(<Logo />);

  expect(screen.queryByRole('img')).not.toBeInTheDocument();
});

it('is announced by its label when it stands alone', () => {
  render(<Logo label="Meter Reader" />);

  expect(screen.getByRole('img', { name: 'Meter Reader' })).toBeVisible();
});
