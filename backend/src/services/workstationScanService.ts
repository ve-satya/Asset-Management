import { PrismaClient } from '@prisma/client';
import { XMLParser } from 'fast-xml-parser';
import * as fs from 'fs';
import * as path from 'path';

export enum WorkstationScanStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  FAILED = 'FAILED',
}

export interface ProcessingResult {
  fileId: number;
  fileName: string;
  success: boolean;
  error?: string;
}

type ParsedNode = Record<string, any>;

function getAttr(obj: ParsedNode | undefined, key: string): string | undefined {
  if (!obj) return undefined;
  return obj[key] ?? obj[`@_${key}`];
}

function hasKey(obj: ParsedNode | undefined, key: string): boolean {
  if (!obj) return false;
  return !!(obj[key] ?? obj[`@_${key}`]);
}

export class WorkstationScanImportService {
  constructor(private readonly prisma: PrismaClient) {}

  private defaultProductTypeId: number | undefined;

  private async resolveDefaultProductTypeId(): Promise<number> {
    if (this.defaultProductTypeId) return this.defaultProductTypeId;
    const desktopType = await this.prisma.productType.findFirst({
      where: { apiName: 'custom_asset_desktop' },
      select: { id: true },
    });
    this.defaultProductTypeId = desktopType?.id ?? 1;
    return this.defaultProductTypeId;
  }

  async processXMLNodes(nodes: ParsedNode[]): Promise<void> {
    for (const node of nodes) {
      await this.processNode(node);
    }
  }

  private async processNode(node: ParsedNode): Promise<void> {
    const computerName = getAttr(node, 'ComputerName');
    const serviceTag = getAttr(node, 'ServiceTag');
    const macAddress = getAttr(node, 'MacAddress')?.replace('###', '');

    if (!serviceTag && !macAddress) {
      console.warn('Node missing ServiceTag and MacAddress, skipping');
      return;
    }

    const hardwareInfo = node.Hardware_Info;
    if (!hardwareInfo) {
      console.warn(`No Hardware_Info found for ${computerName}`);
      return;
    }

    const asset = await this.upsertAsset(serviceTag, computerName, macAddress, hardwareInfo);
    const assetId = asset.id;

    await this.upsertComputerDetails(assetId, hardwareInfo);
    await this.upsertProcessors(assetId, hardwareInfo.CPU);
    await this.upsertMemoryModules(assetId, hardwareInfo.MemoryModule);
    await this.upsertHardDisks(assetId, hardwareInfo.HardDisk);
    await this.upsertLogicalDrives(assetId, hardwareInfo.LogicDrive);
    await this.upsertPhysicalDrives(assetId, hardwareInfo.PhysicalDrive);
    await this.upsertKeyboard(assetId, hardwareInfo.KeyBoard);
    await this.upsertMouse(assetId, hardwareInfo.Mouse);
    await this.upsertMonitors(assetId, hardwareInfo.Monitors);
    await this.upsertNetworkAdapters(assetId, hardwareInfo.Network);
    await this.upsertSoundCards(assetId, hardwareInfo.SoundCard);
    await this.upsertVideoCards(assetId, hardwareInfo.VideoCard);
    await this.upsertPorts(assetId, hardwareInfo.SerialPort, hardwareInfo.ParallelPort);
    await this.upsertUsbControllers(assetId, hardwareInfo.USB);
    await this.upsertPrinters(assetId, hardwareInfo.Printer);
  }

  private async upsertAsset(serviceTag: string | undefined, computerName: string, macAddress: string, hardwareInfo: ParsedNode): Promise<any> {
    const computer = hardwareInfo.Computer || {};
    const os = hardwareInfo.OperatingSystem || {};

    const data = {
      name: computerName,
      macAddress,
      osName: getAttr(os, 'Name'),
      osVersion: getAttr(os, 'Version'),
      osBuildNumber: getAttr(os, 'BuildNumber'),
      ram: getAttr(computer, 'TotalPhysicalMemory'),
      manufacturer: getAttr(computer, 'Manufacturer'),
      smbiosVersion: getAttr(computer, 'SMBiosVersion'),
      biosVersion: getAttr(computer, 'BiosVersion'),
      biosManufacturer: getAttr(computer, 'BiosManufacturer'),
      biosDate: getAttr(computer, 'BiosDate'),
      domain: getAttr(computer, 'DomainName'),
      lastScanStatus: 'SUCCESS',
      scanState: 'SCANNED',
    };

    let existing = await this.prisma.asset.findFirst({ where: { serviceTag } });
    if (!existing && macAddress) {
      existing = await this.prisma.asset.findFirst({ where: { macAddress } });
    }

    if (existing) {
      const updateData: any = { ...data };
      const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

      if (!existing.serviceTag && serviceTag) {
        updateData.serviceTag = serviceTag;
        updateData.assetTag = serviceTag;
      }

      const fieldsToTrack = [
        { key: 'name', old: existing.name, new: data.name },
        { key: 'macAddress', old: existing.macAddress, new: data.macAddress },
        { key: 'osName', old: existing.osName, new: data.osName },
        { key: 'osVersion', old: existing.osVersion, new: data.osVersion },
        { key: 'osBuildNumber', old: existing.osBuildNumber, new: data.osBuildNumber },
        { key: 'ram', old: existing.ram, new: data.ram },
        { key: 'manufacturer', old: existing.manufacturer, new: data.manufacturer },
        { key: 'smbiosVersion', old: existing.smbiosVersion, new: data.smbiosVersion },
        { key: 'biosVersion', old: existing.biosVersion, new: data.biosVersion },
        { key: 'biosManufacturer', old: existing.biosManufacturer, new: data.biosManufacturer },
        { key: 'biosDate', old: existing.biosDate, new: data.biosDate },
        { key: 'domain', old: existing.domain, new: data.domain },
        { key: 'lastScanStatus', old: existing.lastScanStatus, new: data.lastScanStatus },
        { key: 'scanState', old: existing.scanState, new: data.scanState },
      ];

      const hasChanges = fieldsToTrack.some(f => f.old !== f.new);
      if (hasChanges) {
        await this.prisma.asset.update({ where: { id: existing.id }, data: updateData });

        await this.prisma.assetHistory.createMany({
          data: fieldsToTrack
            .filter(f => f.old !== f.new)
            .map(f => ({
              assetId: existing.id,
              actionType: 'UPDATE',
              fieldName: f.key,
              oldValue: String(f.old ?? ''),
              newValue: String(f.new ?? ''),
            })),
        });
      }

      return existing;
    }

    const newNode = await this.prisma.asset.create({
      data: { ...data, serviceTag, assetTag: serviceTag, productTypeId: await this.resolveDefaultProductTypeId() },
    });

    await this.prisma.assetHistory.create({
      data: {
        assetId: newNode.id,
        actionType: 'CREATE',
        comments: 'Asset created from workstation scan import',
      },
    });

    return newNode;
  }

