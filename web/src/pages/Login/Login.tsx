import PasskeySignInButton from './components/PasskeySignInButton';
import PasswordSignInForm from './components/PasswordSignInForm';

function Login() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <PasswordSignInForm />
      <p className="text-gray-600">or</p>
      <PasskeySignInButton />
      <p className="text-sm text-gray-600">
        Locked out? Run <code>yarn auth:reset</code> on the server and open the new setup link it prints.
      </p>
    </main>
  );
}

export default Login;
