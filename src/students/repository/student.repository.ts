import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { StudentWithDetailsInterface } from "src/core/interface/student.interface";
import { Student } from "src/core/schemas/student.schema";
import { DbQueryConditionDto } from "../dto/db-query-condition.dto";
import { StudentDto, UpdateStudentDto } from "../dto/student.dto";
import { UserTypeEnum } from "src/core/enums/user-type.enum";
import { UserService } from "src/users/users.service";
import { StudentEnrollment } from "src/core/schemas/student-enrollment.schema";
import { transformId } from "src/core/utils/mongo-res.utils";
@Injectable()
export class StudentRepository {
  constructor(
    @InjectModel(Student.name) private studentModel: Model<Student>,
    @InjectModel(StudentEnrollment.name) private studentEnrollmentModel: Model<StudentEnrollment>,
    private userService: UserService
  ) { }

  async create(studentData: StudentDto): Promise<string> {
    const session = await this.studentModel.db.startSession();
    session.startTransaction();
    try {
      const { password, organizationId, classId, ...studentObj } = studentData;
      const createStudet = await this.studentModel.create([studentObj], { session });
      const authData = {
        userId: createStudet[0]._id.toString(),
        username: createStudet[0].email,
        name: `${studentData.firstName} ${studentData.lastName}`,
        password: password,
        isVerified: false,
        userType: UserTypeEnum.STUDENT,
        branchId: createStudet[0].branchId.toString(),
        organizationId
      }

      await this.userService.createAuth(authData, session);

      if (classId) {
        const studentEnrollmentData = {
          branchId: createStudet[0].branchId.toString(),
          studentId: createStudet[0]._id.toString(),
          classId: classId,
          enrollmentDate: new Date()
        };

        await this.studentEnrollmentModel.create([studentEnrollmentData], { session });
      }

      await session.commitTransaction();
      return createStudet[0]._id.toString();
    } catch (error) {
      await session.abortTransaction();
      if (error.code === 11000) { // MongoDB duplicate key error code
        throw new ConflictException('Student already exists');
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  async fetchStudentWithDetails(condition: DbQueryConditionDto): Promise<any> {
    try {
      const query = {};

      if (condition.branchId) {
        query['branchId'] = new Types.ObjectId(condition.branchId);
      }

      if (condition._id) {
        query['_id'] = new Types.ObjectId(condition._id);
      }

      const result: StudentWithDetailsInterface[] = await this.studentModel.aggregate([
        { $match: { ...query } },
        {
          $lookup: {
            from: 'studentenrollments',
            localField: '_id',
            foreignField: 'studentId',
            as: 'studentenrollments'
          }
        },
        {
          $lookup: {
            from: 'classes',
            localField: 'studentenrollments.classId',
            foreignField: '_id',
            as: 'classes'
          }
        },
        {
          $lookup: {
            from: 'teacherenrollments',
            localField: 'studentenrollments.classId',
            foreignField: 'classId',
            as: 'teacherenrollments'
          }
        },
        {
          $lookup: {
            from: 'teachers',
            localField: 'teacherenrollments.teacherId',
            foreignField: '_id',
            as: 'teachers'
          }
        },
        {
          $lookup: {
            from: 'parents',
            localField: '_id',
            foreignField: 'studentId',
            as: 'parents'
          }
        },
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
          $project: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            dateOfBirth: 1,
            gender: 1,
            enrollmentDate: 1,
            address: 1,
            pincode: 1,
            email: 1,
            phone: 1,
            branch: {
              _id: '$branch._id',
              name: '$branch.name'
            },
            city: {
              _id: '$city._id',
              name: '$city.name'
            },
            state: {
              _id: '$state._id',
              name: '$state.name'
            },
            country: {
              _id: '$country._id',
              name: '$country.name'
            },
            classes: {
              $map: {
                input: '$classes',
                as: 'class',
                in: {
                  _id: '$$class._id',
                  className: '$$class.className',
                  section: '$$class.section',
                  enrollmentDate: {
                    $arrayElemAt: [
                      '$studentenrollments.enrollmentDate',
                      { $indexOfArray: ['$studentenrollments.classId', '$$class._id'] }
                    ]
                  },
                  enrollmentEndDate: {
                    $arrayElemAt: [
                      '$studentenrollments.enrollmentEndDate',
                      { $indexOfArray: ['$studentenrollments.classId', '$$class._id'] }
                    ]
                  }
                }
              }
            },
            teachers: {
              $map: {
                input: '$teachers',
                as: 'teacher',
                in: {
                  _id: '$$teacher._id',
                  firstName: '$$teacher.firstName',
                  lastName: '$$teacher.lastName',
                  email: '$$teacher.email',
                  phone: '$$teacher.phone'
                }
              }
            },
            parents: {
              $map: {
                input: '$parents',
                as: 'parent',
                in: {
                  _id: '$$parent._id',
                  fatherName: '$$parent.fatherName',
                  motherName: '$$parent.motherName',
                  email: '$$parent.email',
                  phone: '$$parent.phone',
                  address: '$$parent.address',
                  pincode: '$$parent.pincode'
                }
              }
            }
          }
        }
      ]).exec();

      return result.length > 0 ? JSON.parse(JSON.stringify(result, null, 2)) : null;
    } catch (error) {
      console.error('Error fetching student with details:', error);
      throw new Error('Error fetching student with details');
    }
  }

  async searchStudentNamesLike(keyword: string, limit = 10) {
    const result = await this.studentModel.aggregate([
      {
        $match: {
          $or: [
            { firstName: { $regex: keyword, $options: 'i' } },
            { lastName: { $regex: keyword, $options: 'i' } }
          ]
        }
      },
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
          from: 'countries',
          localField: 'countryId',
          foreignField: '_id',
          as: 'country'
        }
      },
      { $unwind: { path: '$country', preserveNullAndEmptyArrays: true } },
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
          from: 'cities',
          localField: 'cityId',
          foreignField: '_id',
          as: 'city'
        }
      },
      { $unwind: { path: '$city', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          fullName: {
            $concat: [
              '$firstName',
              ' ',
              '$lastName',
              ' (id: ',
              {
                $substr: [
                  { $toString: '$_id' },
                  { $subtract: [{ $strLenCP: { $toString: '$_id' } }, 4] },
                  4
                ]
              },
              ')'
            ]
          },
          branch: { _id: 1, name: 1 },
          class: { _id: 1, className: 1 },
          country: { _id: 1, name: 1 },
          state: { _id: 1, name: 1 },
          city: { _id: 1, name: 1 },
          email: 1,
          phone: 1,
          address: 1,
          pincode: 1
        }
      },
      { $limit: limit }
    ]).exec();

    return JSON.parse(JSON.stringify(result));
  }

  async update(updateTeacherDto: UpdateStudentDto): Promise<Student> {
    try {
      const { _id, ...updateData } = updateTeacherDto;
      console.log(_id);
      const updatedStudent = await this.studentModel.findByIdAndUpdate(
        _id,
        updateData,
        { new: true, runValidators: true }
      );
      if (!updatedStudent) {
        throw new NotFoundException('Student not found');
      }
      return transformId(updatedStudent);
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Email or phone number already exists');
      }
      throw error;
    }
  }

  async delete(id: string) {
    console.log(id);
    const data = this.studentModel.findByIdAndDelete(id).exec();
    return data;
  }

  async updateEnrollments(studentIds: Types.ObjectId[], classIds: Types.ObjectId[]): Promise<void> {
    const session = await this.studentModel.db.startSession();
    session.startTransaction();

    try {
      const students = await this.studentModel.find({ _id: { $in: studentIds } }).select('branchId');
      if (students.length !== studentIds.length) {
        throw new NotFoundException('One or more students not found');
      }

      // Remove existing enrollments for the specified students
      await this.studentEnrollmentModel.deleteMany({
        teacherId: { $in: studentIds }
      }, { session });

      // Prepare bulk insert operation
      const bulkOps = students.flatMap(teacher =>
        classIds.map(classId => ({
          insertOne: {
            document: {
              branchId: teacher.branchId,
              studentId: teacher._id,
              classId: classId,
              enrollmentDate: new Date()
            }
          }
        }))
      );

      // Execute bulk insert
      if (bulkOps.length > 0) {
        await this.studentEnrollmentModel.bulkWrite(bulkOps, { session });
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}