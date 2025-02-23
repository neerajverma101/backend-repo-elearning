import { ConflictException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Class } from "src/core/schemas/class.schema";
import { ClassDto, UpdateClassDto } from "../dto/class.dto";
import { GetClassQueryDto } from "../dto/get-class-query.dto";
import { ClassWithDetails } from "src/core/interface/class.interface";
import { DEFAULT_BRANCH_ID } from "src/core/utils/string.utils";

@Injectable()
export class ClassRepository {
    constructor(
        @InjectModel(Class.name) private classModel: Model<Class>,
    ) { }

    async create(classDto: ClassDto): Promise<boolean> {
        try {
            const createClass = new this.classModel({ ...classDto, ...DEFAULT_BRANCH_ID });
            const res = await createClass.save();
            return res ? true : false;
        } catch (error) {
            if (error.code === 11000) {
                throw new ConflictException('Class already exists');
            }
            throw error;
        }
    }

    async fetchClassDetails(condition: GetClassQueryDto): Promise<any> {
        try {
            const query = {};

            if (condition.branchId) {
                query['branchId'] = new Types.ObjectId(condition.branchId);
            }

            if (condition._id) {
                query['_id'] = new Types.ObjectId(condition._id);
            }

            const result: ClassWithDetails[] = await this.classModel.aggregate([
                { $match: { ...query } },
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
                        from: 'teacherenrollments',
                        localField: '_id',
                        foreignField: 'classId',
                        as: 'teacherEnrollments'
                    }
                },
                {
                    $lookup: {
                        from: 'teachers',
                        localField: 'teacherEnrollments.teacherId',
                        foreignField: '_id',
                        as: 'teachers'
                    }
                },
                {
                    $lookup: {
                        from: 'studentenrollments',
                        localField: '_id',
                        foreignField: 'classId',
                        as: 'studentEnrollments'
                    }
                },
                {
                    $lookup: {
                        from: 'students',
                        localField: 'studentEnrollments.studentId',
                        foreignField: '_id',
                        as: 'students'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        className: 1,
                        branch: {
                            _id: '$branch._id',
                            name: '$branch.name'
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
                                    phone: '$$teacher.phone',
                                    enrollment: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$teacherEnrollments',
                                                    as: 'enrollment',
                                                    cond: { $eq: ['$$enrollment.teacherId', '$$teacher._id'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                }
                            }
                        },
                        students: {
                            $map: {
                                input: '$students',
                                as: 'student',
                                in: {
                                    _id: '$$student._id',
                                    firstName: '$$student.firstName',
                                    lastName: '$$student.lastName',
                                    email: '$$student.email',
                                    phone: '$$student.phone',
                                    enrollment: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$studentEnrollments',
                                                    as: 'enrollment',
                                                    cond: { $eq: ['$$enrollment.studentId', '$$student._id'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                }
                            }
                        }
                    }
                }
            ]).exec();

            return result.length > 0 ? JSON.parse(JSON.stringify(result, null, 2)) : null;
        } catch (error) {
            console.error('Error fetching class with details:', error);
            throw new Error('Error fetching class with details');
        }
    }

    async deleteClass(id: string): Promise<void> {
        try {
            const res = await this.classModel.findByIdAndDelete(new Types.ObjectId(id)).exec();
            return res
        } catch (error) {
            console.error('Error deleting class:', error);
            throw new Error('Error deleting class');
        }
    }

    async updateClass(updateClassDto: UpdateClassDto): Promise<any> {
        try {
            const res = await this.classModel.findByIdAndUpdate(new Types.ObjectId(updateClassDto._id), updateClassDto).exec();
            return res;
        } catch (error) {
            console.error('Error updating class:', error);
            throw new Error('Error updating class');
        }
    }
}