import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [lon, lat]
      required: true,
      validate: {
        validator: (value) =>
          Array.isArray(value) &&
          value.length === 2 &&
          Number.isFinite(value[0]) &&
          Number.isFinite(value[1]),
        message: 'Location coordinates must be [lon, lat]',
      },
    },
  },
  { _id: false }
);

const busStopSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lon: {
      type: Number,
      required: true,
    },
    location: {
      type: pointSchema,
      required: true,
    },
    lastSyncedAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

busStopSchema.index({ location: '2dsphere' });

const BusStop = mongoose.model('BusStop', busStopSchema);

export default BusStop;
