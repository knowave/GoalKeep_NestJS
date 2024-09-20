import { Injectable, NotFoundException } from '@nestjs/common';
import { FeedRepository } from './feed.repository';
import { Feed } from '../entities/feed.entity';
import { CreateFeedDto } from './dto/create-feed.dto';
import { User } from 'src/user/entities/user.entity';
import { S3Service } from 'src/s3/s3.service';
import { v4 as uuid } from 'uuid';
import { NOT_FOUND_FEED } from '../error/feed.error';
import { IPage } from 'src/common/types/page';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class FeedService {
  constructor(
    private readonly feedRepository: FeedRepository,
    private readonly s3Service: S3Service,
  ) {}

  async createFeed(createFeedDto: CreateFeedDto, user: User): Promise<Feed> {
    const { title, thumbnail, content, isPublic } = createFeedDto;
    let thumbnailUrl: string;

    if (thumbnail) {
      const { fileName, mimeType, fileContent } = thumbnail;
      const newFileName = `${uuid()}-${fileName}`;

      const uploadFile = await this.s3Service.uploadObject(
        newFileName,
        fileContent,
        mimeType,
      );

      thumbnailUrl = uploadFile.Key;
    }

    return await this.feedRepository.save(
      this.feedRepository.create({
        title,
        thumbnail: thumbnailUrl,
        content,
        isPublic: !isPublic ? false : true,
        user,
      }),
    );
  }

  async getMyFeed(feedId: string, userId: string): Promise<Feed> {
    const feed = await this.feedRepository.getFeedByIdAndUserId(feedId, userId);

    if (!feed) throw new NotFoundException(NOT_FOUND_FEED);

    return feed;
  }

  async getMyFeeds(
    paginationDto: PaginationDto,
    userId: string,
  ): Promise<IPage<Feed>> {
    const [feeds, totalCount] =
      await this.feedRepository.getFeedsByUserIdWithUser(paginationDto, userId);

    return {
      data: feeds,
      totalCount,
      pageInfo: {
        currentPage: paginationDto.page,
        totalPages: Math.ceil(totalCount / paginationDto.limit),
        hasNextPage: paginationDto.page * paginationDto.limit < totalCount,
      },
    };
  }
}
