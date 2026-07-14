import { prismaClient } from "../applications/database";
import { LoginUserRequest, RegisterUserRequest, toUserResponse, UserResponse } from "../model/user-model";
import { UserValidation } from "../validation/user-validation";

export class UserService {
  static async register(request: RegisterUserRequest): Promise<UserResponse> {
    request = UserValidation.REGISTER.parse(request);
    const totalUserWithSameUsername = await prismaClient.user.count({
      where: { username: request.username },
    });

    if (totalUserWithSameUsername > 0) {
      throw new Error("Username already exists");
    }

    request.password = await Bun.password.hash(request.password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    const user = await prismaClient.user.create({ data: request });

    return toUserResponse(user);
  }

  static async login(request: LoginUserRequest): Promise<UserResponse> {
    request = UserValidation.LOGIN.parse(request);

    const user = await prismaClient.user.findUnique({
      where: { username: request.username },
    });

    if (!user) {
      throw new Error("Username or password is wrong");
    }

    const passwordValid = await Bun.password.verify(
      request.password,
      user.password,
    );

    if (!passwordValid) {
      throw new Error("Username or password is wrong");
    }

    const token = crypto.randomUUID();
    const updated = await prismaClient.user.update({
      where: { username: user.username },
      data: { token },
    });

    return toUserResponse(updated);
  }
}
