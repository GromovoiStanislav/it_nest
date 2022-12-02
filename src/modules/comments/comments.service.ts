import { CommandBus, CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { CommentsRepository } from "./comments.repository";
import { CommentLikesRepository } from "./commentLikes.repository";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { InputCommentDto } from "./dto/input-comment.dto";
import CommentsMapper from "./dto/commentsMapper";
import { GetOnePostCommand } from "../posts/posts.service";
import { GetUserByIdCommand, GetUserByIdUseCase } from "../users/users.service";


//////////////////////////////////////////////////
export class ClearAllCommentsCommand {
}

@CommandHandler(ClearAllCommentsCommand)
export class ClearAllCommentsUseCase implements ICommandHandler<ClearAllCommentsCommand> {
  constructor(
    protected commentsRepository: CommentsRepository,
    protected commentLikesRepository: CommentLikesRepository
  ) {
  }

  async execute(command: ClearAllCommentsCommand) {
    await Promise.all([
      await this.commentsRepository.clearAll(),
      await this.commentLikesRepository.clearAll()
    ]).catch(() => {
    });
  }
}

//////////////////////////////////////////////////////////////
export class DeleteCommentCommand {
  constructor(public commentId: string, public userId: string) {
  }
}

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentUseCase implements ICommandHandler<DeleteCommentCommand> {
  constructor(protected commentsRepository: CommentsRepository) {
  }

  async execute(command: DeleteCommentCommand): Promise<void> {
    const comment = await this.commentsRepository.findComment(command.commentId);
    if (!comment) {
      throw new NotFoundException();
    }
    if (comment.userId !== command.userId) {
      throw new ForbiddenException();
    }
    await this.commentsRepository.deleteComment(command.commentId);
  }
}


//////////////////////////////////////////////////////////////
export class UpdateCommentCommand {
  constructor(public commentId: string, public userId: string, public inputComment: InputCommentDto) {
  }
}

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentUseCase implements ICommandHandler<UpdateCommentCommand> {
  constructor(protected commentsRepository: CommentsRepository) {
  }

  async execute(command: UpdateCommentCommand): Promise<void> {
    const comment = await this.commentsRepository.findComment(command.commentId);
    if (!comment) {
      throw new NotFoundException();
    }
    if (comment.userId !== command.userId) {
      throw new ForbiddenException();
    }
    await this.commentsRepository.updateComment(command.commentId, CommentsMapper.fromInputToUpdate(command.inputComment));
  }
}


//////////////////////////////////////////////////////////////
export class UpdateCommentLikeCommand {
  constructor(public commentId: string, public userId: string, public likeStatus: string) {
  }
}

@CommandHandler(UpdateCommentLikeCommand)
export class UpdateCommentLikeUseCase implements ICommandHandler<UpdateCommentLikeCommand> {
  constructor(
    protected commentsRepository: CommentsRepository,
    protected commentLikesRepository: CommentLikesRepository
  ) {
  }

  async execute(command: UpdateCommentLikeCommand): Promise<void> {
    const comment = await this.commentsRepository.findComment(command.commentId);
    if (!comment) {
      throw new NotFoundException();
    }
    if (command.likeStatus === "None") {
      await this.commentLikesRepository.deleteByCommentIDUserID(command.commentId, command.userId);
    } else {
      await this.commentLikesRepository.updateLikeByID(command.commentId, command.userId, command.likeStatus);
    }
  }
}


//////////////////////////////////////////////////////////////
export class GetCommentCommand {
  constructor(public commentId: string, public userId: string) {
  }
}

@CommandHandler(GetCommentCommand)
export class GetCommentUseCase implements ICommandHandler<GetCommentCommand> {
  constructor(
    protected commentsRepository: CommentsRepository,
    protected commentLikesRepository: CommentLikesRepository
  ) {
  }

  async execute(command: GetCommentCommand) {
    const comment = await this.commentsRepository.findComment(command.commentId);
    if (!comment) {
      throw new NotFoundException();
    }
    const likes = await this.commentLikesRepository.likesByCommentID(command.commentId, command.userId);
    return CommentsMapper.fromModelToView(comment, likes);
  }
}


//////////////////////////////////////////////////////////////
export class CreateCommentByPostIDCommand {
  constructor(public postId: string, public userId: string, public inputComment: InputCommentDto) {
  }
}

@CommandHandler(CreateCommentByPostIDCommand)
export class CreateCommentByPostIDUseCase implements ICommandHandler<CreateCommentByPostIDCommand> {
  constructor(
    private commandBus: CommandBus,
    protected commentsRepository: CommentsRepository
  ) {
  }

  async execute(command: CreateCommentByPostIDCommand) {
    const post = await this.commandBus.execute(new GetOnePostCommand(command.postId));
    if (!post) {
      throw new NotFoundException();
    }

    const user = await this.commandBus.execute(new GetUserByIdCommand(command.userId));

    const createCommentDto = CommentsMapper.fromInputToCreate(command.postId, command.inputComment, command.userId, user.login);
    const comment = await this.commentsRepository.createComment(createCommentDto);

    return CommentsMapper._fromModelToView(comment);
  }
}