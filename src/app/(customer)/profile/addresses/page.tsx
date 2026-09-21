'use client';

import React, { useState } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { AccountNavigation } from '@/components/customer/profile/AccountNavigation';
import { AddressCard } from '@/components/customer/profile/AddressCard';
import { AddressModal } from '@/components/customer/profile/AddressModal';
import { DeleteAddressDialog } from '@/components/customer/profile/DeleteAddressDialog';
import { useCustomer, SavedAddress } from '@/context/CustomerContext';
import { Button } from '@/components/ui/Button';
import { Plus, MapPin } from 'lucide-react';

export default function AddressesPage() {
  const {
    addresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useCustomer();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<SavedAddress | null>(null);

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (address: SavedAddress) => {
    setEditingAddress(address);
    setIsModalOpen(true);
  };

  const handleSave = (data: Omit<SavedAddress, 'id'> | Partial<SavedAddress>) => {
    if (editingAddress) {
      updateAddress(editingAddress.id, data);
    } else {
      addAddress(data as Omit<SavedAddress, 'id'>);
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingAddress) {
      deleteAddress(deletingAddress.id);
      setDeletingAddress(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'My Profile', href: '/profile' },
          { label: 'Saved Addresses' },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Saved Addresses
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Manage your delivery locations and default delivery destination for orders.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto text-xs font-semibold"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Add New Address</span>
        </Button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (4 cols): Subnavigation */}
        <aside className="lg:col-span-4 space-y-4">
          <AccountNavigation />
        </aside>

        {/* Right Column (8 cols): Address Cards List */}
        <main className="lg:col-span-8 space-y-4">
          {addresses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-slate-900">No Saved Addresses</h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You have not added any delivery addresses yet. Add an address to speed up your order checkout.
                </p>
              </div>
              <div className="pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleOpenAdd}
                  className="text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Your First Address
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  onEdit={handleOpenEdit}
                  onDelete={(addr) => setDeletingAddress(addr)}
                  onSetDefault={setDefaultAddress}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Add / Edit Modal */}
      <AddressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        addressToEdit={editingAddress}
        onSave={handleSave}
        isFirstAddress={addresses.length === 0}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteAddressDialog
        isOpen={!!deletingAddress}
        onClose={() => setDeletingAddress(null)}
        address={deletingAddress}
        onConfirm={handleDeleteConfirm}
        remainingCount={addresses.length}
      />
    </div>
  );
}
