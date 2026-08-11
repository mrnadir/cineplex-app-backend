export enum USER_ROLES {
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
  USER = "USER",
}

export enum ACCOUNT_STATUS {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  DELETED = "deleted",
}

export enum NEWS_STATUS {
  DRAFT = "draft",
  PUBLISHED = "published",
}

export enum OTP_PURPOSE {
  VERIFY_EMAIL = "email_verify",
  VERIFY_PHONE = "phone_verify",
  FORGOT_PASSWORD = "forgot_password",
  DELETE_ACCOUNT = "delete_account",
  RECOVERY_ACCOUNT = "recovery_account",
}

export enum BANNER_STATUS {
  ACTIVE = "active",
  DELETED = "deleted",
}

export enum THEATER_STATUS {
  ACTIVE = "active",
  DELETED = "deleted",
}

export enum COMMENT_STATUS {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum MOVIE_STATUS {
  DRAFT = "draft",
  PUBLISHED = "published",
}

export enum MOVIE_CATEGORY {
  "2D" = "2D",
  "3D" = "3D",
}

export enum SEAT_TYPE_STATUS {
  Regular = "Regular",
  VIP = "VIP",
  Semi_Recliner = "Semi Recliner",
}
