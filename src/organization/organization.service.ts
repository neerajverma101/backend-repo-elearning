import { Injectable } from "@nestjs/common";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { OrganizationRepository } from "./repository/organization.repository";

@Injectable()
export class OrganizationService{

    constructor(private readonly organizationRepository: OrganizationRepository){}

    async create(createOrganizationDto: CreateOrganizationDto){
        return this.organizationRepository.create(createOrganizationDto);
    }

    async findAll(){}

    async findOne(){}
    
    async update(id, updateOrganizationDto: UpdateOrganizationDto){}

    async remove(){}

}