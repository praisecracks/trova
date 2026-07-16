import React, { useEffect, useRef } from 'react';
import { 
  CheckCircle, 
  Lock, 
  AlertTriangle, 
  Package, 
  Trash, 
  Key, 
  RotateCcw, 
  ShieldX, 
  XCircle, 
  Banknote 
} from 'lucide-react';

export type ConfirmationModalType = 
  | 'confirm_delivery'
  | 'pay_now'
  | 'raise_dispute'
  | 'mark_shipped'
  | 'delete_item'
  | 'remove_link'
  | 'regenerate_api'
  | 'delete_avatar'
  | 'release_funds'
  | 'refund_buyer'
  | 'freeze_seller'
  | 'unfreeze_seller'
  | 'approve_kyc'
  | 'reject_kyc'
  | 'revoke_kyc'
  | 'rekey_kyc'
  | 'process_payouts'
  | 'delete_account';

interface ConfirmationModalProps {
  isOpen: boolean;
  type: ConfirmationModalType;
  onConfirm: () => void;
  onCancel: () => void;
  theme?: 'dark' | 'light';
}

export default function ConfirmationModal({
  isOpen,
  type,
  onConfirm,
  onCancel,
  theme: propTheme = 'dark'
}: ConfirmationModalProps) {
  const theme = propTheme || (typeof window !== 'undefined' && document.body.classList.contains('light-theme') ? 'light' : 'dark');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  // Configuration mapper based on type
  const getConfig = () => {
    switch (type) {
      case 'confirm_delivery':
        return {
          title: 'Confirm Delivery',
          subtext: 'Once you confirm delivery the payment will be released to the seller immediately. This cannot be undone. Please make sure you have inspected your order and are fully satisfied.',
          confirmText: 'Yes Confirm Delivery',
          confirmColor: 'bg-emerald-500 hover:bg-emerald-400 text-black border border-emerald-500',
          icon: <CheckCircle className="w-8 h-8 text-emerald-500" />
        };
      case 'pay_now':
        return {
          title: 'Confirm Payment',
          subtext: 'You are about to pay the amount shown into secure escrow. Your money is protected and will only be released when you confirm delivery.',
          confirmText: 'Yes Proceed to Pay',
          confirmColor: 'bg-emerald-500 hover:bg-emerald-400 text-black border border-emerald-500',
          icon: <Lock className="w-8 h-8 text-emerald-500" />
        };
      case 'raise_dispute':
        return {
          title: 'Raise a Dispute',
          subtext: 'Raising a dispute will freeze this transaction. Neither party can access the funds until our team resolves the case. Only do this if you have a genuine issue with your order.',
          confirmText: 'Yes Raise Dispute',
          confirmColor: 'bg-amber-500 hover:bg-amber-400 text-black border border-amber-500',
          icon: <AlertTriangle className="w-8 h-8 text-amber-500" />
        };
      case 'mark_shipped':
        return {
          title: 'Mark as Shipped',
          subtext: 'Confirm that you have dispatched the item to the buyer. The buyer will be notified.',
          confirmText: 'Yes Mark as Shipped',
          confirmColor: 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-600',
          icon: <Package className="w-8 h-8 text-blue-500" />
        };
      case 'delete_item':
        return {
          title: 'Delete Item',
          subtext: 'This will permanently remove this item from your store. This cannot be undone.',
          confirmText: 'Yes Delete Item',
          confirmColor: 'bg-red-600 hover:bg-red-500 text-white border border-red-600',
          icon: <Trash className="w-8 h-8 text-red-500" />
        };
      case 'remove_link':
        return {
          title: 'Remove Link',
          subtext: 'This will remove this link from your public store page.',
          confirmText: 'Yes Remove Link',
          confirmColor: 'bg-red-600 hover:bg-red-500 text-white border border-red-600',
          icon: <Trash className="w-8 h-8 text-red-500" />
        };
      case 'regenerate_api':
        return {
          title: 'Regenerate API Key',
          subtext: 'Generating a new API key will immediately invalidate your current key. Any integrations using the old key will stop working.',
          confirmText: 'Yes Regenerate Key',
          confirmColor: 'bg-amber-500 hover:bg-amber-400 text-black border border-amber-500',
          icon: <Key className="w-8 h-8 text-amber-500" />
        };
      case 'delete_avatar':
        return {
          title: 'Delete Profile Photo',
          subtext: 'Your profile photo will be removed and replaced with your initials.',
          confirmText: 'Yes Delete Photo',
          confirmColor: 'bg-red-600 hover:bg-red-500 text-white border border-red-600',
          icon: <Trash className="w-8 h-8 text-red-500" />
        };
      case 'release_funds':
        return {
          title: 'Release Funds to Seller',
          subtext: "This will immediately release the held escrow funds to the seller's account. This action is final and cannot be reversed.",
          confirmText: 'Yes Release Funds',
          confirmColor: 'bg-emerald-500 hover:bg-emerald-400 text-black border border-emerald-500',
          icon: <CheckCircle className="w-8 h-8 text-emerald-500" />
        };
      case 'refund_buyer':
        return {
          title: 'Refund Buyer',
          subtext: 'This will cancel the transaction and return the escrowed funds to the buyer. This action is final and cannot be reversed.',
          confirmText: 'Yes Refund Buyer',
          confirmColor: 'bg-red-600 hover:bg-red-500 text-white border border-red-600',
          icon: <RotateCcw className="w-8 h-8 text-red-500" />
        };
      case 'freeze_seller':
        return {
          title: 'Freeze Seller Account',
          subtext: "This will immediately suspend this seller's account. They will not be able to create new links or receive payouts until the account is unfrozen.",
          confirmText: 'Yes Freeze Account',
          confirmColor: 'bg-amber-500 hover:bg-amber-400 text-black border border-amber-500',
          icon: <ShieldX className="w-8 h-8 text-amber-500" />
        };
      case 'unfreeze_seller':
        return {
          title: 'Unfreeze Seller Account',
          subtext: "This will restore this merchant's public store access and resume all operational links.",
          confirmText: 'Yes Unfreeze',
          confirmColor: 'bg-amber-500 hover:bg-amber-400 text-black border border-amber-500',
          icon: <CheckCircle className="w-8 h-8 text-amber-500" />
        };
      case 'approve_kyc':
        return {
          title: 'Approve Verification',
          subtext: 'This will verify this merchant and grant them full access to create escrow links.',
          confirmText: 'Yes Approve',
          confirmColor: 'bg-emerald-500 hover:bg-emerald-400 text-black border border-emerald-500',
          icon: <CheckCircle className="w-8 h-8 text-emerald-500" />
        };
      case 'reject_kyc':
        return {
          title: 'Reject Application',
          subtext: "This will reject this merchant's verification application. They will be notified and can reapply.",
          confirmText: 'Yes Reject',
          confirmColor: 'bg-red-600 hover:bg-red-500 text-white border border-red-600',
          icon: <XCircle className="w-8 h-8 text-red-500" />
        };
      case 'revoke_kyc':
        return {
          title: 'Revoke KYC Verification',
          subtext: "Are you sure you want to revoke this merchant's KYC status? Their account will be downgraded to unverified (Tier 1), daily transaction limits will be enforced, and they will be prompted to re-apply with valid credentials.",
          confirmText: 'Yes, Revoke KYC',
          confirmColor: 'bg-red-600 hover:bg-red-505 text-white border border-red-600',
          icon: <ShieldX className="w-8 h-8 text-red-500" />
        };
      case 'rekey_kyc':
        return {
          title: 'Trigger Verification Audit',
          subtext: "This will put the merchant's account back into the review queue for a compliance audit. They will be notified to upload fresh documentation for audit.",
          confirmText: 'Yes, Trigger Audit',
          confirmColor: 'bg-amber-500 hover:bg-amber-400 text-black border border-amber-500',
          icon: <RotateCcw className="w-8 h-8 text-amber-500" />
        };
      case 'process_payouts':
        return {
          title: 'Process All Payouts',
          subtext: 'This will approve all pending payout requests at once. Each seller will be notified when their payout is processed.',
          confirmText: 'Yes Process All',
          confirmColor: 'bg-emerald-500 hover:bg-emerald-400 text-black border border-emerald-500',
          icon: <Banknote className="w-8 h-8 text-emerald-500" />
        };
      case 'delete_account':
        return {
          title: 'Delete Account Permanently',
          subtext: 'Are you absolutely sure you want to permanently delete your Trova merchant account? This will wipe your profile, transaction logs, and payout list. This action is final and CANNOT be undone.',
          confirmText: 'Delete Permanently',
          confirmColor: 'bg-red-650 hover:bg-red-550 text-white border border-red-650',
          icon: <ShieldX className="w-8 h-8 text-red-500" />
        };
      default:
        return {
          title: 'Confirm Action',
          subtext: 'Are you sure you want to proceed with this action? This operation may be permanent.',
          confirmText: 'Yes, Confirm',
          confirmColor: 'bg-emerald-500 hover:bg-emerald-400 text-black',
          icon: <CheckCircle className="w-8 h-8 text-emerald-500" />
        };
    }
  };

  const config = getConfig();

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onCancel();
    }
  };

  return (
    <div 
      id="trustlink-confirmation-modal-container"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 select-none animate-fade-in font-sans"
      style={{ backgroundColor: theme === 'light' ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.45)' }}
    >
      <div 
        id="trustlink-confirmation-modal-box"
        ref={modalRef}
        className="w-full max-w-[420px] rounded-[14px] p-6 text-center flex flex-col items-center gap-4 relative animate-scale-in"
        style={{ 
          backgroundColor: theme === 'light' ? '#ffffff' : '#0c0c0e',
          borderColor: theme === 'light' ? '#e4e4e7' : '#1f1f22',
          boxShadow: theme === 'light' ? '0 25px 50px -12px rgba(0, 0, 0, 0.08)' : '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* Render relevant icon */}
        <div 
          id="trustlink-confirmation-modal-icon-wrapper"
          className="w-16 h-16 rounded-full flex items-center justify-center shadow-inner"
          style={{ 
            backgroundColor: theme === 'light' ? '#f4f4f5' : 'rgba(31, 31, 34, 0.4)',
            borderColor: theme === 'light' ? '#e4e4e7' : 'rgba(48, 48, 52, 0.4)'
          }}
        >
          {config.icon}
        </div>

        {/* Heading */}
        <h3 
          id="trustlink-confirmation-modal-title"
          className="text-lg font-bold tracking-tight mt-1 px-2 leading-tight"
          style={{ color: theme === 'light' ? '#18181b' : '#ffffff' }}
        >
          {config.title}
        </h3>

        {/* Subtext explanation */}
        <p 
          id="trustlink-confirmation-modal-subtext"
          className="text-[13px] leading-relaxed px-1"
          style={{ color: theme === 'light' ? '#52525b' : '#a1a1aa' }}
        >
          {config.subtext}
        </p>

        {/* Action Buttons: equal width */}
        <div className="grid grid-cols-2 gap-3 w-full mt-3 select-none">
          <button
            id="trustlink-confirmation-modal-btn-cancel"
            type="button"
            onClick={onCancel}
            className="w-full py-2.5 rounded-xl text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer font-sans border"
            style={{ 
              backgroundColor: theme === 'light' ? '#f4f4f5' : 'rgba(31, 31, 34, 0.4)',
              borderColor: theme === 'light' ? '#d4d4d8' : '#27272a',
              color: theme === 'light' ? '#52525b' : '#d4d4d8'
            }}
          >
            Cancel
          </button>
          <button
            id="trustlink-confirmation-modal-btn-confirm"
            type="button"
            onClick={onConfirm}
            className={`w-full py-2.5 rounded-xl text-xs font-bold active:scale-[0.98] transition-all cursor-pointer font-sans shadow-sm ${config.confirmColor}`}
          >
            {config.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