  private updateAndTrackChange<T>(
    oldValue: T,
    newValue: T,
    tableName: string,
    fieldName: string,
    changesDescription: string[],
  ): { changed: boolean; oldValue: T; newValue: T } {
    let old = oldValue;
    let newVal = newValue;

    if (oldValue instanceof Date && newValue instanceof Date) {
      old = (oldValue.getTime() as unknown) as T;
      newVal = (newValue.getTime() as unknown) as T;
    }

    if (old !== newVal) {
      changesDescription.push(`${tableName}.${fieldName}: ${oldValue} -> ${newValue}`);
      return { changed: true, oldValue, newValue };
    }
    return { changed: false, oldValue, newValue };
  }

  private parseDate(value: any): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  private async findAssetByNode(nodeElement: ParsedNode): Promise<any | null> {
    const assetTag = getAttr(nodeElement, 'AssetTag') || getAttr(nodeElement, 'ServiceTag');
    if (assetTag) {
      const existing = await this.prisma.asset.findFirst({ where: { assetTag } });
      if (existing) return existing;
    }
    const computerName = getAttr(nodeElement, 'ComputerName');
    if (computerName) {
      const existing = await this.prisma.asset.findFirst({ where: { name: computerName } });
      if (existing) return existing;
    }
    const serialNumber = getAttr(nodeElement, 'SerialNumber');
    if (serialNumber) {
      const existing = await this.prisma.asset.findFirst({ where: { orgSerialNumber: serialNumber } });
      if (existing) return existing;
    }
    return null;
  }

  private async createAsset(data: ParsedNode): Promise<any> {
    const productTypeId = await this.resolveDefaultProductTypeId();

    const newNode = await this.prisma.asset.create({
      data: {
        productTypeId,
        name: getAttr(data, 'ComputerName') ?? null,
        assetTag: getAttr(data, 'AssetTag') ?? getAttr(data, 'ServiceTag') ?? null,
        orgSerialNumber: getAttr(data, 'SerialNumber') ?? null,
        productId: getAttr(data, 'AssetProductId') ?? null,
        vendorId: getAttr(data, 'AssetVendorId') ?? null,
        assetStateId: getAttr(data, 'AssetStateId') ?? null,
        department: getAttr(data, 'DepartmentId') ?? null,
        associatedToAssets: getAttr(data, 'AssociatedTo') ?? null,
        barcode: getAttr(data, 'BarCodeQRCode') ?? null,
        siteId: getAttr(data, 'SiteInstanceId') ?? null,
        assignedUserId: getAttr(data, 'UserId') ?? null,
        acquisitionDate: this.parseDate(getAttr(data, 'AcquisionDate')),
        expiryDate: this.parseDate(getAttr(data, 'ExpiryDate')),
        warrantyExpiryDate: this.parseDate(getAttr(data, 'WarrantyExpiryDate')),
        purchaseCost: getAttr(data, 'PurchaseCost') ?? null,
        location: getAttr(data, 'Location') ?? null,
        stateComments: getAttr(data, 'StateComments') ?? null,
        lastScanTime: this.parseDate(getAttr(data, 'LastScanTime')),
        retainUserSiteAsAssetSite: getAttr(data, 'IsRetain') ?? null,
      },
    });

    await this.prisma.assetHistory.create({
      data: {
        assetId: newNode.id,
        actionType: 'CREATE',
        comments: 'Asset created from workstation scan import',
      },
    });

    return newNode;
  }

