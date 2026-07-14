import { prismaClient } from "../applications/database";
import { RegisterUserRequest, toUserResponse, UserResponse } from "../model/user-model";
import { UserValidation } from "../validation/user-validation";

export class UserService {
  static async register(request: RegisterUserRequest): Promise<UserResponse> {
    //validation request
    request = UserValidation.REGISTER.parse(request);
    const totalUserWithSameUsername = await prismaClient.user.count({
      where: {
        username: request.username,
      },
    });

    //cek apakah ada di database atau tidak
    if (totalUserWithSameUsername > 0) {
      throw new Error("Username already exists");
    }

    //hashing password with bcrypt
    request.password = await Bun.password.hash(request.password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    // save ke database
    const user = await prismaClient.user.create({
      data: request,
    });

    // return response
    return toUserResponse(user);
  }
}
