import { Model } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Blog, BlogDocument } from "./schemas/blogs.schema";
import { CreateBlogDto } from "./dto/create-blog.dto";
import { PaginatorDto } from "../../commonDto/paginator.dto";
import { PaginationParams } from "../../commonDto/paginationParams.dto";
import { UpdateBlogDto } from "./dto/update-blog.dto";


@Injectable()
export class BlogsRepository {

  constructor(@InjectModel(Blog.name) private blogModel: Model<BlogDocument>) {
  }


  async clearAll(): Promise<void> {
    await this.blogModel.deleteMany({});
  }


  async deleteBlog(blogId: string): Promise<Blog | null> {
    return this.blogModel.findOneAndDelete({ id: blogId });
  }


  async createBlog(createBlogDto: CreateBlogDto): Promise<Blog> {
    const createdBlog = new this.blogModel(createBlogDto);
    return await createdBlog.save();
  }


  async updateBlog(blogId: string, updateBlogDto: UpdateBlogDto): Promise<Blog | null> {
    return this.blogModel.findOneAndUpdate({ id: blogId }, updateBlogDto);
  }


  async getOneBlog(blogId: string): Promise<Blog | null> {
    return this.blogModel.findOne({ id: blogId });
  }


  async getAllBlogs(searchName: string, {
    pageNumber,
    pageSize,
    sortBy,
    sortDirection
  }: PaginationParams): Promise<PaginatorDto<Blog[]>> {

    type FilterType = {
      [key: string]: unknown
    }
    const filter: FilterType = {};
    if (searchName) {
      filter.name = RegExp(`${searchName}`, "i");
    }

    const items = await this.blogModel.find(filter).sort({ [sortBy]: sortDirection === "asc" ? 1 : -1 })
      .limit(pageSize).skip((pageNumber - 1) * pageSize);

    const totalCount = await this.blogModel.countDocuments(filter);
    const pagesCount = Math.ceil(totalCount / pageSize);
    const page = pageNumber;

    return { pagesCount, page, pageSize, totalCount, items };
  }


}