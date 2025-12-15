import Review from '../models/reviewModel.js';
import AppError from '../utils/AppError.js';

// קבלת ביקורות פעילות (לאתר הרגיל)
export const getActiveReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ active: true }).sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', data: { reviews } });
  } catch (error) {
    next(error);
  }
};

// קבלת כל הביקורות (למנהל)
export const getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', data: { reviews } });
  } catch (error) {
    next(error);
  }
};

// יצירת ביקורת
export const createReview = async (req, res, next) => {
  try {
    const newReview = await Review.create(req.body);
    res.status(201).json({ status: 'success', data: { review: newReview } });
  } catch (error) {
    next(error);
  }
};

// מחיקת ביקורת
export const deleteReview = async (req, res, next) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};