import Link from 'next/link';

const NavBar = () => {
  return (
    <nav className="flex justify-between items-center bg-gray-800 text-white p-4 shadow-md">
      <div className="text-xl font-bold">Stream Gemini</div>
      <div className="flex space-x-4">
        <Link href="/" className="hover:text-gray-300 transition-colors">
          Home
        </Link>
        <Link href="/watched" className="hover:text-gray-300 transition-colors">
          Watched
        </Link>
        <Link href="/watchlist" className="hover:text-gray-300 transition-colors">
          Watchlist
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;