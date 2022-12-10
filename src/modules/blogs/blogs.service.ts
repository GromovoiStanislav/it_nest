import { BlogsRepository } from "./blogs.repository";
import { ViewBlogDto } from "./dto/view-blog.dto";
import { InputBlogDto } from "./dto/input-blog.dto";
import BlogMapper from "./dto/blogsMapper";
import { PaginationParams } from "../../commonDto/paginationParams.dto";
import { PaginatorDto } from "../../commonDto/paginator.dto";
import { CommandBus, CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { BlogOwnerDto } from "./dto/blog-owner.dto";
import { GetUserByIdCommand } from "../users/users.service";
import { InputBanBlogDto } from "./dto/input-ban-blog.dto";
import { BanBlogInfo } from "./dto/blog-banInfo.dto";
import dateAt from "../../utils/DateGenerator";



//////////////////////////////////////////////////////////////
export class ClearAllBlogsCommand {
  constructor() {
  }
}

@CommandHandler(ClearAllBlogsCommand)
export class ClearAllBlogsUseCase implements ICommandHandler<ClearAllBlogsCommand> {
  constructor(protected blogsRepository: BlogsRepository) {
  }

  async execute(command: ClearAllBlogsCommand) {
    await this.blogsRepository.clearAll();
  }
}

//////////////////////////////////////////////////////////////
export class CreateBlogCommand {
  constructor(public inputBlog: InputBlogDto, public userId: string) {
  }
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase implements ICommandHandler<CreateBlogCommand> {
  constructor(
    private commandBus: CommandBus,
    protected blogsRepository: BlogsRepository) {
  }

  async execute(command: CreateBlogCommand): Promise<ViewBlogDto> {

    const user = await this.commandBus.execute(new GetUserByIdCommand(command.userId));
    if (!user) {
      throw  new UnauthorizedException();
    }

    const blogOwner: BlogOwnerDto = {
      userId: user.id,
      userLogin: user.login
    };

    const blog = await this.blogsRepository.createBlog(BlogMapper.fromInputToCreate(command.inputBlog, blogOwner));
    return BlogMapper.fromModelToView(blog);
  }
}

//////////////////////////////////////////////////////////////
export class UpdateBlogCommand {
  constructor(public blogId: string, public inputBlog: InputBlogDto, public userId: string) {
  }
}

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase implements ICommandHandler<UpdateBlogCommand> {
  constructor(
    private commandBus: CommandBus,
    protected blogsRepository: BlogsRepository) {
  }

  async execute(command: UpdateBlogCommand): Promise<void> {

    const user = await this.commandBus.execute(new GetUserByIdCommand(command.userId));
    if (!user) {
      throw  new UnauthorizedException();
    }

    const blog = await this.blogsRepository.getOneBlog(command.blogId);
    if (!blog) {
      throw new NotFoundException();
    }

    if (command.userId !== blog.blogOwnerInfo.userId) {
      throw new ForbiddenException();
    }
    await this.blogsRepository.updateBlog(command.blogId, BlogMapper.fromInputToUpdate(command.inputBlog));
  }
}

//////////////////////////////////////////////////////////////
export class DeleteBlogCommand {
  constructor(public blogId: string, public userId: string) {
  }
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogUseCase implements ICommandHandler<DeleteBlogCommand> {
  constructor(
    protected blogsRepository: BlogsRepository) {
  }

  async execute(command: DeleteBlogCommand): Promise<void> {

    const blog = await this.blogsRepository.getOneBlog(command.blogId);
    if (!blog) {
      throw new NotFoundException();
    }

    if (command.userId !== blog.blogOwnerInfo.userId) {
      throw new ForbiddenException();
    }

    await this.blogsRepository.deleteBlog(command.blogId);
  }
}


//////////////////////////////////////////////////////////////
export class GetOneBlogCommand {
  constructor(public blogId: string, public withBlogOwner: boolean = false) {
  }
}

@CommandHandler(GetOneBlogCommand)
export class GetOneBlogUseCase implements ICommandHandler<GetOneBlogCommand> {
  constructor(protected blogsRepository: BlogsRepository) {
  }

  async execute(command: GetOneBlogCommand): Promise<ViewBlogDto | null> {
    const blog = await this.blogsRepository.getOneBlog(command.blogId);
    if (blog) {
      return BlogMapper.fromModelToView(blog, command.withBlogOwner);
    }
    return null;
  }
}


//////////////////////////////////////////////////////////////
export class GetAllBlogsCommand {
  constructor(public searchName: string, public paginationParams: PaginationParams, public sa: boolean = false) {
  }
}

@CommandHandler(GetAllBlogsCommand)
export class GetAllBlogsUseCase implements ICommandHandler<GetAllBlogsCommand> {
  constructor(protected blogsRepository: BlogsRepository) {
  }

  async execute(command: GetAllBlogsCommand): Promise<PaginatorDto<ViewBlogDto[]>> {
    let includBanned = false;
    //let withBlogOwner = false;

    if (command.sa) {
      includBanned = true;
      //withBlogOwner = true;
    }

    const result = await this.blogsRepository.getAllBlogs(command.searchName, command.paginationParams, includBanned);
    return BlogMapper.fromModelsToPaginator(result, command.sa);
  }
}

//////////////////////////////////////////////////////////////
export class BindBlogWithUserCommand {
  constructor(public blogId: string, public userId: string) {
  }
}

@CommandHandler(BindBlogWithUserCommand)
export class BindBlogWithUserUseCase implements ICommandHandler<BindBlogWithUserCommand> {
  constructor(
    private commandBus: CommandBus,
    private blogsRepository: BlogsRepository) {
  }

  async execute(command: BindBlogWithUserCommand): Promise<void> {
    const blog = await this.blogsRepository.getOneBlog(command.blogId);
    if (!blog) {
      throw new BadRequestException("blog not found");
    }
    if (blog.blogOwnerInfo.userId) {
      throw new BadRequestException("blogId has user already");
    }

    const user = await this.commandBus.execute(new GetUserByIdCommand(command.userId));
    if (!user) {
      throw new BadRequestException("user not found");
    }

    const blogOwner: BlogOwnerDto = {
      userId: user.id,
      userLogin: user.login
    };

    await this.blogsRepository.bindBlogWithUser(command.blogId, blogOwner);
  }
}


//////////////////////////////////////////////////////////////
export class GetAllBlogsByUserIdCommand {
  constructor(public searchName: string, public paginationParams: PaginationParams, public userId: string) {
  }
}

@CommandHandler(GetAllBlogsByUserIdCommand)
export class GetAllBlogsByUserIdUseCase implements ICommandHandler<GetAllBlogsByUserIdCommand> {
  constructor(protected blogsRepository: BlogsRepository) {
  }

  async execute(command: GetAllBlogsByUserIdCommand): Promise<PaginatorDto<ViewBlogDto[]>> {
    const result = await this.blogsRepository.getAllBlogs(command.searchName, command.paginationParams, false, command.userId);
    return BlogMapper.fromModelsToPaginator(result, false);
  }
}


//////////////////////////////////////////////////////////////
export class BanBlogCommand {
  constructor(public blogId: string, public inputBanBlog: InputBanBlogDto) {
  }
}

@CommandHandler(BanBlogCommand)
export class BanBlogUseCase implements ICommandHandler<BanBlogCommand> {
  constructor(protected blogsRepository: BlogsRepository) {
  }

  async execute(command: BanBlogCommand): Promise<void> {

    const banInfo = new BanBlogInfo();
    if (command.inputBanBlog.isBanned) {
      banInfo.isBanned = true;
      banInfo.banDate = dateAt();
    }

    await this.blogsRepository.banBlog(command.blogId, banInfo);
  }
}

////////////////////////////////////////////////////
export class GetIdBannedBlogsCommand {
  constructor() {
  }
}

@CommandHandler(GetIdBannedBlogsCommand)
export class GetIdBannedBlogsUseCase implements ICommandHandler<GetIdBannedBlogsCommand> {
  constructor(protected blogsRepository: BlogsRepository) {
  }

  async execute(command: GetIdBannedBlogsCommand): Promise<string[]> {
    const users = await this.blogsRepository.getBanedBlogs();
    return users.map(user => user.id)
  }
}