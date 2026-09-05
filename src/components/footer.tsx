import Link from "next/link";
import Image from "next/image";

const footerLinks = [
  { href: "/docs/kagent", label: "Docs" },
  { href: "/blog", label: "Blog" },
  { href: "/agents", label: "Agents" },
  { href: "/tools", label: "Tools" },
  { href: "/enterprise", label: "Enterprise" },
];

const extLink = "underline-offset-2 transition-colors hover:text-kg-tx2 hover:underline";

export default function Footer() {
  return (
    <footer className="mt-auto flex justify-center border-t border-kg-bd-soft px-8 py-11">
      <div className="flex w-full max-w-[1160px] flex-wrap items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/images/brand/kagent-mark-purple.svg" alt="" width={24} height={24} />
          <span className="font-display text-lg font-medium tracking-[-0.02em] text-kg-tx1">kagent</span>
        </Link>

        <nav className="flex flex-wrap gap-[22px] text-sm">
          {footerLinks.map((l) => (
            <Link key={l.href} href={l.href} className="text-kg-tx3 transition-colors hover:text-kg-tx1">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex w-full flex-wrap items-center gap-3.5 font-mono text-[11.5px] tracking-[0.05em] text-kg-tx4 xl:ml-auto xl:w-auto">
          <a href="https://cncf.io/" target="_blank" rel="noopener noreferrer" className="opacity-50 transition-opacity hover:opacity-80">
            <Image src="/images/brand/cncf.svg" alt="CNCF" width={106} height={20} className="h-5 w-auto" />
          </a>
          <span>
            created at{" "}
            <a href="https://solo.io/" target="_blank" rel="noopener noreferrer" className={extLink}>
              Solo.io
            </a>{" "}
            · CNCF sandbox project · © {new Date().getFullYear()} kagent, a Series of LF Projects, LLC. ·{" "}
            <a href="https://lfprojects.org/policies/" target="_blank" rel="noopener noreferrer" className={extLink}>
              Trademark usage
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
