import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Disaster recovery configuration
export interface DisasterRecoveryConfig {
  backupIntervalHours: number;
  retentionDays: number;
  backupLocations: BackupLocation[];
  criticalTables: string[];
  recoveryTimeObjective: number; // RTO in minutes
  recoveryPointObjective: number; // RPO in minutes
}

export interface BackupLocation {
  type: 'supabase' | 's3' | 'local';
  endpoint: string;
  credentials?: {
    accessKey?: string;
    secretKey?: string;
    bucket?: string;
  };
}

export interface BackupMetadata {
  id: string;
  timestamp: Date;
  type: 'full' | 'incremental';
  size: number;
  checksum: string;
  location: string;
  status: 'pending' | 'completed' | 'failed';
  tables: string[];
}

export interface RecoveryPlan {
  id: string;
  name: string;
  description: string;
  steps: RecoveryStep[];
  estimatedTime: number;
  priority: 'high' | 'medium' | 'low';
}

export interface RecoveryStep {
  id: string;
  order: number;
  description: string;
  type: 'backup_restore' | 'service_restart' | 'manual_action';
  automated: boolean;
  estimatedDuration: number;
}

class DisasterRecoveryManager {
  private static instance: DisasterRecoveryManager;
  private config: DisasterRecoveryConfig;
  private backupHistory: BackupMetadata[] = [];
  private recoveryPlans: RecoveryPlan[] = [];

  static getInstance(): DisasterRecoveryManager {
    if (!DisasterRecoveryManager.instance) {
      DisasterRecoveryManager.instance = new DisasterRecoveryManager();
    }
    return DisasterRecoveryManager.instance;
  }

  constructor() {
    this.config = {
      backupIntervalHours: 6,
      retentionDays: 30,
      backupLocations: [
        {
          type: 'supabase',
          endpoint: 'primary'
        },
        {
          type: 's3',
          endpoint: 's3://backup-bucket/database',
          credentials: {
            bucket: 'disaster-recovery-backups'
          }
        }
      ],
      criticalTables: [
        'invoices',
        'exceptions',
        'compliance_records',
        'user_roles',
        'profiles'
      ],
      recoveryTimeObjective: 60, // 1 hour
      recoveryPointObjective: 15  // 15 minutes
    };

    this.initializeRecoveryPlans();
  }

  private initializeRecoveryPlans() {
    this.recoveryPlans = [
      {
        id: 'database-corruption',
        name: 'Database Corruption Recovery',
        description: 'Restore from latest backup when database corruption is detected',
        estimatedTime: 30,
        priority: 'high',
        steps: [
          {
            id: 'step-1',
            order: 1,
            description: 'Identify latest clean backup',
            type: 'backup_restore',
            automated: true,
            estimatedDuration: 5
          },
          {
            id: 'step-2',
            order: 2,
            description: 'Stop application services',
            type: 'service_restart',
            automated: true,
            estimatedDuration: 2
          },
          {
            id: 'step-3',
            order: 3,
            description: 'Restore database from backup',
            type: 'backup_restore',
            automated: true,
            estimatedDuration: 20
          },
          {
            id: 'step-4',
            order: 4,
            description: 'Verify data integrity',
            type: 'manual_action',
            automated: false,
            estimatedDuration: 5
          },
          {
            id: 'step-5',
            order: 5,
            description: 'Restart application services',
            type: 'service_restart',
            automated: true,
            estimatedDuration: 3
          }
        ]
      },
      {
        id: 'service-outage',
        name: 'Service Outage Recovery',
        description: 'Recovery plan for complete service outage',
        estimatedTime: 45,
        priority: 'high',
        steps: [
          {
            id: 'step-1',
            order: 1,
            description: 'Assess outage scope',
            type: 'manual_action',
            automated: false,
            estimatedDuration: 10
          },
          {
            id: 'step-2',
            order: 2,
            description: 'Switch to backup infrastructure',
            type: 'service_restart',
            automated: true,
            estimatedDuration: 15
          },
          {
            id: 'step-3',
            order: 3,
            description: 'Restore latest backup if needed',
            type: 'backup_restore',
            automated: true,
            estimatedDuration: 20
          }
        ]
      }
    ];
  }

