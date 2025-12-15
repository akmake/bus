import Lead from '../models/leadModel.js';
import SiteContent from '../models/siteContentModel.js';
import Visit from '../models/visitModel.js';
import AppError from '../utils/AppError.js';

// --- לידים ---

// יצירת ליד (פומבי - מהאתר)
export const createLead = async (req, res, next) => {
  try {
    const newLead = await Lead.create(req.body);
    res.status(201).json({
      status: 'success',
      data: { lead: newLead }
    });
  } catch (error) {
    next(error);
  }
};

// קבלת כל הלידים (למנהל בלבד)
export const getAllLeads = async (req, res, next) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.status(200).json({
      status: 'success',
      results: leads.length,
      data: { leads }
    });
  } catch (error) {
    next(error);
  }
};

// עדכון סטטוס ליד (למנהל)
export const updateLeadStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const lead = await Lead.findByIdAndUpdate(req.params.id, { status, note }, {
      new: true,
      runValidators: true
    });

    if (!lead) {
      return next(new AppError('לא נמצא ליד עם המזהה הזה', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { lead }
    });
  } catch (error) {
    next(error);
  }
};

// --- תוכן האתר (CMS) ---

// קבלת כל התוכן (פומבי + מנהל)
export const getContent = async (req, res, next) => {
  try {
    const contentList = await SiteContent.find({});
    // המרה לאובייקט נוח: { key: value }
    const contentMap = contentList.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    res.status(200).json({
      status: 'success',
      data: contentMap
    });
  } catch (error) {
    next(error);
  }
};

// עדכון תוכן (למנהל)
export const updateContent = async (req, res, next) => {
  try {
    const { key, value } = req.body;
    const updatedContent = await SiteContent.findOneAndUpdate(
      { key },
      { value },
      { new: true, upsert: true } // אם לא קיים - ייצור חדש
    );

    res.status(200).json({
      status: 'success',
      data: { content: updatedContent }
    });
  } catch (error) {
    next(error);
  }
};

// --- סטטיסטיקה ---

// מעקב כניסה (פומבי - נקרא בעליית האתר)
export const trackVisit = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // "2025-12-15"
    await Visit.findOneAndUpdate(
      { date: today },
      { $inc: { count: 1 } },
      { upsert: true }
    );
    res.status(200).json({ status: 'success' });
  } catch (error) {
    // לא נרצה להפיל את האתר בגלל שגיאת סטטיסטיקה
    console.error('Visit tracking error:', error);
    res.status(200).send(); 
  }
};

// קבלת נתונים לגרף (למנהל)
export const getStats = async (req, res, next) => {
  try {
    // שליפת 7 הימים האחרונים
    const stats = await Visit.find().sort({ date: -1 }).limit(7);
    res.status(200).json({
      status: 'success',
      data: { stats: stats.reverse() }
    });
  } catch (error) {
    next(error);
  }
};