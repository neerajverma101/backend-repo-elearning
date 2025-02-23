import { IsNotEmpty, IsString, IsOptional, IsDateString, IsMongoId, IsBoolean } from "class-validator";
import { Types } from "mongoose";

export class OnlineClassDto {
    @IsOptional()
    @IsMongoId()
    branchId: Types.ObjectId;

    @IsNotEmpty()
    @IsMongoId()
    classId: Types.ObjectId;

    @IsNotEmpty()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNotEmpty()
    @IsDateString()
    scheduledDate: Date;

    @IsNotEmpty()
    @IsString()
    startTime: string;

    @IsNotEmpty()
    @IsString()
    endTime: string;

    @IsOptional()
    @IsMongoId()
    createdBy?: Types.ObjectId;

    @IsOptional()
    @IsMongoId()
    teacherId?: Types.ObjectId;

    @IsOptional()
    @IsString()
    thumbnail: string

    constructor(partial: Partial<OnlineClassDto>) {
        Object.assign(this, partial);
    }
}

export class UpdateOnlineClassDto {
    @IsNotEmpty()
    @IsMongoId()
    _id: Types.ObjectId;

    @IsOptional()
    @IsMongoId()
    branchId?: Types.ObjectId;

    @IsOptional()
    @IsMongoId()
    classId?: Types.ObjectId;

    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsDateString()
    scheduledDate?: Date;

    @IsOptional()
    @IsString()
    startTime?: string;

    @IsOptional()
    @IsString()
    endTime?: string;

    @IsOptional()
    @IsMongoId()
    teacherId?: Types.ObjectId;

    constructor(partial: Partial<UpdateOnlineClassDto>) {
        Object.assign(this, partial);
    }
}

export class RoomInfoDto {
    @IsNotEmpty()
    @IsString()
    id: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsBoolean()
    enabled: boolean;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNotEmpty()
    @IsString()
    customer_id: string;

    @IsNotEmpty()
    @IsString()
    app_id: string;

    @IsNotEmpty()
    recording_info: {
        enabled: boolean;
    };

    @IsNotEmpty()
    @IsString()
    template_id: string;

    @IsNotEmpty()
    @IsString()
    template: string;

    @IsNotEmpty()
    @IsString()
    region: string;

    @IsNotEmpty()
    @IsDateString()
    created_at: Date;

    @IsNotEmpty()
    @IsDateString()
    updated_at: Date;
}

export class HMSCreateRoomDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description: string;
}