  private async updateAssetIfChanged(
    existingNode: any,
    nodeElement: ParsedNode,
    nodeId: number,
  ): Promise<void> {
    const changesDescription: string[] = [];
    const fieldChanges: Array<{ field: string; oldValue: any; newValue: any }> = [];
    let updated = false;

    if (nodeId > 0 && existingNode) {
      const nameChange = this.updateAndTrackChange(existingNode.name ?? null, getAttr(nodeElement, 'ComputerName') ?? null, 'Asset', 'name', changesDescription);
      if (nameChange.changed) fieldChanges.push({ field: 'name', oldValue: nameChange.oldValue, newValue: nameChange.newValue });
      updated ||= nameChange.changed;

      const assetTagChange = this.updateAndTrackChange(existingNode.assetTag ?? null, getAttr(nodeElement, 'AssetTag') ?? getAttr(nodeElement, 'ServiceTag') ?? null, 'Asset', 'assetTag', changesDescription);
      if (assetTagChange.changed) fieldChanges.push({ field: 'assetTag', oldValue: assetTagChange.oldValue, newValue: assetTagChange.newValue });
      updated ||= assetTagChange.changed;

      const orgSerialChange = this.updateAndTrackChange(existingNode.orgSerialNumber ?? null, getAttr(nodeElement, 'SerialNumber') ?? null, 'Asset', 'orgSerialNumber', changesDescription);
      if (orgSerialChange.changed) fieldChanges.push({ field: 'orgSerialNumber', oldValue: orgSerialChange.oldValue, newValue: orgSerialChange.newValue });
      updated ||= orgSerialChange.changed;

      const productIdChange = this.updateAndTrackChange(existingNode.productId ?? null, getAttr(nodeElement, 'AssetProductId') ?? null, 'Asset', 'productId', changesDescription);
      if (productIdChange.changed) fieldChanges.push({ field: 'productId', oldValue: productIdChange.oldValue, newValue: productIdChange.newValue });
      updated ||= productIdChange.changed;

      const productTypeIdChange = this.updateAndTrackChange(existingNode.productTypeId ?? null, getAttr(nodeElement, 'AssetProductTypeId') ?? null, 'Asset', 'productTypeId', changesDescription);
      if (productTypeIdChange.changed) fieldChanges.push({ field: 'productTypeId', oldValue: productTypeIdChange.oldValue, newValue: productTypeIdChange.newValue });
      updated ||= productTypeIdChange.changed;

      const vendorIdChange = this.updateAndTrackChange(existingNode.vendorId ?? null, getAttr(nodeElement, 'AssetVendorId') ?? null, 'Asset', 'vendorId', changesDescription);
      if (vendorIdChange.changed) fieldChanges.push({ field: 'vendorId', oldValue: vendorIdChange.oldValue, newValue: vendorIdChange.newValue });
      updated ||= vendorIdChange.changed;

      const assetStateIdChange = this.updateAndTrackChange(existingNode.assetStateId ?? null, getAttr(nodeElement, 'AssetStateId') ?? null, 'Asset', 'assetStateId', changesDescription);
      if (assetStateIdChange.changed) fieldChanges.push({ field: 'assetStateId', oldValue: assetStateIdChange.oldValue, newValue: assetStateIdChange.newValue });
      updated ||= assetStateIdChange.changed;

      const departmentChange = this.updateAndTrackChange(existingNode.department ?? null, getAttr(nodeElement, 'DepartmentId') ?? null, 'Asset', 'department', changesDescription);
      if (departmentChange.changed) fieldChanges.push({ field: 'department', oldValue: departmentChange.oldValue, newValue: departmentChange.newValue });
      updated ||= departmentChange.changed;

      const associatedToAssetsChange = this.updateAndTrackChange(existingNode.associatedToAssets ?? null, getAttr(nodeElement, 'AssociatedTo') ?? null, 'Asset', 'associatedToAssets', changesDescription);
      if (associatedToAssetsChange.changed) fieldChanges.push({ field: 'associatedToAssets', oldValue: associatedToAssetsChange.oldValue, newValue: associatedToAssetsChange.newValue });
      updated ||= associatedToAssetsChange.changed;

      const barcodeChange = this.updateAndTrackChange(existingNode.barcode ?? null, getAttr(nodeElement, 'BarCodeQRCode') ?? null, 'Asset', 'barcode', changesDescription);
      if (barcodeChange.changed) fieldChanges.push({ field: 'barcode', oldValue: barcodeChange.oldValue, newValue: barcodeChange.newValue });
      updated ||= barcodeChange.changed;

      const siteIdChange = this.updateAndTrackChange(existingNode.siteId ?? null, getAttr(nodeElement, 'SiteInstanceId') ?? null, 'Asset', 'siteId', changesDescription);
      if (siteIdChange.changed) fieldChanges.push({ field: 'siteId', oldValue: siteIdChange.oldValue, newValue: siteIdChange.newValue });
      updated ||= siteIdChange.changed;

      const assignedUserIdChange = this.updateAndTrackChange(existingNode.assignedUserId ?? null, getAttr(nodeElement, 'UserId') ?? null, 'Asset', 'assignedUserId', changesDescription);
      if (assignedUserIdChange.changed) fieldChanges.push({ field: 'assignedUserId', oldValue: assignedUserIdChange.oldValue, newValue: assignedUserIdChange.newValue });
      updated ||= assignedUserIdChange.changed;

      const acquisitionDateChange = this.updateAndTrackChange(existingNode.acquisitionDate ?? null, this.parseDate(getAttr(nodeElement, 'AcquisionDate')), 'Asset', 'acquisitionDate', changesDescription);
      if (acquisitionDateChange.changed) fieldChanges.push({ field: 'acquisitionDate', oldValue: acquisitionDateChange.oldValue, newValue: acquisitionDateChange.newValue });
      updated ||= acquisitionDateChange.changed;

      const expiryDateChange = this.updateAndTrackChange(existingNode.expiryDate ?? null, this.parseDate(getAttr(nodeElement, 'ExpiryDate')), 'Asset', 'expiryDate', changesDescription);
      if (expiryDateChange.changed) fieldChanges.push({ field: 'expiryDate', oldValue: expiryDateChange.oldValue, newValue: expiryDateChange.newValue });
      updated ||= expiryDateChange.changed;

      const warrantyExpiryDateChange = this.updateAndTrackChange(existingNode.warrantyExpiryDate ?? null, this.parseDate(getAttr(nodeElement, 'WarrantyExpiryDate')), 'Asset', 'warrantyExpiryDate', changesDescription);
      if (warrantyExpiryDateChange.changed) fieldChanges.push({ field: 'warrantyExpiryDate', oldValue: warrantyExpiryDateChange.oldValue, newValue: warrantyExpiryDateChange.newValue });
      updated ||= warrantyExpiryDateChange.changed;

      const purchaseCostChange = this.updateAndTrackChange(existingNode.purchaseCost ?? null, getAttr(nodeElement, 'PurchaseCost') ?? null, 'Asset', 'purchaseCost', changesDescription);
      if (purchaseCostChange.changed) fieldChanges.push({ field: 'purchaseCost', oldValue: purchaseCostChange.oldValue, newValue: purchaseCostChange.newValue });
      updated ||= purchaseCostChange.changed;

      const locationChange = this.updateAndTrackChange(existingNode.location ?? null, getAttr(nodeElement, 'Location') ?? null, 'Asset', 'location', changesDescription);
      if (locationChange.changed) fieldChanges.push({ field: 'location', oldValue: locationChange.oldValue, newValue: locationChange.newValue });
      updated ||= locationChange.changed;

      const stateCommentsChange = this.updateAndTrackChange(existingNode.stateComments ?? null, getAttr(nodeElement, 'StateComments') ?? null, 'Asset', 'stateComments', changesDescription);
      if (stateCommentsChange.changed) fieldChanges.push({ field: 'stateComments', oldValue: stateCommentsChange.oldValue, newValue: stateCommentsChange.newValue });
      updated ||= stateCommentsChange.changed;

      const lastScanTimeChange = this.updateAndTrackChange(existingNode.lastScanTime ?? null, this.parseDate(getAttr(nodeElement, 'LastScanTime')), 'Asset', 'lastScanTime', changesDescription);
      if (lastScanTimeChange.changed) fieldChanges.push({ field: 'lastScanTime', oldValue: lastScanTimeChange.oldValue, newValue: lastScanTimeChange.newValue });
      updated ||= lastScanTimeChange.changed;

      const retainUserSiteAsAssetSiteChange = this.updateAndTrackChange(existingNode.retainUserSiteAsAssetSite ?? null, getAttr(nodeElement, 'IsRetain') ?? null, 'Asset', 'retainUserSiteAsAssetSite', changesDescription);
      if (retainUserSiteAsAssetSiteChange.changed) fieldChanges.push({ field: 'retainUserSiteAsAssetSite', oldValue: retainUserSiteAsAssetSiteChange.oldValue, newValue: retainUserSiteAsAssetSiteChange.newValue });
      updated ||= retainUserSiteAsAssetSiteChange.changed;

      if (updated) {
        await this.prisma.asset.update({
          where: { id: nodeId },
          data: {
            name: getAttr(nodeElement, 'ComputerName') ?? null,
            assetTag: getAttr(nodeElement, 'AssetTag') ?? getAttr(nodeElement, 'ServiceTag') ?? null,
            orgSerialNumber: getAttr(nodeElement, 'SerialNumber') ?? null,
            productId: getAttr(nodeElement, 'AssetProductId') ?? null,
            productTypeId: getAttr(nodeElement, 'AssetProductTypeId') ?? null,
            vendorId: getAttr(nodeElement, 'AssetVendorId') ?? null,
            assetStateId: getAttr(nodeElement, 'AssetStateId') ?? null,
            department: getAttr(nodeElement, 'DepartmentId') ?? null,
            associatedToAssets: getAttr(nodeElement, 'AssociatedTo') ?? null,
            barcode: getAttr(nodeElement, 'BarCodeQRCode') ?? null,
            siteId: getAttr(nodeElement, 'SiteInstanceId') ?? null,
            assignedUserId: getAttr(nodeElement, 'UserId') ?? null,
            acquisitionDate: this.parseDate(getAttr(nodeElement, 'AcquisionDate')),
            expiryDate: this.parseDate(getAttr(nodeElement, 'ExpiryDate')),
            warrantyExpiryDate: this.parseDate(getAttr(nodeElement, 'WarrantyExpiryDate')),
            purchaseCost: getAttr(nodeElement, 'PurchaseCost') ?? null,
            location: getAttr(nodeElement, 'Location') ?? null,
            stateComments: getAttr(nodeElement, 'StateComments') ?? null,
            lastScanTime: this.parseDate(getAttr(nodeElement, 'LastScanTime')),
            retainUserSiteAsAssetSite: getAttr(nodeElement, 'IsRetain') ?? null,
          },
        });

        await this.prisma.assetHistory.createMany({
          data: fieldChanges.map(change => ({
            assetId: nodeId,
            actionType: 'UPDATE',
            fieldName: change.field,
            oldValue: String(change.oldValue ?? ''),
            newValue: String(change.newValue ?? ''),
          })),
        });
      }
    }
  }

