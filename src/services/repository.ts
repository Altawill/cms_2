import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  runTransaction,
  Timestamp,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'
import { ActivityLog } from '../types'
import { mockRepository } from './mockService'

const isDevMode = import.meta.env.VITE_DEV_MODE === 'true'

// Generic repository class for CRUD operations
export class Repository<T extends { id: string }> {
  constructor(protected collectionName: string) {}

  // Convert Firestore document to typed object
  private fromFirestore(doc: QueryDocumentSnapshot<DocumentData>): T {
    const data = doc.data()
    // Convert Firestore timestamps to Date objects
    const convertedData = this.convertTimestamps(data)
    return { id: doc.id, ...convertedData } as T
  }

  // Convert Date objects to Firestore timestamps
  private toFirestore(data: Partial<T>): DocumentData {
    const converted = { ...data }
    delete converted.id // Remove ID from data
    return this.convertDatesToTimestamps(converted)
  }

  // Convert Firestore timestamps to Date objects
  private convertTimestamps(data: any): any {
    if (!data) return data
    
    const converted = { ...data }
    for (const key in converted) {
      if (converted[key] instanceof Timestamp) {
        converted[key] = converted[key].toDate()
      } else if (typeof converted[key] === 'object' && converted[key] !== null) {
        converted[key] = this.convertTimestamps(converted[key])
      }
    }
    return converted
  }

  // Convert Date objects to Firestore timestamps
  private convertDatesToTimestamps(data: any): any {
    if (!data) return data
    
    const converted = { ...data }
    for (const key in converted) {
      if (converted[key] instanceof Date) {
        converted[key] = Timestamp.fromDate(converted[key])
      } else if (typeof converted[key] === 'object' && converted[key] !== null) {
        converted[key] = this.convertDatesToTimestamps(converted[key])
      }
    }
    return converted
  }

  async create(data: Omit<T, 'id'>): Promise<T> {
    const docRef = await addDoc(collection(db, this.collectionName), this.toFirestore(data as T))
    const doc = await getDoc(docRef)
    if (!doc.exists()) {
      throw new Error('Failed to create document')
    }
    return this.fromFirestore(doc as QueryDocumentSnapshot<DocumentData>)
  }

  async getById(id: string): Promise<T | null> {
    const docRef = doc(db, this.collectionName, id)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? this.fromFirestore(docSnap as QueryDocumentSnapshot<DocumentData>) : null
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    const docRef = doc(db, this.collectionName, id)
    await updateDoc(docRef, this.toFirestore(data as T))
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id)
    await deleteDoc(docRef)
  }

  async getAll(constraints: QueryConstraint[] = []): Promise<T[]> {
    const q = query(collection(db, this.collectionName), ...constraints)
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => this.fromFirestore(doc))
  }

  async getWhere(field: string, operator: any, value: any): Promise<T[]> {
    return this.getAll([where(field, operator, value)])
  }

  // Real-time subscription
  onSnapshot(
    callback: (items: T[]) => void,
    constraints: QueryConstraint[] = []
  ): () => void {
    const q = query(collection(db, this.collectionName), ...constraints)
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => this.fromFirestore(doc))
      callback(items)
    })
  }

  // Paginated queries
  async getPaginated(
    pageSize: number,
    lastDoc?: QueryDocumentSnapshot<DocumentData>,
    constraints: QueryConstraint[] = []
  ): Promise<{ items: T[], lastDoc?: QueryDocumentSnapshot<DocumentData> }> {
    const queryConstraints = [
      ...constraints,
      limit(pageSize),
      ...(lastDoc ? [startAfter(lastDoc)] : [])
    ]
    
    const q = query(collection(db, this.collectionName), ...queryConstraints)
    const snapshot = await getDocs(q)
    const items = snapshot.docs.map(doc => this.fromFirestore(doc))
    
    return {
      items,
      lastDoc: snapshot.docs[snapshot.docs.length - 1]
    }
  }
}

// Development-friendly Repository class
class DevRepository<T extends { id: string }> extends Repository<T> {
  constructor(collectionName: string) {
    super(collectionName)
  }

  async getAll(constraints: any[] = []): Promise<T[]> {
    if (isDevMode) {
      const result = await mockRepository.getAll(this.collectionName)
      return result as unknown as T[]
    }
    return super.getAll(constraints)
  }

  async getById(id: string): Promise<T | null> {
    if (isDevMode) {
      return mockRepository.getById(this.collectionName, id) as Promise<T | null>
    }
    return super.getById(id)
  }

  async create(data: Omit<T, 'id'>): Promise<T> {
    if (isDevMode) {
      return mockRepository.create(this.collectionName, data) as Promise<T>
    }
    return super.create(data)
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    if (isDevMode) {
      await mockRepository.update(this.collectionName, id, data)
      return
    }
    return super.update(id, data)
  }

  async delete(id: string): Promise<void> {
    if (isDevMode) {
      await mockRepository.delete(this.collectionName, id)
      return
    }
    return super.delete(id)
  }
}

