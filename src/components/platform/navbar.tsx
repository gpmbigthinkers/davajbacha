import Link from "next/link";

export function Navbar() {
  return (
    <header>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <Link
          href="/"
          className="rounded-md font-heading text-3xl font-bold text-black outline-none focus-visible:ring-2 focus-visible:ring-black/70"
        >
          DAVAJ-BACHA
        </Link>
      </div>
    </header>
  );
}
