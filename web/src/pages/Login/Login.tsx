import StandalonePage from '@components/StandalonePage';
import OrDivider from './components/OrDivider';
import PasskeySignInButton from './components/PasskeySignInButton';
import PasswordSignInForm from './components/PasswordSignInForm';

const TITLE = 'Welcome back!';
const DESCRIPTION = 'Your meter missed you. Sign in to send this month’s reading.';

// Outside the signed-in layout. A password or a passkey: both submit to this route's action. How to get back in
// when locked out sits under the card as small print.
function Login() {
  return (
    <StandalonePage
      title={TITLE}
      description={DESCRIPTION}
      footer={
        <>
          Locked out? Run <code className="rounded-sm bg-muted px-1 font-mono">yarn auth:reset</code> on the server and
          open the new setup link it prints.
        </>
      }
    >
      <PasswordSignInForm />
      <OrDivider />
      <PasskeySignInButton />
    </StandalonePage>
  );
}

export default Login;