  private async upsertAssetFromNode(nodeElement: ParsedNode): Promise<any> {
    const asset = await this.findAssetByNode(nodeElement);
    if (!asset) {
      return await this.createAsset(nodeElement);
    }
    await this.updateAssetIfChanged(asset, nodeElement, asset.id);
    return asset;
  }

  private async upsertComputerDetails(assetId: number, hardwareInfo: ParsedNode): Promise<void> {
    const computer = hardwareInfo.Computer || {};
    const os = hardwareInfo.OperatingSystem || {};

    const data = {
      assetId,
      serviceTag: getAttr(computer, 'ServiceTag'),
      totalMemory: getAttr(computer, 'TotalPhysicalMemory'),
      totalSlots: getAttr(computer, 'MemorySlotsCount'),
      operatingSystem: getAttr(os, 'Name'),
      osVersion: getAttr(os, 'Version'),
      domain: getAttr(computer, 'DomainName'),
      biosDate: getAttr(computer, 'BiosDate'),
      smbiosVersion: getAttr(computer, 'SMBiosVersion'),
      biosVersion: getAttr(computer, 'BiosVersion'),
      biosManufacturer: getAttr(computer, 'BiosManufacturer'),
    };

    const existing = await this.prisma.assetComputerDetails.findUnique({ where: { assetId } });
    if (existing) {
      await this.prisma.assetComputerDetails.update({ where: { assetId }, data });
    } else {
      await this.prisma.assetComputerDetails.create({ data });
    }
  }

