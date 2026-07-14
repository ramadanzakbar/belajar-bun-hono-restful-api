import { prismaClient } from "../src/applications/database";
import { RegisterUserRequest } from "../src/model/user-model";

export class UserTest {
  static async createTestUser() {
    const request: RegisterUserRequest = {
      username: "test",
      name: "test",
      password: await Bun.password.hash("password", {
        algorithm: "bcrypt",
        cost: 10,
      }),
    };

    await prismaClient.user.create({
      data: request,
    });

    return request;
  }

  static async removeTestUser() {
    await prismaClient.user.deleteMany({ where: { username: "test" } });
  }

  static async getTestUser() {
    return await prismaClient.user.findUnique({
      where: { username: "test" },
    });
  }
}
