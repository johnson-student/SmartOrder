import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-ink-soft">The page you are looking for does not exist.</p>
      <Link to="/" className="mt-5 font-semibold text-lagoon-dark underline">
        Go to the start page
      </Link>
    </main>
  );
}