  private async upsertProcessors(assetId: number, cpuNode: ParsedNode | undefined): Promise<void> {
    if (!cpuNode) return;

    const infos = cpuNode.CPU_Info;
    const cpuInfos = Array.isArray(infos) ? infos : infos ? [infos] : [];

    const existing = await this.prisma.assetProcessor.findMany({ where: { assetId } });

    const toAdd = cpuInfos.filter((i: any) => hasKey(i, 'CPUName') && !existing.some((e) => e.cpuModel === getAttr(i, 'CPUName')));
    for (const item of toAdd) {
      await this.prisma.assetProcessor.create({
        data: {
          assetId,
          cpuModel: getAttr(item, 'CPUName'),
          manufacturer: getAttr(item, 'CPUManufacturer'),
          numberOfCores: getAttr(item, 'NumberOfCores'),
        },
      });
    }

    const toDelete = existing.filter((e) => !cpuInfos.some((i: any) => hasKey(i, 'CPUName') && e.cpuModel === getAttr(i, 'CPUName')));
    for (const item of toDelete) {
      await this.prisma.assetProcessor.delete({ where: { id: item.id } });
    }

    for (const e of existing) {
      const updated = cpuInfos.find((i: any) => hasKey(i, 'CPUName') && e.cpuModel === getAttr(i, 'CPUName'));
      if (updated) {
        await this.prisma.assetProcessor.update({
          where: { id: e.id },
          data: {
            cpuModel: getAttr(updated, 'CPUName'),
            manufacturer: getAttr(updated, 'CPUManufacturer'),
            numberOfCores: getAttr(updated, 'NumberOfCores'),
          },
        });
      }
    }
  }

  private async upsertMemoryModules(assetId: number, memoryNode: ParsedNode | undefined): Promise<void> {
    if (!memoryNode) return;

    const infos = memoryNode.MemoryModule_Info;
    const memoryInfos = Array.isArray(infos) ? infos : infos ? [infos] : [];

    const existing = await this.prisma.assetMemoryModule.findMany({ where: { assetId } });

    const toAdd = memoryInfos.filter((i: any) => hasKey(i, 'Name') && !existing.some((e) => e.moduleTag === getAttr(i, 'Name')));
    for (const item of toAdd) {
      await this.prisma.assetMemoryModule.create({
        data: {
          assetId,
          moduleTag: getAttr(item, 'Name'),
          capacity: getAttr(item, 'Capacity'),
          bankLabel: getAttr(item, 'BankLabel'),
          socket: getAttr(item, 'DeviceLocator'),
        },
      });
    }

    const toDelete = existing.filter((e) => !memoryInfos.some((i: any) => hasKey(i, 'Name') && e.moduleTag === getAttr(i, 'Name')));
    for (const item of toDelete) {
      await this.prisma.assetMemoryModule.delete({ where: { id: item.id } });
    }

    for (const e of existing) {
      const updated = memoryInfos.find((i: any) => hasKey(i, 'Name') && e.moduleTag === getAttr(i, 'Name'));
      if (updated) {
        await this.prisma.assetMemoryModule.update({
          where: { id: e.id },
          data: {
            moduleTag: getAttr(updated, 'Name'),
            capacity: getAttr(updated, 'Capacity'),
            bankLabel: getAttr(updated, 'BankLabel'),
            socket: getAttr(updated, 'DeviceLocator'),
          },
        });
      }
    }
  }

  private async upsertHardDisks(assetId: number, diskNode: ParsedNode | undefined): Promise<void> {
    if (!diskNode) return;

    const infos = diskNode.HardDisk_Info;
    const diskInfos = Array.isArray(infos) ? infos : infos ? [infos] : [];

    const existing = await this.prisma.assetHardDisk.findMany({ where: { assetId } });

    const toAdd = diskInfos.filter((i: any) => hasKey(i, 'HDSerialNumber') && !existing.some((e) => e.serialNumber === getAttr(i, 'HDSerialNumber')));
    for (const item of toAdd) {
      await this.prisma.assetHardDisk.create({
        data: {
          assetId,
          model: getAttr(item, 'HDName'),
          serialNumber: getAttr(item, 'HDSerialNumber'),
          capacity: getAttr(item, 'HDSize'),
          manufacturer: getAttr(item, 'HDManufacturer'),
        },
      });
    }

    const toDelete = existing.filter((e) => !diskInfos.some((i: any) => hasKey(i, 'HDSerialNumber') && e.serialNumber === getAttr(i, 'HDSerialNumber')));
    for (const item of toDelete) {
      await this.prisma.assetHardDisk.delete({ where: { id: item.id } });
    }

    for (const e of existing) {
      const updated = diskInfos.find((i: any) => hasKey(i, 'HDSerialNumber') && e.serialNumber === getAttr(i, 'HDSerialNumber'));
      if (updated) {
        await this.prisma.assetHardDisk.update({
          where: { id: e.id },
          data: {
            model: getAttr(updated, 'HDName'),
            serialNumber: getAttr(updated, 'HDSerialNumber'),
            capacity: getAttr(updated, 'HDSize'),
            manufacturer: getAttr(updated, 'HDManufacturer'),
          },
        });
      }
    }
  }

