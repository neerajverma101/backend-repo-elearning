import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Organization } from "src/core/schemas/organization.schema";
import { CreateOrganizationDto } from "../dto/create-organization.dto";
import { UpdateOrganizationDto } from "../dto/update-organization.dto";

@Injectable()
export class OrganizationRepository{
    constructor(@InjectModel(Organization.name) private organizationModel: Model<Organization>) {}
    
    async create(createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
        const createdOrganization = new this.organizationModel(createOrganizationDto);
        return createdOrganization.save();
      }
    
      async findAll(): Promise<Organization[]> {
        return this.organizationModel.find().exec();
      }
    
      async findOne(id: string): Promise<Organization> {
        return this.organizationModel.findById(id).exec();
      }
    
      async update(id: string, updateOrganizationDto: UpdateOrganizationDto): Promise<Organization> {
        return this.organizationModel.findByIdAndUpdate(id, updateOrganizationDto, { new: true }).exec();
      }
    
      async remove(id: string): Promise<Organization> {
        return this.organizationModel.findByIdAndDelete(id).exec();
      }
}