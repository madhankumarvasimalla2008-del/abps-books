import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CustomerProvider } from '@/context/CustomerContext';
import { CategoryProvider } from '@/context/CategoryContext';
import { ProductProvider } from '@/context/ProductContext';
import { InventoryProvider } from '@/context/InventoryContext';
import { CartProvider } from '@/context/CartContext';
import { OrderProvider } from '@/context/OrderContext';
import { TransactionProvider } from '@/context/TransactionContext';
import { BranchProvider } from '@/context/BranchContext';
import { SupplierProvider } from '@/context/SupplierContext';
import { PurchaseOrderProvider } from '@/context/PurchaseOrderContext';
import { ShipmentProvider } from '@/context/ShipmentContext';
import { NotificationProvider } from '@/context/NotificationContext';

export const metadata: Metadata = {
  title: 'ABPS Book Distribution Platform',
  description:
    'Dedicated e-commerce and bulk book distribution system for Aditya Birla Public School branches across India.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50 antialiased">
      <body className="min-h-full flex flex-col text-slate-900 bg-slate-50 font-sans selection:bg-emerald-600 selection:text-white">
        <AuthProvider>
          <BranchProvider>
            <SupplierProvider>
              <PurchaseOrderProvider>
                <ShipmentProvider>
                  <NotificationProvider>
                    <CustomerProvider>
                      <CategoryProvider>
                        <ProductProvider>
                          <InventoryProvider>
                            <CartProvider>
                              <TransactionProvider>
                                <OrderProvider>{children}</OrderProvider>
                              </TransactionProvider>
                            </CartProvider>
                          </InventoryProvider>
                        </ProductProvider>
                      </CategoryProvider>
                    </CustomerProvider>
                  </NotificationProvider>
                </ShipmentProvider>
              </PurchaseOrderProvider>
            </SupplierProvider>
          </BranchProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
