import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UsersController } from "./users.controller";
import {
  ClearAllUsersCommand,
  CreateUserUseCase,
  DeleteUserUseCase,
  FindAllUsersUseCase,
  UsersService
} from "./users.service";
import { User, UserSchema } from "./schemas/users.schema";
import { UsersRepository } from "./users.repository";
import { CqrsModule } from "@nestjs/cqrs";

const useCases = [
  ClearAllUsersCommand,
  FindAllUsersUseCase,
  DeleteUserUseCase,
  CreateUserUseCase
];

@Module({
  imports: [CqrsModule, MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [UsersController],
  providers: [...useCases, UsersService, UsersRepository],
  exports: [...useCases, UsersService, UsersRepository]
})
export class UsersModule {
}