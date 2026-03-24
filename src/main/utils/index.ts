import { SqliteError } from "better-sqlite3";

function sqliteErrorMapper(error: SqliteError["name"]): Error {
  console.log(" sqliteErrorMapper", error);
  const map = {
    SQLITE_CONSTRAINT_UNIQUE: "That value already exists.",
  };
  return new Error(map[error] ?? "Something went wrong. Please try again.");
}

export function errorMapper(err: Error | SqliteError | unknown): Error {
  if (err instanceof SqliteError) {
    return sqliteErrorMapper(err.code);
  }

  if (err instanceof Error) {
    return err;
  }

  return new Error("Something went wrong. Please try again.");
}
