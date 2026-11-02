import StandalonePage from '@components/StandalonePage';
import OrDivider from './components/OrDivider';
import PasskeySignInButton from './components/PasskeySignInButton';
import PasswordSignInForm from './components/PasswordSignInForm';

function Login() {
  return (
    <StandalonePage title="Sign in">
      <PasswordSignInForm />
      <OrDivider />
      <PasskeySignInButton />
      <p className="text-sm text-muted-foreground">
        Locked out? Run <code className="rounded-sm bg-muted px-1 font-mono">yarn auth:reset</code> on the server and
        open the new setup link it prints.
      </p>
    </StandalonePage>
  );
}

export default Login;
