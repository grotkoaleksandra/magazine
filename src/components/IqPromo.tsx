import Link from "next/link";

export function IqPromo() {
  return (
    <Link href="/iq-test/" className="iq-promo">
      <span className="iq-promo-title">are you stupid?</span>
      <span className="iq-promo-sub">take a test!</span>
      <span className="iq-promo-cta">start the test →</span>
    </Link>
  );
}