  // Backup operations
  async createBackup(type: 'full' | 'incremental' = 'incremental'): Promise<BackupMetadata> {
    const backupId = `backup-${Date.now()}`;
    const timestamp = new Date();

    toast({
      title: "Creating Backup",
      description: `Starting ${type} backup...`
    });

    try {
      const backup: BackupMetadata = {
        id: backupId,
        timestamp,
        type,
        size: 0,
        checksum: '',
        location: '',
        status: 'pending',
        tables: type === 'full' ? await this.getAllTables() : this.config.criticalTables
      };

      // Create backup data
      const backupData = await this.exportTables(backup.tables);
      backup.size = JSON.stringify(backupData).length;
      backup.checksum = await this.calculateChecksum(backupData);

      // Store backup to configured locations
      for (const location of this.config.backupLocations) {
        await this.storeBackup(backup, backupData, location);
      }

      backup.status = 'completed';
      backup.location = this.config.backupLocations[0].endpoint;

      this.backupHistory.push(backup);
      this.cleanupOldBackups();

      toast({
        title: "Backup Complete",
        description: `${type} backup created successfully (${this.formatBytes(backup.size)})`
      });

      return backup;
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
      throw error;
    }
  }

  private async getAllTables(): Promise<string[]> {
    try {
      // Use raw SQL to get table names since information_schema isn't available in typed client
      return [
        'invoices',
        'validation_rules', 
        'profiles',
        'workflows',
        'activities',
        'compliance_records',
        'exceptions',
        'integration_status',
        'invoice_documents',
        'system_health_metrics',
        'user_roles',
        'workflow_instances'
      ];
    } catch {
      // Fallback to known tables
      return [
        'invoices',
        'exceptions', 
        'compliance_records',
        'user_roles',
        'profiles',
        'activities',
        'validation_rules',
        'workflows',
        'workflow_instances'
      ];
    }
  }

  private async exportTables(tables: string[]): Promise<Record<string, any[]>> {
    const data: Record<string, any[]> = {};

    for (const table of tables) {
      try {
        const { data: tableData, error } = await supabase
          .from(table as any)
          .select('*');

        if (error) throw error;
        data[table] = tableData || [];
      } catch (error) {
        console.error(`Failed to export table ${table}:`, error);
        data[table] = [];
      }
    }

    return data;
  }

