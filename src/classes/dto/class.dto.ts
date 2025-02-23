import { IsNotEmpty, IsString, IsOptional, IsMongoId } from "class-validator";
import { Types } from "mongoose";

export class ClassDto {
    @IsOptional()
    @IsMongoId()
    branchId: Types.ObjectId;

    @IsNotEmpty()
    @IsString()
    className: string;

    @IsOptional()
    @IsString()
    schedule?: string;

    constructor(partial: Partial<ClassDto>) {
        Object.assign(this, partial);
    }
}

export class UpdateClassDto extends ClassDto {
    @IsNotEmpty()
    @IsMongoId()
    _id: Types.ObjectId;
}