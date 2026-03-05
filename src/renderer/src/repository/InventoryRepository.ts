import { Database } from 'better-sqlite3'
import { InventoryMovementParams, InventoryMovementReturn } from '../features/inventory/utils/types'
import {
  IInventoryRepository,
  ProductInventoryType,
} from '../interfaces/IInventoryRepository'
import { InventoryType, ErrorType, Direction, CustomResponseType } from '../shared/utils/types'
import { ipcMain } from 'electron'

export class InventoryRepository implements IInventoryRepository {
  private _database: Database

  constructor(database: Database) {
    this._database = database
    ipcMain.handle(
      'inventory:getAll',
      (_, params: { pageSize: number; cursorId: number; userId: number; direction?: Direction }) =>
        this.getAll(params)
    )
    ipcMain.handle('inventory:getById', (_, params: InventoryMovementParams) => this.getById(params))
    ipcMain.handle('inventory:create', (_, params: InventoryType) => this.create(params))
    ipcMain.handle('inventory:update', (_, params: InventoryType) => this.update(params))
    ipcMain.handle('inventory:delete', (_, id: number) => this.delete(id))
  }

  getAll(params: { pageSize: number; cursorId: number; direction?: Direction }): {
    data: Array<ProductInventoryType> | null
    error: ErrorType
  } {
    try {
      const { cursorId, direction = 'next', pageSize } = params
      const db = this._database

      let stmt = `
         SELECT  i.id, i.quantity, p.name, p.id AS product_id
         FROM inventory i
         LEFT JOIN products p ON i.product_id = p.id
          WHERE  i.id > ?
            AND p.is_active = 1
         LIMIT ?
      `

      if (direction === 'prev') {
        stmt = `
         SELECT  i.id, i.quantity, p.name, p.id AS product_id
         FROM inventory i
         LEFT JOIN products p ON i.product_id = p.id
          WHERE  i.id < ?
          ORDER BY i.id DESC
         LIMIT ?
      `
      }

      const products = db.prepare(stmt).all(cursorId, pageSize + 1) as ProductInventoryType[]

      if (!products) {
        throw new Error('Something went wrong while retreiving the products')
      }

      return {
        data: products,
        error: ''
      }
    } catch (error) {
      if (error instanceof Error) {
        return {
          data: null,
          error: new Error('Something went wrong while searching the product')
        }
      }
      return {
        data: null,
        error: new Error('Something went wrong while searching the product')
      }
    }
  }
  getById(params: InventoryMovementParams): {
    data: {
      productName: string
      movements: InventoryMovementReturn[] | null
    } | null; error: ErrorType
  } {
    try {
      const { startDate, endDate, id, cursorId, direction = 'next', pageSize } = params
      console.log({ params })

      const db = this._database

      let stmt = `
            SELECT imv.*, p.name AS product_name, p.sku AS product_sku
            FROM inventory_movement AS imv
            LEFT JOIN products AS p ON p.id = imv.product_id
            LEFT JOIN inventory AS i ON i.product_id = imv.product_id
            WHERE
              i.id = ?
              AND imv.id > ?
              AND (? IS FALSE OR imv.created_at >= ? )
              AND (? IS FALSE OR imv.created_at <= ?)
            LIMIT ?
      `


      if (direction === 'prev') {
        stmt = `
            SELECT imv.*, p.name AS product_name, p.sku AS product_sku
            FROM inventory_movement AS imv
            LEFT JOIN products AS p ON p.id = imv.product_id
            LEFT JOIN inventory AS i ON i.product_id = imv.product_id
            WHERE
              i.id = ?
              AND imv.id < ?
              AND(? IS FALSE OR imv.created_at >= ? )
              AND (? IS FALSE OR imv.created_at <= ?)
            ORDER BY imv.id DESC
            LIMIT ?
      `
      }

      const movements = db.prepare(stmt).all(id,
        cursorId,
        startDate,
        startDate,
        endDate,
        endDate,
        pageSize + 1) as Array<InventoryMovementReturn & { product_name: string }>

      if (movements) {
        return {
          data: {
            productName: movements?.[0]?.product_name ?? '',
            movements
          },
          error: ''
        }
      }

      return {
        data: null,
        error: "Couldn't find an inventory."
      }
    } catch (error) {
      if (error instanceof Error) {
        return {
          data: null,
          error: new Error('Something went wrong while searching the product')
        }
      }
      return {
        data: null,
        error: new Error('Something went wrong while searching the product')
      }
    }
  }
  create(params: InventoryType): CustomResponseType {
    const { quantity, product_id } = params
    try {
      const product = this._database
        .prepare(
          `INSERT INTO inventory (quantity, product_id)
        VALUES(?, ?) RETURNING *`
        )
        .run(quantity, product_id)

      if (!product.changes) {
        throw new Error("Something went wrong while saving an inventory.")
      }

      return {
        success: true,
        error: ''
      }
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: new Error('Something went wrong while searching the product')
        }
      }
      return {
        success: false,
        error: new Error('Something went wrong while searching the product')
      }
    }
  }
  update(params: InventoryType): { success: boolean; error: ErrorType } {
    const {
      quantity,
      id,
      product_id,
      user_id,
      movement_type = 0,
      reference_type = 'adjustment'
    } = params

    console.log('params', params)
    const errorMessage = new Error('Something went wrong while updating an inventory.')

    const db = this._database

    const createdAt = new Date().toISOString()

    try {
      const inventory = db.prepare(
        `UPDATE inventory
          SET quantity = quantity + ?
          WHERE id = ?`
      )
      const insertInvMv = db.prepare(
        `INSERT INTO inventory_movement (created_at, movement_type, reference_type, quantity, reference_id, product_id, user_id)
          VALUES(?, ?, ?, ?, ?, ?, ?)
        `
      )
      const transaction = db.transaction(() => {

        const res = inventory.run(quantity, id)

        if (!res.changes) {
          throw new Error(errorMessage.message)
        }

        const resInvMv = insertInvMv.run(
          createdAt,
          movement_type,
          reference_type,
          quantity,
          id,
          product_id,
          user_id
        )

        if (!resInvMv.changes) {
          throw new Error(errorMessage.message)
        }

        return true
      })

      const res = transaction()

      if (!res) {
        throw new Error(errorMessage.message)
      }

      return {
        success: true,
        error: ''
      }
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: errorMessage
        }
      }
      return {
        success: false,
        error: errorMessage
      }
    }
  }
  delete(id: number): { success: boolean; error: ErrorType } {
    const errorMessage = new Error('Something went wrong while updating an inventory.')
    try {
      this._database.prepare(`DELETE FROM inventory WHERE id = ?`).run(id)

      return {
        success: true,
        error: errorMessage
      }
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: errorMessage
        }
      }
      return {
        success: false,
        error: errorMessage
      }
    }
  }
}
