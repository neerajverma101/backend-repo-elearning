import { ConflictException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Organization } from "src/core/schemas/organization.schema";
import { GetOrganizationQueryDto } from "../dto/create-organization.dto";
import { UpdateOrganizationDto } from "../dto/update-organization.dto";
import { OrganizationType } from "src/core/schemas/organization-type.schema";
import { transformId } from "src/core/utils/mongo-res.utils";
import { OrganizationWithDetails } from "src/core/interface/organization.interface";
import { Branch } from "src/core/schemas/branch.schema";
import { UserTypeEnum } from "src/core/enums/user-type.enum";
import { UserRepository } from "src/users/repository/user.repository";

@Injectable()
export class OrganizationRepository {
  constructor(
    @InjectModel(Organization.name) private organizationModel: Model<Organization>,
    @InjectModel(OrganizationType.name) private organizationTypeModel: Model<OrganizationType>,
    @InjectModel(Branch.name) private branchModel: Model<Branch>,
    private userRepository: UserRepository
  ) { }

  async create(createOrganizationDto): Promise<string> {

    const session = await this.organizationModel.db.startSession();
    session.startTransaction();

    try {
      const { password, ...organizationData } = createOrganizationDto;
      const organization = await this.organizationModel.create([organizationData], { session });

      const branchData = {
        organizationId: organization[0]._id.toString(),
        name: organizationData.name,
        address: organizationData.address,
        countryId: organizationData.countryId,
        stateId: organizationData.stateId,
        cityId: organizationData.cityId,
        pincode: organizationData.pincode,
        email: organizationData.email,
        phone: organizationData.phone
      };

      const branch = await this.branchModel.create([branchData], { session });

      const authData = {
        userId: organization[0]._id.toString(),
        username: organization[0].email,
        name: organization[0].name,
        password: password,
        isVerified: false,
        userType: UserTypeEnum.ORG_ADMIN,
        branchId: branch[0]._id.toString(),
        organizationId: organization[0]._id.toString()
      }

      await this.userRepository.createAuth(authData, session);

      await session.commitTransaction();

      return organization[0]._id.toString();

    } catch (error) {
      await session.abortTransaction();

      if (error.code === 11000) { // MongoDB duplicate key error code
        throw new ConflictException('Organization ID already exists');
      }
      throw error;
    } finally {
      session.endSession();
    }
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

  async createOrganizationType(organizationType: string): Promise<OrganizationType> {
    const createOrganizationType = await new this.organizationTypeModel(organizationType);
    return createOrganizationType.save();
  }

  async fetchOrganizationType() {
    const orgType = await this.organizationTypeModel.find().lean().exec() as unknown as OrganizationType[];
    return transformId(orgType);
  }

  async findOrganization(condition: GetOrganizationQueryDto): Promise<Organization[]> {
    try {
      const organization = await this.organizationModel.find(condition).lean().exec() as unknown as Organization[];
      return transformId(organization);
    } catch (error) {
      return null;
    }
  }

  async countOrganizations(condition: GetOrganizationQueryDto): Promise<number> {
    try {
      const count: number = await this.organizationModel.countDocuments(condition).exec();
      return count;
    } catch (error) {
      // Optionally handle the error, log it, or rethrow it
      console.error('Error counting organizations:', error);
      throw new Error('Error counting organizations');
    }
  }

  async fetchOrganizationWithDetails(condition: GetOrganizationQueryDto): Promise<any> {
    try {

      const result: OrganizationWithDetails[] = await this.organizationModel.aggregate([
        { $match: { ...condition } },
        {
          $lookup: {
            from: 'organizationtypes',
            localField: 'organizationTypeId',
            foreignField: '_id',
            as: 'organizationtype'
          }
        },
        { $unwind: { path: '$organizationtype', preserveNullAndEmptyArrays: true } },
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
            name: 1,
            address: 1,
            pincode: 1,
            email: 1,
            phone: 1,
            organiZationType: {
              _id: '$organizationtype._id',
              name: '$organizationtype.name'
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
            }
          }
        }
      ]).exec();

      return result.length > 0 ? JSON.parse(JSON.stringify(result, null, 2)) : null;
    } catch (error) {
      console.error('Error fetching organization with details:', error);
      throw new Error('Error fetching organization with details');
    }
  }

}
