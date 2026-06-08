import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = 'danger' }) => {
    if (!isOpen) return null;

    return (
        <div className="confirm-overlay">
            <div className="confirm-content glass animate-fade-in">
                <button className="confirm-close" onClick={onCancel}><X size={20} /></button>
                
                <div className="confirm-body">
                    <div className={`confirm-icon-box ${type}`}>
                        <AlertCircle size={32} />
                    </div>
                    <h3>{title}</h3>
                    <p>{message}</p>
                </div>

                <div className="confirm-footer">
                    <button className="confirm-btn cancel" onClick={onCancel}>Hủy bỏ</button>
                    <button 
                        className={`confirm-btn action ${type}`} 
                        onClick={() => {
                            onConfirm();
                            onCancel();
                        }}
                    >
                        Xác nhận
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
