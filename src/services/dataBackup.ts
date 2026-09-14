import { KhataCustomer, DailyStockLog, VendorProfile } from '../types';

export interface SanthaiBackupData {
  version: string;
  exportedAt: string;
  vendorProfile: VendorProfile;
  khataCustomers: KhataCustomer[];
  stockLogs: DailyStockLog[];
  vendorPrices: Record<string, number>;
}

export class DataBackupService {
  /**
   * Generates and downloads a complete JSON backup of the vendor's stall data
   */
  public static exportCompleteBackup(
    vendorProfile: VendorProfile,
    khataCustomers: KhataCustomer[],
    stockLogs: DailyStockLog[],
    vendorPrices: Record<string, number>
  ): void {
    const backup: SanthaiBackupData = {
      version: '1.2.0',
      exportedAt: new Date().toISOString(),
      vendorProfile,
      khataCustomers,
      stockLogs,
      vendorPrices,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `santhai_stall_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Save timestamp of last backup
    try {
      localStorage.setItem('santhai_last_backup', new Date().toISOString());
    } catch {}
  }

  /**
   * Validates and imports a JSON backup
   */
  public static parseBackupJSON(jsonStr: string): SanthaiBackupData {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.khataCustomers || !Array.isArray(parsed.khataCustomers)) {
        throw new Error('Invalid backup: Missing Khata ledger records.');
      }
      if (!parsed.stockLogs || !Array.isArray(parsed.stockLogs)) {
        throw new Error('Invalid backup: Missing stock logs.');
      }
      return parsed as SanthaiBackupData;
    } catch (e: unknown) {
      const err = e as Error;
      throw new Error(err?.message || 'Failed to read backup file. Ensure it is a valid SanthAI JSON file.');
    }
  }

  /**
   * Generates a downloadable CSV of all Khata credit accounts
   */
  public static exportKhataCSV(customers: KhataCustomer[]): void {
    const headers = [
      'Customer Name',
      'Phone Number',
      'Outstanding Balance (INR)',
      'Credit Limit (INR)',
      'Risk Level',
      'Risk Score',
      'On-Time Ratio',
      'Transaction Count',
      'Last Purchase Date',
      'Notes'
    ];
    const rows = customers.map(c => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phone}"`,
      c.totalDue,
      c.creditLimit,
      `"${c.riskLevel}"`,
      c.riskScore,
      `"${(c.onTimePaymentRatio * 100).toFixed(0)}%"`,
      c.transactions.length,
      `"${c.lastPurchaseDate}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `santhai_khata_ledger_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Generates a downloadable CSV of all stock logs & produce inventory
   */
  public static exportStockCSV(logs: DailyStockLog[]): void {
    const headers = ['Log Date', 'Vegetable', 'Received (kg)', 'Sold (kg)', 'Unsold Stock (kg)', 'Spoilage/Waste (kg)', 'Sales Ratio (%)'];
    const rows = logs.map(l => {
      const ratio = l.receivedKg > 0 ? ((l.soldKg / l.receivedKg) * 100).toFixed(1) : '0';
      return [
        `"${l.date}"`,
        `"${l.commodity}"`,
        l.receivedKg,
        l.soldKg,
        l.unsoldKg,
        l.wasteKg,
        `"${ratio}%"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `santhai_stock_history_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Computes current local storage health
   */
  public static getStorageHealth(): {
    isHealthy: boolean;
    lastBackup: string | null;
    totalBytes: number;
  } {
    let totalBytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('santhai_')) {
          const val = localStorage.getItem(key) || '';
          totalBytes += (key.length + val.length) * 2;
        }
      }
      const lastBackup = localStorage.getItem('santhai_last_backup');
      return {
        isHealthy: true,
        lastBackup,
        totalBytes
      };
    } catch {
      return { isHealthy: false, lastBackup: null, totalBytes: 0 };
    }
  }
}
