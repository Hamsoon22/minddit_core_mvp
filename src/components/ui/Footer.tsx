export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-60 right-0 z-20 border-t border-gray-200 bg-white">
      <div className="px-6 py-3 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Minddit Core. All rights reserved.
      </div>
    </footer>
  );
}