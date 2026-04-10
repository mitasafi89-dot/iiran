import Link from "next/link";
import { Mail } from "lucide-react";
import { IIRanLogo } from "@/components/iiran-logo";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";

export function Footer({ dict, lang }: { dict: Dictionary; lang: Locale }) {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 sm:gap-8">
          {/* Brand & Mission */}
          <div className="col-span-2 sm:col-span-3 md:col-span-2">
            <Link href={`/${lang}`} className="flex items-center gap-2 font-bold text-lg tracking-tight mb-4">
              <IIRanLogo variant={1} className="w-6 h-6 text-primary" />
              <span>IIRan</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-4">
              {dict.footer.mission}
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
            <h3 className="font-semibold text-sm mb-3">{dict.footer.quickLinks}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href={`/${lang}#stories`} className="hover:text-foreground transition-colors">{dict.nav.stories}</Link></li>
              <li><Link href={`/${lang}#dashboard`} className="hover:text-foreground transition-colors">{dict.footer.crisisDashboard}</Link></li>
              <li><Link href={`/${lang}/donate`} className="hover:text-foreground transition-colors">{dict.nav.donate}</Link></li>
              <li><Link href={`/${lang}#impact`} className="hover:text-foreground transition-colors">{dict.footer.impactReports}</Link></li>
              <li><Link href={`/${lang}/news`} className="hover:text-foreground transition-colors">{dict.nav.news}</Link></li>
            </ul>
          </div>

          {/* Organization */}
          <div>
            <h3 className="font-semibold text-sm mb-3">{dict.footer.organization}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href={`/${lang}/about`} className="hover:text-foreground transition-colors">{dict.footer.aboutUs}</Link></li>
              <li><Link href={`/${lang}/transparency`} className="hover:text-foreground transition-colors">{dict.footer.financialTransparency}</Link></li>
              <li><Link href={`/${lang}/press`} className="hover:text-foreground transition-colors">{dict.footer.pressMedia}</Link></li>
              <li><Link href={`/${lang}/contact`} className="hover:text-foreground transition-colors">{dict.footer.contact}</Link></li>
              <li><Link href={`/${lang}/ethics`} className="hover:text-foreground transition-colors">{dict.footer.ethicsWhistleblower}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-sm mb-3">{dict.footer.legal}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href={`/${lang}/privacy`} className="hover:text-foreground transition-colors">{dict.footer.privacyPolicy}</Link></li>
              <li><Link href={`/${lang}/terms`} className="hover:text-foreground transition-colors">{dict.footer.termsOfService}</Link></li>
              <li><Link href={`/${lang}/accessibility`} className="hover:text-foreground transition-colors">{dict.footer.accessibility}</Link></li>
              <li>
                <a
                  href="/.well-known/security.txt"
                  className="hover:text-foreground transition-colors"
                >
                  {dict.footer.securityPolicy}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            {dict.footer.copyright}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span>{dict.footer.chsVerified}</span>
            <span className="w-px h-3 bg-border hidden sm:block" aria-hidden="true" />
            <span>{dict.footer.sphereStandards}</span>
            <span className="w-px h-3 bg-border hidden sm:block" aria-hidden="true" />
            <span>{dict.footer.independentlyAudited}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
