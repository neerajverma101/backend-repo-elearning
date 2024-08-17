import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class DoubtQuestion extends Document { 

  @Prop({ type: Types.ObjectId, ref: 'Doubt', required: true })
  doubtId: Types.ObjectId;

  @Prop({ type: String, required: true })
  questionText: string;
}

export const DoubtQuestionSchema = SchemaFactory.createForClass(DoubtQuestion);
