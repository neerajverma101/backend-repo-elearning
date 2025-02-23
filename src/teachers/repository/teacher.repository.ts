import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Teacher } from "src/core/schemas/teacher.schema";
import { CreateTeacherDto, GetTeacherQueryDto, UpdateTeacherDto } from "../dto/teacher.dto";
import { TeacherWithDetails } from "src/core/interface/teacher.interface";
import { UserTypeEnum } from "src/core/enums/user-type.enum";
import { UserService } from "src/users/users.service";
import { TeacherEnrollment } from "src/core/schemas/teacher-enrollment.schema";
import { TeacherRoleEnum } from "src/core/enums/roles.enum";
import { DbStatusEnum } from "src/core/enums/status.enum";

@Injectable()
export class TeacherRepository {
  constructor(
    @InjectModel(Teacher.name) private teacherModel: Model<Teacher>,
    @InjectModel(TeacherEnrollment.name) private teacherEnrollmentModel: Model<TeacherEnrollment>,
    private userService: UserService
  ) { }

  async create(teacherData: CreateTeacherDto): Promise<string> {
    const session = await this.teacherModel.db.startSession();
    session.startTransaction();

    try {
      const { password, organizationId, classId, ...restTeacherObj } = teacherData;
      const teacher = await this.teacherModel.create([restTeacherObj], { session });

      const authData = {
        userId: teacher[0]._id.toString(),
        username: teacher[0].email,
        name: `${teacher[0].firstName} ${teacher[0].lastName}`,
        password: password,
        isVerified: false,
        userType: UserTypeEnum.TEACHER,
        branchId: teacherData.branchId,
        organizationId: teacherData.organizationId
      }

      await this.userService.createAuth(authData, session);

      if (classId) {
        for (const id of classId) {
          const teacherEnrollmentData = {
            branchId: teacherData.branchId,
            teacherId: teacher[0]._id.toString(),
            classId: id,
            status: DbStatusEnum.ACTIVE,
            role: TeacherRoleEnum.PRIMARY,
            enrollmentDate: new Date()
          };

          await this.teacherEnrollmentModel.create([teacherEnrollmentData], { session });
        }
      }

      await session.commitTransaction();

      return teacher[0]._id.toString();

    } catch (error) {

      await session.abortTransaction();

      if (error.code === 11000) { // MongoDB duplicate key error code
        throw new ConflictException('Teacher ID already exists');
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  async fetchTeacherWithDetails(condition: GetTeacherQueryDto): Promise<any> {
    try {
      const query = {};

      if (condition.branchId) {
        query['branchId'] = new Types.ObjectId(condition.branchId);
      }

      if (condition._id) {
        query['_id'] = new Types.ObjectId(condition._id);
      }

      const result: TeacherWithDetails[] = await this.teacherModel.aggregate([
        { $match: { ...query } }, // Match based on the query criteria
        {
          $lookup: {
            from: 'teacherenrollments',
            localField: '_id',
            foreignField: 'teacherId',
            as: 'teacherenrollments'
          }
        },
        {
          $lookup: {
            from: 'branches',
            localField: 'teacherenrollments.branchId',
            foreignField: '_id',
            as: 'branches'
          }
        },
        {
          $lookup: {
            from: 'classes',
            localField: 'teacherenrollments.classId',
            foreignField: '_id',
            as: 'classes'
          }
        },
        {
          $lookup: {
            from: 'cities',
            localField: 'cityId',
            foreignField: '_id',
            as: 'city'
          }
        },
        { $unwind: { path: '$city', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'states',
            localField: 'stateId',
            foreignField: '_id',
            as: 'state'
          }
        },
        { $unwind: { path: '$state', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'countries',
            localField: 'countryId',
            foreignField: '_id',
            as: 'country'
          }
        },
        { $unwind: { path: '$country', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'studentenrollments',
            localField: 'teacherenrollments.classId',
            foreignField: 'classId',
            as: 'studentenrollments'
          }
        },
        {
          $lookup: {
            from: 'students',
            localField: 'studentenrollments.studentId',
            foreignField: '_id',
            as: 'students'
          }
        },
        {
          $project: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            fullName: { $concat: ['$firstName', ' ', '$lastName'] },
            address: 1,
            pincode: 1,
            email: 1,
            phone: 1,
            teacherenrollments: {
              _id: 1,
              enrollmentDate: 1,
              enrollmentEndDate: 1,
              branchId: 1,
              classId: 1
            },
            branches: {
              _id: 1,
              name: 1
            },
            classes: {
              _id: 1,
              className: 1,
              section: 1
            },
            city: {
              _id: 1,
              name: 1
            },
            state: {
              _id: 1,
              name: 1
            },
            country: {
              _id: 1,
              name: 1
            },
            students: {
              _id: 1,
              firstName: 1,
              lastName: 1,
              email: 1,
              phone: 1,
              classId: 1
            }
          }
        }
      ]).exec();

      return result.length > 0 ? JSON.parse(JSON.stringify(result, null, 2)) : null;
    } catch (error) {
      console.error('Error fetching teacher with details:', error);
      throw new Error('Error fetching teacher with details');
    }
  }

  async update(updateTeacherDto: UpdateTeacherDto): Promise<Teacher> {
    try {
      const { _id, ...updateData } = updateTeacherDto;
      const updatedTeacher = await this.teacherModel.findByIdAndUpdate(
        _id,
        updateData,
        { new: true, runValidators: true }
      );
      if (!updatedTeacher) {
        throw new NotFoundException('Teacher not found');
      }
      return updatedTeacher;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Email or phone number already exists');
      }
      throw error;
    }
  }

  async updateEnrollments(teacherIds: Types.ObjectId[], classIds: Types.ObjectId[]): Promise<void> {
    const session = await this.teacherModel.db.startSession();
    session.startTransaction();

    try {
      const teachers = await this.teacherModel.find({ _id: { $in: teacherIds } }).select('branchId');
      if (teachers.length !== teacherIds.length) {
        throw new NotFoundException('One or more teachers not found');
      }

      // Remove existing enrollments for the specified teachers
      await this.teacherEnrollmentModel.deleteMany({
        teacherId: { $in: teacherIds }
      }, { session });

      // Prepare bulk insert operation
      const bulkOps = teachers.flatMap(teacher =>
        classIds.map(classId => ({
          insertOne: {
            document: {
              branchId: teacher.branchId,
              teacherId: teacher._id,
              classId: classId,
              status: DbStatusEnum.ACTIVE,
              role: TeacherRoleEnum.PRIMARY,
              enrollmentDate: new Date()
            }
          }
        }))
      );

      // Execute bulk insert
      if (bulkOps.length > 0) {
        await this.teacherEnrollmentModel.bulkWrite(bulkOps, { session });
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async fetchTeacherClasses(teacherId: Types.ObjectId): Promise<any[]> {
    try {
      const result = await this.teacherEnrollmentModel.aggregate([
        {
          $match: { teacherId: new Types.ObjectId(teacherId) }
        },
        {
          $lookup: {
            from: 'classes',
            localField: 'classId',
            foreignField: '_id',
            as: 'class'
          }
        },
        { $unwind: '$class' },
        {
          $project: {
            _id: '$class._id',
            className: '$class.className',
            section: '$class.section',
            enrollmentDate: 1,
            enrollmentEndDate: 1,
            status: 1,
            role: 1
          }
        }
      ]).exec();

      return result;
    } catch (error) {
      console.error('Error fetching teacher classes:', error);
      throw new Error('Error fetching teacher classes');
    }
  }

  async deleteTeachers(teacherIds: Types.ObjectId[]): Promise<{ deletedCount: number }> {
    const session = await this.teacherModel.db.startSession();
    session.startTransaction();

    try {
      const deleteTeachersResult = await this.teacherModel.deleteMany(
        { _id: { $in: teacherIds } },
        { session }
      );

      await this.teacherEnrollmentModel.deleteMany(
        { teacherId: { $in: teacherIds } },
        { session }
      );

      await session.commitTransaction();
      return { deletedCount: deleteTeachersResult.deletedCount };
    } catch (error) {
      await session.abortTransaction();
      console.error('Error deleting teachers:', error);
      throw new Error('Failed to delete teachers');
    } finally {
      session.endSession();
    }
  }
}