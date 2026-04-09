import Link from "next/link";
import { Mail } from "lucide-react";
import { IIRanLogo } from "@/components/iiran-logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 sm:gap-8">
          {/* Brand & Mission */}
          <div className="col-span-2 sm:col-span-3 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight mb-4">
              <IIRanLogo variant={1} className="w-6 h-6 text-primary" />
              <span>IIRan</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-4">
              A non-partisan humanitarian initiative focused on supporting peace,
              recovery, and rebuilding efforts in Iran. Every contribution makes a
              difference.
            </p>
            <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                <a href="mailto:info@iiran.org" className="hover:text-foreground transition-colors">
                  info@iiran.org
                </a>
              </div>

            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#stories" className="hover:text-foreground transition-colors">Stories</Link></li>
              <li><Link href="#dashboard" className="hover:text-foreground transition-colors">Crisis Dashboard</Link></li>
              <li><Link href="/donate" className="hover:text-foreground transition-colors">Donate</Link></li>
              <li><Link href="#impact" className="hover:text-foreground transition-colors">Impact Reports</Link></li>
              <li><Link href="/news" className="hover:text-foreground transition-colors">News</Link></li>
            </ul>
          </div>

          {/* Organization */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Organization</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link href="/transparency" className="hover:text-foreground transition-colors">Financial Transparency</Link></li>
              <li><Link href="/press" className="hover:text-foreground transition-colors">Press &amp; Media</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link href="/ethics" className="hover:text-foreground transition-colors">Ethics &amp; Whistleblower</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link href="/accessibility" className="hover:text-foreground transition-colors">Accessibility</Link></li>
              <li>
                <a
                  href="/.well-known/security.txt"
                  className="hover:text-foreground transition-colors"
                >
                  Security Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} IIRan, Inc. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span>CHS Alliance Verified</span>
            <span className="w-px h-3 bg-border hidden sm:block" aria-hidden="true" />
            <span>Sphere Standards</span>
            <span className="w-px h-3 bg-border hidden sm:block" aria-hidden="true" />
            <span>Independently Audited</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
