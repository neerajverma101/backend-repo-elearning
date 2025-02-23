import { ConflictException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { OnlineClass } from "src/core/schemas/online-class.schema";
import { HMSCreateRoomDto, OnlineClassDto, RoomInfoDto } from '../dto/online-class.dto';
import { GetOnlineClassQueryDto } from "../dto/get-online-class-query.dto";
import { OnlineClassWithDetails } from "src/core/interface/online-class.interface";
import { DEFAULT_BRANCH_ID } from "src/core/utils/string.utils";
import { DEFAULT_TEACHER } from '../../core/utils/string.utils';
import { DeleteResult } from "mongodb";

@Injectable()
export class OnlineClassRepository {
  constructor(@InjectModel(OnlineClass.name) private onlineClassModel: Model<OnlineClass>) { }

  async createOnlineClass(onlineClassDto: OnlineClassDto, roomInfoDto: RoomInfoDto): Promise<boolean> {
    const payload = { ...onlineClassDto, ...DEFAULT_BRANCH_ID, hmsRoomInfo: roomInfoDto }
    if (payload.teacherId === undefined) {
      payload.teacherId = DEFAULT_TEACHER;
    }
    try {
      const createTeacher = new this.onlineClassModel(payload);
      const res = await createTeacher.save();
      return res ? true : false;
    } catch (error) {
      if (error.code === 11000) { // MongoDB duplicate key error code
        throw new ConflictException('online class already exists');
      }
      throw error;
    }
  }

  async fetchOnlineClassWithDetails(condition: GetOnlineClassQueryDto): Promise<any> {
    try {
      let query = {};

      if (condition.branchId) {
        query['branchId'] = new Types.ObjectId(condition.branchId);
      }

      if (condition._id) {
        query['_id'] = new Types.ObjectId(condition._id);
      }

      if (condition.hmsRoomId) {
        query['hmsRoomInfo.id'] = condition.hmsRoomId;
      }

      const result: OnlineClassWithDetails[] = await this.onlineClassModel.aggregate([
        { $match: { ...query, "hmsRoomInfo.enabled": true } },
        {
          $lookup: {
            from: 'branches',
            localField: 'branchId',
            foreignField: '_id',
            as: 'branch'
          }
        },
        { $unwind: { path: '$branch', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'classes',
            localField: 'classId',
            foreignField: '_id',
            as: 'class'
          }
        },
        { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'teachers',
            localField: 'teacherId',
            foreignField: '_id',
            as: 'teacher'
          }
        },
        { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            thumbnail: 1,
            branch: {
              _id: '$branch._id',
              name: '$branch.name'
            },
            hmsRoomInfo: 1,
            scheduledDate: 1,
            startTime: 1,
            endTime: 1,
            createdAt: 1,
            class: {
              _id: '$class._id',
              className: '$class.className'
            },
            teacher: {
              _id: '$teacher._id',
              firstName: '$teacher.firstName',
              lastName: '$teacher.lastName'
            }
          }
        }
      ]).exec();

      return result.length > 0 ? JSON.parse(JSON.stringify(result, null, 2)) : null;
    } catch (error) {
      console.error('Error fetching online class with details:', error);
      throw new Error('Error fetching online class with details');
    }
  }

  async deleteOnlineClassByRoomId(roomId: string): Promise<DeleteResult> {
    try {
      const result = await this.onlineClassModel.deleteOne({ _id: roomId });
      return result;
    } catch (error) {
      console.error('Error deleting online class by room id:', error);
      throw new Error('Error deleting online class by room id');
    }
  }
}