import { Info } from 'lucide-react';

export function DemoCatalogNotice() {
  return (
    <aside className="store-demo-notice" aria-label="Demo catalog notice">
      <Info size={17} aria-hidden="true" />
      <p>
        <strong>Demo catalog.</strong> Titles, ISBNs, prices, discounts and availability are illustrative for presentation only and are not live purchasing data.
      </p>
    </aside>
  );
}
