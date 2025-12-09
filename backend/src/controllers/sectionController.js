const Section = require('../models/Section');
const User = require('../models/User');

/**
 * List sections for a department (optionally filtered by year)
 */
exports.list = async (req, res, next) => {
  try {
    const { deptId } = req.params;
    const { year, page = 1, limit = 20 } = req.query;

    const query = { department: deptId };
    if (year) query.yearOfStudy = parseInt(year, 10);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sections = await Section.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ name: 1 });

    const total = await Section.countDocuments(query);

    res.json({
      sections,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get distinct sections from students AND Section collection
 * Returns all sections (from students + from Section collection)
 */
exports.getDistinct = async (req, res, next) => {
  try {
    const { deptId } = req.params;
    const { year } = req.query;

    // Get sections from Section collection
    const query = { department: deptId };
    if (year) query.yearOfStudy = parseInt(year, 10);
    
    const dbSections = await Section.find(query).select('name');
    const dbSectionNames = dbSections.map(s => s.name);

    // Also get distinct sections from students (in case they exist but not in Section collection)
    const studentQuery = { role: 'student', department: deptId, section: { $exists: true, $ne: null } };
    if (year) studentQuery.yearOfStudy = parseInt(year, 10);

    const studentSections = await User.distinct('section', studentQuery);

    // Merge and deduplicate
    const allSections = [...new Set([...dbSectionNames, ...studentSections])].sort();

    res.json({
      sections: allSections
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new section
 */
exports.create = async (req, res, next) => {
  try {
    const { deptId } = req.params;
    const { name, yearOfStudy, capacity } = req.body;
    const user = req.user;

    if (!name) {
      return res.status(400).json({ error: 'Section name required' });
    }

    // HOD can only create sections for their own department
    if (user.role === 'hod') {
      const userDeptId = typeof user.department === 'string' 
        ? user.department 
        : (user.department?._id || user.departmentId);
      
      // Convert both to strings for comparison
      if (String(userDeptId) !== String(deptId)) {
        return res.status(403).json({ 
          error: 'You can only manage sections for your own department' 
        });
      }
    }

    const section = new Section({
      department: deptId,
      name,
      yearOfStudy,
      capacity
    });

    await section.save();

    res.status(201).json({
      ok: true,
      section: section.toObject()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a section
 */
exports.update = async (req, res, next) => {
  try {
    const { deptId, sectionId } = req.params;
    const { name, yearOfStudy, capacity } = req.body;
    const user = req.user;

    // HOD can only update sections for their own department
    if (user.role === 'hod') {
      const userDeptId = typeof user.department === 'string' 
        ? user.department 
        : (user.department?._id || user.departmentId);
      
      // Convert both to strings for comparison
      if (String(userDeptId) !== String(deptId)) {
        return res.status(403).json({ 
          error: 'You can only manage sections for your own department' 
        });
      }
    }

    const section = await Section.findOneAndUpdate(
      { _id: sectionId, department: deptId },
      { name, yearOfStudy, capacity },
      { new: true }
    );

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    res.json({
      ok: true,
      section: section.toObject()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a section
 */
exports.delete = async (req, res, next) => {
  try {
    const { deptId, sectionId } = req.params;
    const user = req.user;

    // HOD can only delete sections for their own department
    if (user.role === 'hod') {
      const userDeptId = typeof user.department === 'string' 
        ? user.department 
        : (user.department?._id || user.departmentId);
      
      // Convert both to strings for comparison
      if (String(userDeptId) !== String(deptId)) {
        return res.status(403).json({ 
          error: 'You can only manage sections for your own department' 
        });
      }
    }

    const section = await Section.findOneAndDelete({ _id: sectionId, department: deptId });

    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
};
