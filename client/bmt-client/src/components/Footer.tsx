import { type JSX } from 'react';

export default function Footer(): JSX.Element {
  return (
    <footer className="px-4 py-4 text-center text-xs text-zinc-500">
      <div className="max-w-lg mx-auto">
        <p>Keyboard shortcuts: Enter to add, Space to toggle timer</p>
      </div>
    </footer>
  );
}