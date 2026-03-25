import React from "react";
import Modal from "./Modal";
import Button from "./Button";

export default function Dialog({
       isOpen,
       onClose,
       title,
       description,
       children,
       confirmText = "Confirm",
       cancelText = "Cancel",
       confirmVariant = "primary",
       onConfirm,
       footer,
       className = "",
       contentClassName = "",
       closeOnOverlayClick = true,
       isConfirmDisabled = false,
    }) {
    const resolvedFooter = footer ?? (
        <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
                {cancelText}
            </Button>
            <Button
                type="button"
                variant={confirmVariant}
                onClick={onConfirm}
                disabled={isConfirmDisabled}
            >
                {confirmText}
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={resolvedFooter}
            className={className}
            contentClassName={contentClassName}
            closeOnOverlayClick={closeOnOverlayClick}
        >
            {description && (
                <p className="mb-4 text-sm text-gray-600">
                    {description}
                </p>
            )}
            {children}
        </Modal>
    );
}