  private async upsertLogicalDrives(assetId: number, driveNode: ParsedNode | undefined): Promise<void> {
    if (!driveNode) return;

    const infos = driveNode.LogicDrive_Info;
    const driveInfos = Array.isArray(infos) ? infos : infos ? [infos] : [];

    const existing = await this.prisma.assetLogicalDrive.findMany({ where: { assetId } });

    const toAdd = driveInfos.filter((i: any) => hasKey(i, 'Name') && !existing.some((e) => e.drive === getAttr(i, 'Name')));
    for (const item of toAdd) {
      await this.prisma.assetLogicalDrive.create({
        data: {
          assetId,
          drive: getAttr(item, 'Name'),
          driveType: getAttr(item, 'Type'),
          capacity: getAttr(item, 'Size'),
          freeSpace: getAttr(item, 'FreeSpace'),
          serialNumber: getAttr(item, 'SerialNumber'),
          fileType: getAttr(item, 'FileSystem'),
        },
      });
    }

    const toDelete = existing.filter((e) => !driveInfos.some((i: any) => hasKey(i, 'Name') && e.drive === getAttr(i, 'Name')));
    for (const item of toDelete) {
      await this.prisma.assetLogicalDrive.delete({ where: { id: item.id } });
    }

    for (const e of existing) {
      const updated = driveInfos.find((i: any) => hasKey(i, 'Name') && e.drive === getAttr(i, 'Name'));
      if (updated) {
        await this.prisma.assetLogicalDrive.update({
          where: { id: e.id },
          data: {
            drive: getAttr(updated, 'Name'),
            driveType: getAttr(updated, 'Type'),
            capacity: getAttr(updated, 'Size'),
            freeSpace: getAttr(updated, 'FreeSpace'),
            serialNumber: getAttr(updated, 'SerialNumber'),
            fileType: getAttr(updated, 'FileSystem'),
          },
        });
      }
    }
  }

  private async upsertPhysicalDrives(assetId: number, driveNode: ParsedNode | undefined): Promise<void> {
    if (!driveNode) return;

    const infos = driveNode.PhysicalDrive_Info;
    const driveInfos = Array.isArray(infos) ? infos : infos ? [infos] : [];

    const existing = await this.prisma.assetPhysicalDrive.findMany({ where: { assetId } });

    const toAdd = driveInfos.filter((i: any) => hasKey(i, 'Name') && !existing.some((e) => e.driveName === getAttr(i, 'Name')));
    for (const item of toAdd) {
      await this.prisma.assetPhysicalDrive.create({
        data: {
          assetId,
          driveName: getAttr(item, 'Name'),
          description: getAttr(item, 'Description'),
        },
      });
    }

    const toDelete = existing.filter((e) => !driveInfos.some((i: any) => hasKey(i, 'Name') && e.driveName === getAttr(i, 'Name')));
    for (const item of toDelete) {
      await this.prisma.assetPhysicalDrive.delete({ where: { id: item.id } });
    }

    for (const e of existing) {
      const updated = driveInfos.find((i: any) => hasKey(i, 'Name') && e.driveName === getAttr(i, 'Name'));
      if (updated) {
        await this.prisma.assetPhysicalDrive.update({
          where: { id: e.id },
          data: {
            driveName: getAttr(updated, 'Name'),
            description: getAttr(updated, 'Description'),
          },
        });
      }
    }
  }

  private async upsertKeyboard(assetId: number, keyboardNode: ParsedNode | undefined): Promise<void> {
    if (!keyboardNode) return;

    const existing = await this.prisma.assetKeyboard.findFirst({ where: { assetId } });
    const data = { keyboardType: getAttr(keyboardNode, 'Name') };

    if (existing) {
      await this.prisma.assetKeyboard.update({ where: { id: existing.id }, data });
    } else {
      await this.prisma.assetKeyboard.create({ data: { assetId, ...data } });
    }
  }

  private async upsertMouse(assetId: number, mouseNode: ParsedNode | undefined): Promise<void> {
    if (!mouseNode) return;

    const existing = await this.prisma.assetMouse.findFirst({ where: { assetId } });
    const data = {
      mouseType: getAttr(mouseNode, 'Name'),
      mouseButtons: getAttr(mouseNode, 'ButtonsCount'),
      manufacturer: getAttr(mouseNode, 'Manufacturer'),
    };

    if (existing) {
      await this.prisma.assetMouse.update({ where: { id: existing.id }, data });
    } else {
      await this.prisma.assetMouse.create({ data: { assetId, ...data } });
    }
  }

  private async upsertMonitors(assetId: number, monitorNode: ParsedNode | undefined): Promise<void> {
    if (!monitorNode) return;

    const infos = monitorNode.Monitor_Info;
    const monitorInfos = Array.isArray(infos) ? infos : infos ? [infos] : [];

    const existing = await this.prisma.assetMonitor.findMany({ where: { assetId } });

    const toAdd = monitorInfos.filter((i: any) => hasKey(i, 'SerialNumber') && !existing.some((e) => e.serialNumber === getAttr(i, 'SerialNumber')));
    for (const item of toAdd) {
      await this.prisma.assetMonitor.create({
        data: {
          assetId,
          monitorType: getAttr(item, 'DisplayType'),
          resolution: getAttr(item, 'Resolution'),
          serialNumber: getAttr(item, 'SerialNumber'),
          manufacturer: getAttr(item, 'Manufacturer'),
        },
      });
    }

    const toDelete = existing.filter((e) => !monitorInfos.some((i: any) => hasKey(i, 'SerialNumber') && e.serialNumber === getAttr(i, 'SerialNumber')));
    for (const item of toDelete) {
      await this.prisma.assetMonitor.delete({ where: { id: item.id } });
    }

    for (const e of existing) {
      const updated = monitorInfos.find((i: any) => hasKey(i, 'SerialNumber') && e.serialNumber === getAttr(i, 'SerialNumber'));
      if (updated) {
        await this.prisma.assetMonitor.update({
          where: { id: e.id },
          data: {
            monitorType: getAttr(updated, 'DisplayType'),
            resolution: getAttr(updated, 'Resolution'),
            serialNumber: getAttr(updated, 'SerialNumber'),
            manufacturer: getAttr(updated, 'Manufacturer'),
          },
        });
      }
    }
  }

