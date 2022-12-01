import uid from "../../../utils/IdGenerator";
import { PaginatorDto } from "../../../commonDto/paginator.dto";
import { CreatePostDto } from "./create-post.dto";
import dateAt from "../../../utils/DateGenerator";
import { InputPostDto } from "./input-post.dto";
import { ViewPostDto } from "./view-post.dto";
import { Post } from "../schemas/posts.schema";
import { ExtendedLikesInfoDto } from "../../../commonDto/extendedLikesInfoDto";
import { UpdatePostDto } from "./update-post.dto";


export default class PostMapper {

  static fromInputToCreate(inputPost: InputPostDto, blogName: string): CreatePostDto {
    const createPost =  new CreatePostDto();
    createPost.id = uid();
    createPost.title = inputPost.title;
    createPost.shortDescription = inputPost.shortDescription;
    createPost.content = inputPost.content;
    createPost.blogId = inputPost.blogId;
    createPost.blogName = blogName;
    createPost.createdAt = dateAt();
    return createPost
  }


  static fromUpdateToCreate(inputPost: InputPostDto, blogName:string): UpdatePostDto {
    const updatePost =  new UpdatePostDto();
    updatePost.title = inputPost.title;
    updatePost.shortDescription = inputPost.shortDescription;
    updatePost.content = inputPost.content;
    updatePost.blogId = inputPost.blogId;
    updatePost.blogName = blogName;
    return updatePost
  }


  static fromModelToView(post: Post, likes: ExtendedLikesInfoDto): ViewPostDto {
    const viewPost = new ViewPostDto();
    viewPost.id = post.id;
    viewPost.title = post.title;
    viewPost.shortDescription = post.shortDescription;
    viewPost.content = post.content;
    viewPost.blogId = post.blogId;
    viewPost.blogName = post.blogName;
    viewPost.createdAt = post.createdAt;
    viewPost.extendedLikesInfo = likes;
    return viewPost;
  }


  static _fromModelToView(post: Post): ViewPostDto {
    const viewPost = new ViewPostDto();
    viewPost.id = post.id;
    viewPost.title = post.title;
    viewPost.shortDescription = post.shortDescription;
    viewPost.content = post.content;
    viewPost.blogId = post.blogId;
    viewPost.blogName = post.blogName;
    viewPost.createdAt = post.createdAt;
    viewPost.extendedLikesInfo = new ExtendedLikesInfoDto();
    return viewPost;
  }

  static fromModelsToPaginator(posts: PaginatorDto<Post[]>): PaginatorDto<ViewPostDto[]> {
    return {
      pagesCount: posts.pagesCount,
      page: posts.page,
      pageSize: posts.pageSize,
      totalCount: posts.totalCount,
      items: posts.items.map(post => PostMapper._fromModelToView(post))
    }
  }

}