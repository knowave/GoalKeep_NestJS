import { DataSource, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Injectable } from '@nestjs/common';
import { GET_USER_BY_ID_FOR_PROFILE } from './constant/get-user-by-id-for-profile.constant';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private readonly dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async getUserByEmail(email: string): Promise<User> {
    return await this.createQueryBuilder('user')
      .where('user.email = :email', { email })
      .getOne();
  }

  async getUserById(id: string): Promise<User> {
    return await this.createQueryBuilder('user')
      .where('user.id = :id', { id })
      .getOne();
  }

  async getUserByUsernameOrNickname(name: string): Promise<User> {
    return await this.createQueryBuilder('user')
      .where('user.username = :username', { username: name })
      .orWhere('user.nickname = :nickname', { nickname: name })
      .getOne();
  }

  async followerIncrement(id: string): Promise<void> {
    await this.increment({ id }, 'followerCount', 1);
  }

  async followingIncrement(id: string): Promise<void> {
    await this.increment({ id }, 'followingCount', 1);
  }

  async followerDecrement(id: string): Promise<void> {
    await this.decrement({ id }, 'followerCount', 1);
  }

  async followingDecrement(id: string): Promise<void> {
    await this.decrement({ id }, 'followingCount', 1);
  }

  async getUserByIdForProfile(id: string): Promise<User> {
    return await this.createQueryBuilder('user')
      .innerJoin('user.feeds', 'feed')
      .innerJoin('user.plans', 'plan')
      .innerJoin('plan.subPlans', 'subPlan')
      .addSelect(GET_USER_BY_ID_FOR_PROFILE)
      .where('user.id = :id', { id })
      .getOne();
  }
}