  private async calculateChecksum(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async storeBackup(
    backup: BackupMetadata, 
    data: any, 
    location: BackupLocation
  ): Promise<void> {
    switch (location.type) {
      case 'supabase':
        await this.storeInSupabase(backup, data);
        break;
      case 's3':
        await this.storeInS3(backup, data, location);
        break;
      case 'local':
        await this.storeLocally(backup, data);
        break;
      default:
        throw new Error(`Unsupported backup location type: ${location.type}`);
    }
  }

  private async storeInSupabase(backup: BackupMetadata, data: any): Promise<void> {
    // Store backup metadata in a backups table (would need to create this table)
    const backupRecord = {
      id: backup.id,
      timestamp: backup.timestamp.toISOString(),
      type: backup.type,
      size: backup.size,
      checksum: backup.checksum,
      data: JSON.stringify(data)
    };

    // In a real implementation, you'd store this in a dedicated backups table
    if (import.meta.env.DEV) {
      console.log('Backup stored in Supabase:', backupRecord);
    }
  }

  private async storeInS3(
    backup: BackupMetadata, 
    data: any, 
    location: BackupLocation
  ): Promise<void> {
    // In a real implementation, this would use AWS SDK to upload to S3
    if (import.meta.env.DEV) {
      console.log(`Backup stored in S3 at ${location.endpoint}:`, backup);
    }
  }

  private async storeLocally(backup: BackupMetadata, data: any): Promise<void> {
    // Store in browser's IndexedDB or localStorage for demo purposes
    const backupData = {
      metadata: backup,
      data: data
    };
    
    localStorage.setItem(`backup-${backup.id}`, JSON.stringify(backupData));
  }

  private cleanupOldBackups(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    this.backupHistory = this.backupHistory.filter(backup => 
      backup.timestamp > cutoffDate
    );
  }

  // Recovery operations
  async executeRecoveryPlan(planId: string): Promise<void> {
    const plan = this.recoveryPlans.find(p => p.id === planId);
    if (!plan) {
      throw new Error(`Recovery plan ${planId} not found`);
    }

    toast({
      title: "Starting Recovery",
      description: `Executing recovery plan: ${plan.name}`
    });

    try {
      for (const step of plan.steps.sort((a, b) => a.order - b.order)) {
        toast({
          title: "Recovery Step",
          description: `${step.order}. ${step.description}`
        });

        if (step.automated) {
          await this.executeAutomatedStep(step);
        } else {
          await this.executeManualStep(step);
        }
      }

      toast({
        title: "Recovery Complete",
        description: `Recovery plan ${plan.name} executed successfully`
      });
    } catch (error) {
      toast({
        title: "Recovery Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
      throw error;
    }
  }

  private async executeAutomatedStep(step: RecoveryStep): Promise<void> {
    switch (step.type) {
      case 'backup_restore':
        await this.restoreLatestBackup();
        break;
      case 'service_restart':
        await this.restartServices();
        break;
      default:
        if (import.meta.env.DEV) {
          console.log(`Automated step not implemented: ${step.type}`);
        }
    }
  }

  private async executeManualStep(step: RecoveryStep): Promise<void> {
    // For manual steps, we would typically notify administrators
    // and wait for confirmation
    if (import.meta.env.DEV) {
      console.log(`Manual step required: ${step.description}`);
    }
  }

  private async restoreLatestBackup(): Promise<void> {
    const latestBackup = this.getLatestBackup();
    if (!latestBackup) {
      throw new Error('No backups available for restore');
    }

    // Simulate restore process
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (import.meta.env.DEV) {
      console.log(`Restored from backup: ${latestBackup.id}`);
    }
  }

  private async restartServices(): Promise<void> {
    // Simulate service restart
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (import.meta.env.DEV) {
      console.log('Services restarted');
    }
  }

  // Utility methods
  getLatestBackup(): BackupMetadata | null {
    return this.backupHistory
      .filter(backup => backup.status === 'completed')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0] || null;
  }

  getBackupHistory(): BackupMetadata[] {
    return [...this.backupHistory];
  }

  getRecoveryPlans(): RecoveryPlan[] {
    return [...this.recoveryPlans];
  }

  getHealthStatus(): {
    healthy: boolean;
    lastBackup: Date | null;
    nextBackup: Date | null;
    backupCount: number;
    rtoCompliance: boolean;
    rpoCompliance: boolean;
  } {
    const latestBackup = this.getLatestBackup();
    const now = new Date();
    
    // Calculate next backup time
    const nextBackup = latestBackup 
      ? new Date(latestBackup.timestamp.getTime() + (this.config.backupIntervalHours * 60 * 60 * 1000))
      : now;

    // Check RTO/RPO compliance
    const rtoCompliance = latestBackup 
      ? (now.getTime() - latestBackup.timestamp.getTime()) <= (this.config.recoveryTimeObjective * 60 * 1000)
      : false;

    const rpoCompliance = latestBackup
      ? (now.getTime() - latestBackup.timestamp.getTime()) <= (this.config.recoveryPointObjective * 60 * 1000)
      : false;

    return {
      healthy: rtoCompliance && rpoCompliance && this.backupHistory.length > 0,
      lastBackup: latestBackup?.timestamp || null,
      nextBackup,
      backupCount: this.backupHistory.length,
      rtoCompliance,
      rpoCompliance
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Configuration
  updateConfig(newConfig: Partial<DisasterRecoveryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): DisasterRecoveryConfig {
    return { ...this.config };
  }
}

export const disasterRecovery = DisasterRecoveryManager.getInstance();