  private async upsertNetworkAdapters(assetId: number, networkNode: ParsedNode | undefined): Promise<void> {
    if (!networkNode) return;

    const infos = networkNode.Network_Info;
    const networkInfos = Array.isArray(infos) ? infos : infos ? [infos] : [];

    const existing = await this.prisma.assetNetworkAdapter.findMany({ where: { assetId } });

    const toAdd = networkInfos.filter((i: any) => hasKey(i, 'MACAddress') && !existing.some((e) => e.macAddress === getAttr(i, 'MACAddress')));
    for (const item of toAdd) {
      await this.prisma.assetNetworkAdapter.create({
        data: {
          assetId,
          macAddress: getAttr(item, 'MACAddress'),
          ipAddress: getAttr(item, 'IpAddress'),
          nicName: getAttr(item, 'Name'),
          gateway: getAttr(item, 'Gateway'),
          netmask: getAttr(item, 'Subnet'),
          isDhcp: getAttr(item, 'DHCPEnabled'),
          nicDescription: getAttr(item, 'DNSHostName'),
        },
      });
    }

    const toDelete = existing.filter((e) => !networkInfos.some((i: any) => hasKey(i, 'MACAddress') && e.macAddress === getAttr(i, 'MACAddress')));
    for (const item of toDelete) {
      await this.prisma.assetNetworkAdapter.delete({ where: { id: item.id } });
    }

    for (const e of existing) {
      const updated = networkInfos.find((i: any) => hasKey(i, 'MACAddress') && e.macAddress === getAttr(i, 'MACAddress'));
      if (updated) {
        await this.prisma.assetNetworkAdapter.update({
          where: { id: e.id },
          data: {
            macAddress: getAttr(updated, 'MACAddress'),
            ipAddress: getAttr(updated, 'IpAddress'),
            nicName: getAttr(updated, 'Name'),
            gateway: getAttr(updated, 'Gateway'),
            netmask: getAttr(updated, 'Subnet'),
            isDhcp: getAttr(updated, 'DHCPEnabled'),
            nicDescription: getAttr(updated, 'DNSHostName'),
          },
        });
      }
    }
  }

  private async upsertSoundCards(assetId: number, soundNode: ParsedNode | undefined): Promise<void> {
    if (!soundNode) return;

    const data = {
      soundCardName: getAttr(soundNode, 'SoundCardName'),
      manufacturer: getAttr(soundNode, 'SoundCardManufacturer'),
    };

    const existing = await this.prisma.assetSoundCard.findFirst({ where: { assetId } });
    if (existing) {
      await this.prisma.assetSoundCard.update({ where: { id: existing.id }, data });
    } else {
      await this.prisma.assetSoundCard.create({ data: { assetId, ...data } });
    }
  }

  private async upsertVideoCards(assetId: number, videoNode: ParsedNode | undefined): Promise<void> {
    if (!videoNode) return;

    const infos = videoNode.VideoCard_Info;
    const videoInfos = Array.isArray(infos) ? infos : infos ? [infos] : [];

    const existing = await this.prisma.assetVideoCard.findMany({ where: { assetId } });

    const toAdd = videoInfos.filter((i: any) => hasKey(i, 'VideoCardName') && !existing.some((e) => e.videoCardName === getAttr(i, 'VideoCardName')));
    for (const item of toAdd) {
      await this.prisma.assetVideoCard.create({
        data: {
          assetId,
          videoCardName: getAttr(item, 'VideoCardName'),
          videoCardMemory: getAttr(item, 'VideoCardMemory'),
          videoCardChipset: getAttr(item, 'VideoCardChipset'),
          videoCardBiosVersion: getAttr(item, 'VideoCardBiosVersion'),
        },
      });
    }

    const toDelete = existing.filter((e) => !videoInfos.some((i: any) => hasKey(i, 'VideoCardName') && e.videoCardName === getAttr(i, 'VideoCardName')));
    for (const item of toDelete) {
      await this.prisma.assetVideoCard.delete({ where: { id: item.id } });
    }

    for (const e of existing) {
      const updated = videoInfos.find((i: any) => hasKey(i, 'VideoCardName') && e.videoCardName === getAttr(i, 'VideoCardName'));
      if (updated) {
        await this.prisma.assetVideoCard.update({
          where: { id: e.id },
          data: {
            videoCardName: getAttr(updated, 'VideoCardName'),
            videoCardMemory: getAttr(updated, 'VideoCardMemory'),
            videoCardChipset: getAttr(updated, 'VideoCardChipset'),
            videoCardBiosVersion: getAttr(updated, 'VideoCardBiosVersion'),
          },
        });
      }
    }
  }

  private async upsertPorts(assetId: number, serialNode: ParsedNode | undefined, parallelNode: ParsedNode | undefined): Promise<void> {
    const allPorts: ParsedNode[] = [];

    const serialInfos = serialNode?.SerialPort_Info;
    allPorts.push(...(Array.isArray(serialInfos) ? serialInfos : serialInfos ? [serialInfos] : []));

    const parallelInfos = parallelNode?.ParallelPort_Info;
    allPorts.push(...(Array.isArray(parallelInfos) ? parallelInfos : parallelInfos ? [parallelInfos] : []));

    const existing = await this.prisma.assetPort.findMany({ where: { assetId } });

    const toAdd = allPorts.filter((i: any) => hasKey(i, 'Name') && !existing.some((e) => e.portName === getAttr(i, 'Name')));
    for (const item of toAdd) {
      await this.prisma.assetPort.create({
        data: {
          assetId,
          portName: getAttr(item, 'Name'),
          status: getAttr(item, 'Status'),
        },
      });
    }

    const toDelete = existing.filter((e) => !allPorts.some((i: any) => hasKey(i, 'Name') && e.portName === getAttr(i, 'Name')));
    for (const item of toDelete) {
      await this.prisma.assetPort.delete({ where: { id: item.id } });
    }

    for (const e of existing) {
      const updated = allPorts.find((i: any) => hasKey(i, 'Name') && e.portName === getAttr(i, 'Name'));
      if (updated) {
        await this.prisma.assetPort.update({
          where: { id: e.id },
          data: {
            portName: getAttr(updated, 'Name'),
            status: getAttr(updated, 'Status'),
          },
        });
      }
    }
  }

