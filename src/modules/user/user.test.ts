import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/ApiErrors";
import { OTP_PURPOSE, USER_ROLES } from "../../enums";

jest.mock("./user.repository", () => ({
  UserRepository: jest.fn(),
}));

jest.mock("../../utils/otp", () => ({
  OtpGeneratorService: jest.fn(),
}));

jest.mock("../../utils/hash_password", () => ({
  HashPasswordService: jest.fn(),
}));

jest.mock("../otp/otp.repository", () => ({
  OtpRepository: jest.fn(),
}));

jest.mock("../../db/transaction-context", () => ({
  runInTransaction: jest.fn(
    (_pool: unknown, callback: () => Promise<unknown>) => callback()
  ),
}));

jest.mock("../../shared/email/email.queue", () => ({
  emailQueue: {
    add: jest.fn(),
  },
}));

jest.mock("../../shared/redis/redis.helper", () => ({
  RedisHelper: jest.fn(),
}));

jest.mock("../../shared/logger", () => ({
  __esModule: true,
  default: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";
import { OtpGeneratorService } from "../../utils/otp";
import { HashPasswordService } from "../../utils/hash_password";
import { OtpRepository } from "../otp/otp.repository";
import { RedisHelper } from "../../shared/redis/redis.helper";
import { emailQueue } from "../../shared/email/email.queue";
import { runInTransaction } from "../../db/transaction-context";

const MockUserRepository = UserRepository as unknown as jest.Mock;
const MockOtpGeneratorService = OtpGeneratorService as unknown as jest.Mock;
const MockHashPasswordService = HashPasswordService as unknown as jest.Mock;
const MockOtpRepository = OtpRepository as unknown as jest.Mock;
const MockRedisHelper = RedisHelper as unknown as jest.Mock;
const MockRunInTransaction = runInTransaction as jest.Mock;
const MockEmailQueue = emailQueue.add as jest.Mock;

describe("UserService", () => {
  let userService: UserService;

  let mockUserRepo: {
    uniqueByEmail: jest.Mock;
    create: jest.Mock;
    findByUserId: jest.Mock;
    updatePasswordToDB: jest.Mock;
  };

  let mockOtpGenerator: {
    generateOTP: jest.Mock;
    hashOtp: jest.Mock;
  };

  let mockOtpRepo: {
    create: jest.Mock;
  };

  let mockHashPasswordService: {
    verify: jest.Mock;
    hash: jest.Mock;
  };

  let mockRedis: {
    get: jest.Mock;
    set: jest.Mock;
  };

  const sampleUser = {
    id: 1,
    name: "Alice Rahman",
    email: "alice@example.com",
    avatar: "",
    phone: "01712345678",
    role: "USER",
    is_email_verified: false,
    status: "active",
    password_hash: "hashed_password",
    last_login_at: null,
    deleted_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    mockUserRepo = {
      uniqueByEmail: jest.fn(),
      create: jest.fn(),
      findByUserId: jest.fn(),
      updatePasswordToDB: jest.fn(),
    };

    mockOtpGenerator = {
      generateOTP: jest.fn().mockReturnValue(123456),
      hashOtp: jest.fn().mockReturnValue("hashed-otp"),
    };

    mockOtpRepo = {
      create: jest.fn(),
    };

    mockHashPasswordService = {
      verify: jest.fn(),
      hash: jest.fn(),
    };

    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
    };

    MockUserRepository.mockImplementation(() => mockUserRepo);
    MockOtpGeneratorService.mockImplementation(() => mockOtpGenerator);
    MockHashPasswordService.mockImplementation(() => mockHashPasswordService);
    MockOtpRepository.mockImplementation(() => mockOtpRepo);
    MockRedisHelper.mockImplementation(() => mockRedis);
    MockRunInTransaction.mockImplementation(async (_pool: unknown, callback) =>
      callback()
    );
    MockEmailQueue.mockResolvedValue(undefined);

    userService = new UserService();
  });

  describe("createUserToDB", () => {
    it("should create a user and send OTP verification email", async () => {
      mockUserRepo.uniqueByEmail.mockResolvedValue(false);
      mockUserRepo.create.mockResolvedValue(sampleUser);
      mockOtpRepo.create.mockResolvedValue({ id: 1 });

      const result = await userService.createUserToDB({
        name: sampleUser.name,
        email: sampleUser.email,
        phone: sampleUser.phone,
        role: USER_ROLES.USER,
        password_hash: "hashed_password",
      });

      expect(result).toEqual(sampleUser);
      expect(mockUserRepo.create).toHaveBeenCalledWith({
        name: sampleUser.name,
        email: sampleUser.email,
        phone: sampleUser.phone,
        role: USER_ROLES.USER,
        password_hash: "hashed_password",
      });
      expect(mockOtpGenerator.generateOTP).toHaveBeenCalled();
      expect(mockOtpGenerator.hashOtp).toHaveBeenCalledWith("123456");
      expect(mockOtpRepo.create).toHaveBeenCalledWith({
        user_id: sampleUser.id,
        otp_hash: "hashed-otp",
        purpose: OTP_PURPOSE.VERIFY_EMAIL,
      });
      expect(MockEmailQueue).toHaveBeenCalledWith("otp-verification", {
        to: sampleUser.email,
        subject: "Verify your Cineplex Account",
        template: "welcome",
        context: { name: sampleUser.name, otp: 123456 },
      });
    });

    it("should throw a conflict error when email already exists", async () => {
      mockUserRepo.uniqueByEmail.mockResolvedValue(true);

      await expect(
        userService.createUserToDB({
          name: sampleUser.name,
          email: sampleUser.email,
          phone: sampleUser.phone,
          role: USER_ROLES.USER,
          password_hash: "hashed_password",
        })
      ).rejects.toMatchObject({
        statusCode: StatusCodes.CONFLICT,
        message: "Email is taken. Please choose a different email.",
      } satisfies Partial<ApiError>);

      expect(mockUserRepo.create).not.toHaveBeenCalled();
    });
  });

  describe("changePassword", () => {
    it("should update the password when current password is valid", async () => {
      mockUserRepo.findByUserId.mockResolvedValue(sampleUser);
      mockHashPasswordService.verify.mockResolvedValue(true);
      mockHashPasswordService.hash.mockResolvedValue("new_hashed_password");
      mockUserRepo.updatePasswordToDB.mockResolvedValue(sampleUser);

      const result = await userService.changePassword(1, {
        current_password: "oldPassword123",
        new_password: "newPassword456",
        confirm_password: "newPassword456",
      });

      expect(result).toEqual(sampleUser);
      expect(mockHashPasswordService.verify).toHaveBeenCalledWith(
        sampleUser.password_hash,
        "oldPassword123"
      );
      expect(mockHashPasswordService.hash).toHaveBeenCalledWith(
        "newPassword456"
      );
      expect(mockUserRepo.updatePasswordToDB).toHaveBeenCalledWith(
        1,
        "new_hashed_password"
      );
    });
  });

  describe("retrivedProfileFromDB", () => {
    it("should return cached profile when available", async () => {
      mockRedis.get.mockResolvedValue(sampleUser);

      const result = await userService.retrivedProfileFromDB(1);

      expect(result).toEqual(sampleUser);
      expect(mockUserRepo.findByUserId).not.toHaveBeenCalled();
    });

    it("should fetch from DB and cache if not in Redis", async () => {
      mockRedis.get.mockResolvedValue(null);
      mockUserRepo.findByUserId.mockResolvedValue(sampleUser);

      const result = await userService.retrivedProfileFromDB(1);

      expect(result).toEqual(sampleUser);
      expect(mockUserRepo.findByUserId).toHaveBeenCalledWith(1);
      expect(mockRedis.set).toHaveBeenCalledWith(
        "user:1",
        sampleUser,
        undefined,
        3600
      );
    });
  });
});
