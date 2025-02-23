import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsDateString, IsEmail, IsPhoneNumber, IsOptional, IsMongoId, IsInt, Min, IsArray } from 'class-validator';
import { Types } from 'mongoose';

export class StudentDto {
  @ApiProperty({ description: 'Branch ID of the student' })
  @IsMongoId()
  @IsOptional()
  branchId: Types.ObjectId;

  @ApiProperty({ description: 'Organization ID of the student' })
  @IsMongoId()
  @IsOptional()
  organizationId: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  lastName: string;

  @IsNotEmpty()
  @IsDateString()
  dateOfBirth: Date;

  @IsNotEmpty()
  @IsString()
  gender: string;

  @IsNotEmpty()
  @IsDateString()
  @IsOptional()
  enrollmentDate: Date;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()  // Validate based on the phone number format in your locale
  phone: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  countryId: Types.ObjectId;

  @IsNotEmpty()
  stateId: Types.ObjectId;

  @IsNotEmpty()
  cityId: Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  pincode: string;

  @ApiProperty({ description: 'password of the student\'s' })
  @IsString()
  @IsOptional()
  password: string;

  @ApiProperty({ description: 'Class ID of the student' })
  @IsMongoId()
  @IsOptional()
  classId: Types.ObjectId;
}

export class SearchStudentDto {
  @IsString()
  keyword: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

export class UpdateStudentDto {
  @ApiProperty({ description: 'ID of the student to update' })
  @IsNotEmpty()
  @IsMongoId()
  _id: Types.ObjectId;

  @ApiPropertyOptional({ description: 'Branch ID of the student' })
  @IsOptional()
  @IsMongoId()
  branchId?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'First name of the student' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name of the student' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Email of the student' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number of the student' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Address of the student' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Country ID of the student' })
  @IsOptional()
  @IsMongoId()
  countryId?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'State ID of the student' })
  @IsOptional()
  @IsMongoId()
  stateId?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'City ID of the student' })
  @IsOptional()
  @IsMongoId()
  cityId?: Types.ObjectId;

  @ApiPropertyOptional({ description: 'Pincode of the student\'s address' })
  @IsOptional()
  @IsString()
  pincode?: string;
}

export class UpdateStudentEnrollmentsDto {
  @ApiProperty({ description: 'Array of Student IDs', type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  studentIds: Types.ObjectId[];

  @ApiProperty({ description: 'Array of Class IDs', type: [String] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  classIds: Types.ObjectId[];
}