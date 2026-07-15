import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { WorkstationScanImportService, WorkstationScanProcessor, WorkstationScanStatus } from '../services/workstationScanService';

let schedulerTask: cron.Scheduled | null = null;

export function startWorkstationScanScheduler(prisma: PrismaClient, scanDir?: string): void {
  if (schedulerTask) {
    console.warn('Workstation scan scheduler is already running.');
    return;
  }

  const importService = new WorkstationScanImportService(prisma);
  const processor = new WorkstationScanProcessor(prisma, importService, scanDir);

  const scheduleTime = process.env.WORKSTATION_SCAN_CRON || '0 2 * * *';

  console.log(`Starting workstation scan scheduler with cron: ${scheduleTime}`);

  schedulerTask = cron.schedule(
    scheduleTime,
    async () => {
      console.log('Running scheduled workstation scan file processing...');
      try {
        const results = await processor.processPendingFiles();
        const successCount = results.filter((r) => r.success).length;
        const failCount = results.filter((r) => !r.success).length;
        console.log(`Workstation scan completed. Success: ${successCount}, Failed: ${failCount}`);
      } catch (error) {
        console.error('Workstation scan scheduler failed:', error);
      }
    },
    {
      timezone: process.env.TZ || 'Asia/Kolkata',
    }
  );

  console.log('Workstation scan scheduler started successfully.');
}

export function stopWorkstationScanScheduler(): void {
  if (schedulerTask) {
    schedulerTask.stop();
    schedulerTask = null;
    console.log('Workstation scan scheduler stopped.');
  }
}

export async function runWorkstationScanManually(prisma: PrismaClient, scanDir?: string): Promise<{ success: number; failed: number }> {
  const importService = new WorkstationScanImportService(prisma);
  const processor = new WorkstationScanProcessor(prisma, importService, scanDir);

  const results = await processor.processPendingFiles();
  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return { success: successCount, failed: failCount };
}
