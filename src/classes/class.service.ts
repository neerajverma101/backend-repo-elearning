import { Injectable } from "@nestjs/common";
import { ClassRepository } from "./repository/class.repository";
import { ClassDto, UpdateClassDto } from "./dto/class.dto";
import { GetClassQueryDto } from "./dto/get-class-query.dto";
import { Class } from "src/core/schemas/class.schema";

@Injectable()
export class ClassService {
    constructor(private classRepository: ClassRepository) { }

    async create(classDto: ClassDto) {
        return await this.classRepository.create(classDto);
    }

    async fetchClass(condition: GetClassQueryDto): Promise<Class[]> {
        return await this.classRepository.fetchClassDetails(condition);
    }

    async deleteClass(id: string): Promise<Class[]> {
        await this.classRepository.deleteClass(id);
    }

    async update(updateClassDto: UpdateClassDto) {
        return await this.classRepository.updateClass(updateClassDto);
    }
}