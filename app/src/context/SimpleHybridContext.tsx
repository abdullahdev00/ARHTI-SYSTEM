import React, { createContext, useContext } from 'react';

/**
 * COMPATIBILITY LAYER FOR OLD SYSTEM
 * 
 * This is a temporary compatibility layer to prevent import errors
 * while we migrate components to the new fresh sync system.
 * 
 * Components using this should be gradually updated to use:
 * - usePartners() from '../hooks/useNewSyncedData'
 * - usePurchases() from '../hooks/useNewSyncedData'
 * - etc.
 */

interface SimpleHybridContextType {
    isInitialized: boolean;
    isLoading: boolean;
    error: string | null;

    // Deprecated functions - return empty data
    getFarmers: () => Promise<any[]>;
    addFarmer: (farmer: any) => Promise<any>;
    updateFarmer: (id: string, farmer: any) => Promise<any>;
    deleteFarmer: (id: string) => Promise<boolean>;

    getPurchases: () => Promise<any[]>;
    addPurchase: (purchase: any) => Promise<any>;
    updatePurchase: (id: string, purchase: any) => Promise<any>;
    deletePurchase: (id: string) => Promise<boolean>;

    getInvoices: () => Promise<any[]>;
    addInvoice: (invoice: any) => Promise<any>;

    getPayments: () => Promise<any[]>;
    addPayment: (payment: any) => Promise<any>;

    getCharges: () => Promise<any[]>;
    addCharge: (charge: any) => Promise<any>;
}

const SimpleHybridContext = createContext<SimpleHybridContextType | undefined>(undefined);

export const SimpleHybridProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    console.warn('⚠️ SimpleHybridProvider is deprecated. Please migrate to the fresh sync system.');

    const contextValue: SimpleHybridContextType = {
        isInitialized: true,
        isLoading: false,
        error: null,

        // Deprecated functions - return empty data with warnings
        getFarmers: async () => {
            console.warn('⚠️ getFarmers is deprecated. Use usePartners() from useNewSyncedData instead.');
            return [];
        },

        addFarmer: async (farmer: any) => {
            console.warn('⚠️ addFarmer is deprecated. Use partnerActions.add() from useNewSyncedData instead.');
            return { id: 'deprecated', ...farmer };
        },

        updateFarmer: async (id: string, farmer: any) => {
            console.warn('⚠️ updateFarmer is deprecated. Use partnerActions.update() from useNewSyncedData instead.');
            return { id, ...farmer };
        },

        deleteFarmer: async (id: string) => {
            console.warn('⚠️ deleteFarmer is deprecated. Use partnerActions.delete() from useNewSyncedData instead.');
            return true;
        },

        getPurchases: async () => {
            console.warn('⚠️ getPurchases is deprecated. Use usePurchases() from useNewSyncedData instead.');
            return [];
        },

        addPurchase: async (purchase: any) => {
            console.warn('⚠️ addPurchase is deprecated. Use purchaseActions.add() from useNewSyncedData instead.');
            return { id: 'deprecated', ...purchase };
        },

        updatePurchase: async (id: string, purchase: any) => {
            console.warn('⚠️ updatePurchase is deprecated. Use purchaseActions.update() from useNewSyncedData instead.');
            return { id, ...purchase };
        },

        deletePurchase: async (id: string) => {
            console.warn('⚠️ deletePurchase is deprecated. Use purchaseActions.delete() from useNewSyncedData instead.');
            return true;
        },

        getInvoices: async () => {
            console.warn('⚠️ getInvoices is deprecated. Use useInvoices() from useNewSyncedData instead.');
            return [];
        },

        addInvoice: async (invoice: any) => {
            console.warn('⚠️ addInvoice is deprecated. Use invoiceActions.add() from useNewSyncedData instead.');
            return { id: 'deprecated', ...invoice };
        },

        getPayments: async () => {
            console.warn('⚠️ getPayments is deprecated. Payments functionality needs to be implemented in fresh sync system.');
            return [];
        },

        addPayment: async (payment: any) => {
            console.warn('⚠️ addPayment is deprecated. Payments functionality needs to be implemented in fresh sync system.');
            return { id: 'deprecated', ...payment };
        },

        getCharges: async () => {
            console.warn('⚠️ getCharges is deprecated. Charges functionality needs to be implemented in fresh sync system.');
            return [];
        },

        addCharge: async (charge: any) => {
            console.warn('⚠️ addCharge is deprecated. Charges functionality needs to be implemented in fresh sync system.');
            return { id: 'deprecated', ...charge };
        }
    };

    return (
        <SimpleHybridContext.Provider value={contextValue}>
            {children}
        </SimpleHybridContext.Provider>
    );
};

export const useSimpleHybrid = (): SimpleHybridContextType => {
    const context = useContext(SimpleHybridContext);
    if (context === undefined) {
        throw new Error('useSimpleHybrid must be used within a SimpleHybridProvider');
    }
    return context;
};
