import mongoose from 'mongoose';
import { environment } from './environment.js';

mongoose.set('bufferCommands', false);

export async function connectDatabase() {
  await mongoose.connect(environment.mongodbUri, {
    serverSelectionTimeoutMS: 5000,
    bufferCommands: false,
  });
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
