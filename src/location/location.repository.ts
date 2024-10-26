import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Country } from "src/core/schemas/country.schema";
import { CountryDto } from "./dto/country.dto";
import { State } from "src/core/schemas/state.schema";
import { City } from "src/core/schemas/city.schema";
import { transformId } from "src/core/utils/mongo-res.utils";
import { FetchStateDto } from "./dto/state.dto";
import { FetchCityDto } from "./dto/city.dto";

@Injectable()
export class LocationRepository {
    constructor(
        @InjectModel(Country.name) private countryModel: Model<Country>,
        @InjectModel(State.name) private stateModel: Model<State>,
        @InjectModel(City.name) private cityModel: Model<City>,
    ) { }

    async createCountry(countryDto: CountryDto): Promise<Country> {
        const createCountry = await new this.countryModel(countryDto);
        return createCountry.save();
    }

    async createState(stateDto): Promise<State> {
        const createState = await new this.stateModel(stateDto);
        return createState.save();
    }

    async createCity(cityDto): Promise<City> {
        const createCity = await new this.cityModel(cityDto);
        return createCity.save();
    }

    async findCountry(countryId?: string): Promise<Country[]> {
        let whereCond = {}
        if (countryId) {
            // Validate if the countryId is a valid ObjectId
            if (!Types.ObjectId.isValid(countryId)) {
                throw new HttpException('Invalid ObjectId format', HttpStatus.BAD_REQUEST);
            }

            whereCond = {
                _id: new Types.ObjectId(countryId),
            };
        }

        try {
            const country = await this.countryModel.find(whereCond).lean().exec() as unknown as Country[];
            return transformId(country);
        } catch (error) {
            return null;
        }
    }

    async findState(condition?: FetchStateDto): Promise<State[]> {
        const { _id, countryId } = condition
        if (_id && countryId) {
            if (!(Types.ObjectId.isValid(_id) || Types.ObjectId.isValid(countryId))) {
                throw new HttpException('State not found', HttpStatus.BAD_REQUEST);
            }
        }

        try {
            const state = await this.stateModel.find(condition).lean().exec() as unknown as State[];
            return transformId(state);
        } catch (error) {
            return null;
        }
    }

    async findCity(condition: FetchCityDto): Promise<City[]> {

        if (condition) {
            if ((condition?._id && !Types.ObjectId.isValid(condition?._id)) || !Types.ObjectId.isValid(condition?.stateId)) {
                throw new HttpException('City not found', HttpStatus.BAD_REQUEST);
            }
        }

        try {
            const city = await this.cityModel.find(condition).lean().exec() as unknown as City[];
            return transformId(city);
        } catch (error) {
            return null;
        }
    }

    async searchCityNamesLike(keyword, limit = 10) {
        const res = await this.cityModel.find({ name: { $regex: keyword, $options: 'i' } })
            .limit(limit)
            .lean();
        return transformId(res);
    }
}
