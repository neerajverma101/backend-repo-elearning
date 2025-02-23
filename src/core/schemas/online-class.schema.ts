import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { BaseSchema, BaseSchemaOptions } from './base.schema';
import { Branch } from './branch.schema';
import { Class } from './class.schema';
import { Auth } from './auth.schema';
import { Teacher } from './teacher.schema';
import { TeacherRoutes } from 'src/teachers/teacher.routes';

@BaseSchemaOptions()
export class OnlineClass extends BaseSchema {

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true })
  branchId: Branch;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, formControl: { name: 'autosuggest', label: 'Class', apiDetails: { endpoint: '/api/class/fetch', method: 'POST', body: {}, resultKey: 'className', onMount: true } } })
  classId: Class;

  @Prop({ type: String, required: true, formControl: { name: 'input', label: "Title", required: true } })
  title: string;

  @Prop({ type: String, formControl: { name: 'textarea', label: "Description" } })
  description?: string;

  @Prop({ type: Date, required: true, formControl: { name: 'datePicker', label: "Schedule Date", required: true } })
  scheduledDate: Date;

  @Prop({ type: String, required: true, formControl: { name: 'timePicker', label: "Start Time", required: true } })
  startTime: string;

  @Prop({ type: String, required: true, formControl: { name: 'timePicker', label: "End Time", required: true } })
  endTime: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Auth' })
  createdBy?: Auth;

  @Prop({
    type: mongoose.Schema.Types.ObjectId, ref: 'Auth', formControl: {
      name: 'autosuggest',
      label: 'Hosted By',
      apiDetails: {
        endpoint: TeacherRoutes.FETCH_TEACHER,
        onMount: true,
        resultKey: 'fullName'
      }
    }
  })
  teacherId?: Auth;

  @Prop({
    type: {
      id: { type: String, required: true },
      app_id: { type: String, required: true },
      customer: { type: String, required: true },
      customer_id: { type: String, required: true },
      name: { type: String, required: true },
      description: { type: String },
      enabled: { type: Boolean, required: true },
      created_at: { type: Date, required: true },
    },
    required: true,
  })
  hmsRoomInfo: {
    id: string;
    app_id: string;
    customer: string;
    customer_id: string;
    name: string;
    description: string;
    enabled: boolean;
    created_at: Date;
  };

  @Prop({ type: String, })
  thumbnail?: string;
}

export const OnlineClassSchema = SchemaFactory.createForClass(OnlineClass);
