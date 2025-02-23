import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthService } from 'src/auth/auth.service';
import { ApiResponseDto } from 'src/core/dto/api-response.dto';
import { UserTypeEnum } from 'src/core/enums/user-type.enum';
import { AuthUtils } from 'src/core/utils/auth.utils';
import { IsUserExistDto } from 'src/users/dto/user.dto';
import { UserService } from 'src/users/users.service';
import { DbQueryConditionDto } from './dto/db-query-condition.dto';
import { StudentDto, UpdateStudentDto, UpdateStudentEnrollmentsDto } from './dto/student.dto';
import { StudentRepository } from './repository/student.repository';
import { transformId } from 'src/core/utils/mongo-res.utils';

@Injectable()
export class StudentService {
    constructor(
        private studentRepository: StudentRepository,
        private readonly authService: AuthService,
        private userService: UserService,
    ) { }

    async CreateStudent(studentDto: StudentDto, request): Promise<ApiResponseDto> {

        const userExistData: IsUserExistDto = {
            username: studentDto.email,
            userType: UserTypeEnum.STUDENT,
            branchId: request.userSession.branchId,
            organizationId: request.userSession.organizationId,
        };

        const isUserExist: boolean = await this.userService.isUserExist(userExistData);
        if (isUserExist) {
            return new ApiResponseDto(false, 'Student already exist');
        }

        const password: string = AuthUtils.generateSecurePassword(8);
        const hasPassword: string = await AuthUtils.createPasswordHash(password);
        studentDto = {
            ...studentDto,
            branchId: request.userSession.branchId,
            organizationId: request.userSession.organizationId,
            password: hasPassword
        }
        const res: string = await this.studentRepository.create(studentDto);

        if (Types.ObjectId.isValid(res)) {
            const mailObj = {
                name: studentDto.firstName + ' ' + studentDto?.lastName,
                email: studentDto.email
            }
            const verificationLink: string = await this.authService.createVerificationLink(
                mailObj
            );
            try {
                await this.userService.sendWelcomeEmail({ ...mailObj, password: password, username: studentDto.email });
                await this.userService.sendVerificationMail(
                    {
                        ...mailObj,
                        verificationLink,
                        currentYear: new Date().getFullYear()
                    });
            } catch (error) {
                console.log("error during sending mail");
            }

            const studentData = await this.fetchStudent({ _id: new Types.ObjectId(res) });
            return new ApiResponseDto(true, 'Student created succesfully', studentData);
        }
        return new ApiResponseDto(false, 'Student not created, please try again.');
    }

    async fetchStudent(condition: DbQueryConditionDto) {
        return await this.studentRepository.fetchStudentWithDetails(condition);
    }

    async searchStudent(keyword: string, limit = 10) {
        return await this.studentRepository.searchStudentNamesLike(keyword, limit);
    }

    async updateStudent(studentDto: UpdateStudentDto) {
        const updatedStudent = await this.studentRepository.update(studentDto);
        if (!updatedStudent) {
            throw new NotFoundException(`Student not found`);
        }
        return updatedStudent;
    }
    async removeStudent(id: string) {
        const response = await this.studentRepository.delete(id);
        return response
    }

    async updateStudentEnrollments(updateEnrollmentsDto: UpdateStudentEnrollmentsDto): Promise<ApiResponseDto> {
        try {
            await this.studentRepository.updateEnrollments(
                updateEnrollmentsDto.studentIds,
                updateEnrollmentsDto.classIds
            );
            return new ApiResponseDto(true, 'Student enrollments updated successfully');
        } catch (error) {
            console.error('Error updating student enrollments:', error);
            if (error instanceof NotFoundException) {
                return new ApiResponseDto(false, error.message);
            }
            return new ApiResponseDto(false, 'Failed to update student enrollments');
        }
    }
}