// Specific repository instances
export const usersRepo = new DevRepository('users')
export const sitesRepo = new DevRepository('sites')
export const safesRepo = new DevRepository('safes')
export const safeTransactionsRepo = new Repository('safeTransactions')
export const employeesRepo = new Repository('employees')
export const payrollRunsRepo = new Repository('payrollRuns')
export const payrollItemsRepo = new Repository('payrollItems')
export const expensesRepo = new Repository('expenses')
export const revenuesRepo = new Repository('revenues')
export const clientsRepo = new Repository('clients')
export const receiptsRepo = new Repository('receipts')
export const priceHistoryRepo = new Repository('priceHistory')
export const activityLogsRepo = new Repository('activityLogs')
export const userSiteRolesRepo = new Repository('userSiteRoles')
export const settingsRepo = new Repository('settings')

// Task management repositories
export const tasksRepo = new DevRepository('tasks')
export const taskUpdatesRepo = new Repository('taskUpdates')
export const taskApprovalsRepo = new Repository('taskApprovals')
export const taskInvoiceLinksRepo = new Repository('taskInvoiceLinks')
export const invoicesRepo = new Repository('invoices')

// Activity logging helper
export async function logActivity(
  entityType: string,
  entityId: string,
  action: string,
  byUser: string,
  payload?: Record<string, any>
): Promise<void> {
  const activity: Omit<ActivityLog, 'id'> = {
    entityType,
    entityId,
    action,
    byUser,
    at: new Date(),
    payload,
  }

  await activityLogsRepo.create(activity)
}

// Atomic safe transfer operation
export async function transferBetweenSafes(
  fromSafeId: string,
  toSafeId: string,
  amount: number,
  note: string,
  userId: string
): Promise<void> {
  if (isDevMode) {
    // Use mock repository for development
    return mockRepository.transferBetweenSafes(fromSafeId, toSafeId, amount, note, userId)
  }

  await runTransaction(db, async (transaction) => {
    // Get source and destination safes
    const fromSafeRef = doc(db, 'safes', fromSafeId)
    const toSafeRef = doc(db, 'safes', toSafeId)
    
    const fromSafeDoc = await transaction.get(fromSafeRef)
    const toSafeDoc = await transaction.get(toSafeRef)
    
    if (!fromSafeDoc.exists() || !toSafeDoc.exists()) {
      throw new Error('One or both safes not found')
    }
    
    const fromSafe = fromSafeDoc.data()
    const toSafe = toSafeDoc.data()
    
    // Check sufficient funds
    if (fromSafe.balance < amount) {
      throw new Error('Insufficient funds')
    }
    
    // Update balances
    transaction.update(fromSafeRef, {
      balance: fromSafe.balance - amount,
      updatedAt: Timestamp.fromDate(new Date())
    })
    
    transaction.update(toSafeRef, {
      balance: toSafe.balance + amount,
      updatedAt: Timestamp.fromDate(new Date())
    })
    
    // Create descriptive transaction records for both safes
    const timestamp = Timestamp.fromDate(new Date())
    
    // Transaction for sender (withdrawal)
    const senderTransaction = {
      safeId: fromSafeId,
      type: 'TRANSFER',
      amount: amount, // Store positive amount, display logic handles the sign
      note: `${note} (Transfer to ${toSafe.name})`,
      counterpartySafeId: toSafeId,
      createdBy: userId,
      createdAt: timestamp
    }
    
    // Transaction for receiver (deposit)
    const receiverTransaction = {
      safeId: toSafeId,
      type: 'TRANSFER',
      amount: amount, // Store positive amount, display logic handles the sign
      note: `${note} (Transfer from ${fromSafe.name})`,
      counterpartySafeId: fromSafeId,
      createdBy: userId,
      createdAt: timestamp
    }
    
    transaction.set(doc(collection(db, 'safeTransactions')), senderTransaction)
    transaction.set(doc(collection(db, 'safeTransactions')), receiverTransaction)
  })
}

// Batch operations for better performance
export class BatchOperations {
  private operations: Array<{ type: 'create' | 'update' | 'delete', collection: string, id?: string, data?: any }> = []
  
  create(collectionName: string, data: any): this {
    this.operations.push({ type: 'create', collection: collectionName, data })
    return this
  }
  
  update(collectionName: string, id: string, data: any): this {
    this.operations.push({ type: 'update', collection: collectionName, id, data })
    return this
  }
  
  delete(collectionName: string, id: string): this {
    this.operations.push({ type: 'delete', collection: collectionName, id })
    return this
  }
  
  async commit(): Promise<void> {
    await runTransaction(db, async (transaction) => {
      for (const operation of this.operations) {
        switch (operation.type) {
          case 'create':
            transaction.set(doc(collection(db, operation.collection)), operation.data)
            break
          case 'update':
            transaction.update(doc(db, operation.collection, operation.id!), operation.data)
            break
          case 'delete':
            transaction.delete(doc(db, operation.collection, operation.id!))
            break
        }
      }
    })
  }
}