  private async upsertUsbControllers(assetId: number, usbNode: ParsedNode | undefined): Promise<void> {
    if (!usbNode) return;

    const infos = usbNode.USB_Info;
    const usbInfos = Array.isArray(infos) ? infos : infos ? [infos] : [];

    const existing = await this.prisma.assetUsbController.findMany({ where: { assetId } });

    const toAdd = usbInfos.filter((i: any) => hasKey(i, 'Name') && !existing.some((e) => e.usb === getAttr(i, 'Name')));
    for (const item of toAdd) {
      await this.prisma.assetUsbController.create({
        data: { assetId, usb: getAttr(item, 'Name') },
      });
    }

    const toDelete = existing.filter((e) => !usbInfos.some((i: any) => hasKey(i, 'Name') && e.usb === getAttr(i, 'Name')));
    for (const item of toDelete) {
      await this.prisma.assetUsbController.delete({ where: { id: item.id } });
    }

    for (const e of existing) {
      const updated = usbInfos.find((i: any) => hasKey(i, 'Name') && e.usb === getAttr(i, 'Name'));
      if (updated) {
        await this.prisma.assetUsbController.update({
          where: { id: e.id },
          data: { usb: getAttr(updated, 'Name') },
        });
      }
    }
  }

  private async upsertPrinters(assetId: number, printerNode: ParsedNode | undefined): Promise<void> {
    if (!printerNode) return;

    const infos = printerNode.Printer_Info;
    const printerInfos = Array.isArray(infos) ? infos : infos ? [infos] : [];

    const existing = await this.prisma.assetPrinter.findMany({ where: { assetId } });

    const toAdd = printerInfos.filter((i: any) => hasKey(i, 'Name') && !existing.some((e) => e.name === getAttr(i, 'Name')));
    for (const item of toAdd) {
      await this.prisma.assetPrinter.create({
        data: {
          assetId,
          name: getAttr(item, 'Name'),
          model: getAttr(item, 'Model'),
          location: getAttr(item, 'PortName'),
        },
      });
    }

    const toDelete = existing.filter((e) => !printerInfos.some((i: any) => hasKey(i, 'Name') && e.name === getAttr(i, 'Name')));
    for (const item of toDelete) {
      await this.prisma.assetPrinter.delete({ where: { id: item.id } });
    }

    for (const e of existing) {
      const updated = printerInfos.find((i: any) => hasKey(i, 'Name') && e.name === getAttr(i, 'Name'));
      if (updated) {
        await this.prisma.assetPrinter.update({
          where: { id: e.id },
          data: {
            name: getAttr(updated, 'Name'),
            model: getAttr(updated, 'Model'),
            location: getAttr(updated, 'PortName'),
          },
        });
      }
    }
  }
}

export class WorkstationScanProcessor {
  private readonly scanDir: string;
  private readonly archiveDir: string;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly importService: WorkstationScanImportService,
    scanDir?: string,
  ) {
    this.scanDir = scanDir || process.env.WORKSTATION_SCAN_DIR || path.join(process.cwd(), 'uploads', 'workstation-scans');
    this.archiveDir = path.join(this.scanDir, 'archive');
  }

  async processPendingFiles(): Promise<ProcessingResult[]> {
    const pendingFiles = await this.prisma.workstationScanFile.findMany({
      where: { status: WorkstationScanStatus.PENDING },
      orderBy: { createdAt: 'asc' },
    });

    if (!pendingFiles.length) {
      console.log('No pending self-scan files found.');
      return [];
    }

    const results: ProcessingResult[] = [];

    for (const file of pendingFiles) {
      try {
        await this.updateFileStatus(file.id, WorkstationScanStatus.IN_PROGRESS);

        const filePath = path.join(this.scanDir, file.fileName);
        let xmlContent: string;

        try {
          xmlContent = await fs.promises.readFile(filePath, 'utf-8');
        } catch (err: any) {
          if (err.code === 'ENOENT') {
            console.warn(`File not found: ${filePath}, skipping...`);
            await this.updateFileStatus(file.id, WorkstationScanStatus.FAILED);
            results.push({ fileId: file.id, fileName: file.fileName, success: false, error: 'File not found' });
            continue;
          }
          throw err;
        }

        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
        const jsonObj = parser.parse(xmlContent);
        const nodes = jsonObj.DocRoot?.Node;
        const nodeArray = Array.isArray(nodes) ? nodes : nodes ? [nodes] : [];

        await this.importService.processXMLNodes(nodeArray);

        await this.updateFileStatus(file.id, WorkstationScanStatus.DONE);
        await this.archiveFile(filePath, file.fileName);

        results.push({ fileId: file.id, fileName: file.fileName, success: true });
      } catch (err) {
        console.error(`Failed processing file ${file.fileName}`, err);
        await this.updateFileStatus(file.id, WorkstationScanStatus.FAILED);
        results.push({ fileId: file.id, fileName: file.fileName, success: false, error: String(err) });
      }
    }

    return results;
  }

  private async updateFileStatus(fileId: number, status: WorkstationScanStatus): Promise<void> {
    await this.prisma.workstationScanFile.update({
      where: { id: fileId },
      data: { status, updatedAt: new Date() },
    });
  }

  private async archiveFile(sourcePath: string, fileName: string): Promise<void> {
    try {
      await fs.promises.mkdir(this.archiveDir, { recursive: true });
      const archivedPath = path.join(this.archiveDir, fileName);
      await fs.promises.rename(sourcePath, archivedPath);
      console.log(`Archived file to ${archivedPath}`);
    } catch (err) {
      console.error(`Failed to archive file ${fileName}`, err);
    }
  }
}