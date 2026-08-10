import { USER_ROLES } from "../../enums";

export type AccountStatus = "active" | "inactive" | "banned" | "deleted";

// this is the interface for main field for the user table.
export interface IUser {
  id: number;
  name: string;
  email: string;
  avatar: string;
  phone: string | null;
  is_email_verified: boolean;
  status: AccountStatus;
  role: USER_ROLES;
  password_hash: string;
  last_login_at: Date | null;
  deleted_at: Date;
  created_at: Date;
  updated_at: Date;
}

// this is the interface for the user object that will be received from the client when creating a new user.
export type ICreateUser = Omit<
  IUser,
  | "id"
  | "password_hash"
  | "avatar"
  | "is_active"
  | "is_email_verified"
  | "status"
  | "last_login_at"
  | "created_at"
  | "updated_at"
  | "deleted_at"
>;

// this is the interface for the user object that will be received from the client when updating a user.
export interface IUpdateUser {
  name?: string;
  phone?: string;
  avatar?: string;
}

export interface IChangePassowrd {
  current_password: string;
  new_password: string;
  confirm_password: string;
}
