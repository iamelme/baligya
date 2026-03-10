import { SqliteError } from "better-sqlite3";
import {
  IUserRepository,
  ReturnType,
} from "../interfaces/IUserInterRepository";
import {
  CustomResponseType,
  UserType,
} from "../../renderer/src/shared/utils/types";
import { ipcMain } from "electron";
import { AppDatabase } from "../database/db";

export class UserRepository implements IUserRepository {
  private _database: AppDatabase;
  private _verifyPassword: (
    hashed: string,
    password: string,
  ) => Promise<boolean>;
  private _hashPassword: (password: string) => Promise<string | false>;

  constructor(
    database: AppDatabase,
    hashPasswod: (password: string) => Promise<string | false>,
    verifyPassword: (hashed: string, password: string) => Promise<boolean>,
  ) {
    this._database = database;
    this._hashPassword = hashPasswod;
    this._verifyPassword = verifyPassword;

    ipcMain.handle("user:create", (_, params: UserType) => this.create(params));
    ipcMain.handle("user:login", (_, params: UserType) => this.login(params));
  }

  async create(params: UserType): Promise<CustomResponseType> {
    const { user_name, password } = params;
    const errorMessage = new Error(
      "Something went wrong while creating a user.",
    );
    try {
      const db = this._database.getDb();

      const foundUser = db
        .prepare(
          `
        SELECT * FROM users
        WHERE user_name = ?
        `,
        )
        .get(user_name) as UserType;

      if (foundUser?.id) {
        throw new Error("User is already exists.");
      }
      // const res = await window.apiElectron.createPDF({
      //   ...data,
      //   logo: settings?.logo as string,
      // });

      // const hashedPassword = await argon2.hash(password)

      const hashedPassword = await this._hashPassword(password);
      const user = db
        .prepare(
          `
            INSERT INTO users (user_name, password)
            VALUES(?, ?)
            `,
        )
        .run(user_name, hashedPassword);

      if (!user.changes) {
        throw new Error(errorMessage.message);
      }

      return {
        success: true,
        error: "",
      };
    } catch (error) {
      if (error instanceof SqliteError) {
        if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
          return {
            success: false,
            error: new Error("Data needs to be unique"),
          };
        }
      }
      return {
        success: false,
        error: new Error("Something went wrong while saving the user"),
      };
    }
  }

  async login(params: UserType): Promise<ReturnType> {
    const { user_name, password } = params;
    try {
      const db = this._database.getDb();
      const foundUser = db
        .prepare(
          `
        SELECT * FROM users
        WHERE user_name = ?
        `,
        )
        .get(user_name) as UserType;

      if (foundUser) {
        if (await this._verifyPassword(foundUser.password, password)) {
          return {
            data: foundUser,
            error: "",
          };
        } else {
          return {
            data: null,
            error: new Error("User name or password is incorrect."),
          };
        }
      }

      return {
        data: null,
        error: new Error("Something went wrong while signing up."),
      };
    } catch (error) {
      if (error instanceof SqliteError) {
        if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
          return {
            data: null,
            error: new Error("Data needs to be unique"),
          };
        }
      }
      return {
        data: null,
        error: new Error("Something went wrong while saving the user"),
      };
    }
  }
}
