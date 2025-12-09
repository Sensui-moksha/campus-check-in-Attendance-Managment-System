const bcrypt = require('bcrypt');
const User = require('../models/User');
const Department = require('../models/Department');
const Course = require('../models/Course');
const ClassSession = require('../models/ClassSession');
const Attendance = require('../models/Attendance');
const config = require('../config');

/**
 * Hash password utility for seeding
 */
const hashPassword = async (password) => {
  return bcrypt.hash(password, config.BCRYPT_SALT_ROUNDS || 12);
};

/**
 * Seed script to populate database with initial data
 */
const seed = async () => {
  try {
    console.log('🌱 Seeding database...');

    // Clear existing users and sessions if FORCE_SEED is true
    if (process.env.FORCE_SEED === 'true') {
      console.log('🗑️  Clearing existing data...');
      await User.deleteMany({ role: { $in: ['admin', 'principal', 'hod', 'teacher', 'student'] } });
      await Department.deleteMany({});
      await Course.deleteMany({});
      console.log('✓ Cleared old data');
    }

    // Create departments
    const departments = await Department.insertMany([
      { name: 'CSE', programmes: ['B.Tech'] },
      { name: 'ECE', programmes: ['B.Tech'] },
      { name: 'ME', programmes: ['B.Tech'] },
      { name: 'CE', programmes: ['B.Tech'] }
    ], { ordered: false }).catch(() => Department.find({}));

    console.log(`✓ ${departments.length} departments created`);

    // Create admin and principal with pre-hashed passwords
    const admin = await User.findOne({ email: 'admin@college.edu' }) || 
      await User.create({
        name: 'Super Admin',
        email: 'admin@college.edu',
        passwordHash: await hashPassword('Admin@123'),
        role: 'admin'
      });

    const principal = await User.findOne({ email: 'principal@college.edu' }) || 
      await User.create({
        name: 'Principal',
        email: 'principal@college.edu',
        passwordHash: await hashPassword('Principal@123'),
        role: 'principal'
      });

    console.log('✓ Admin and Principal created');

    // Create HODs for each department
    const hods = [];
    for (const dept of departments) {
      let hod = await User.findOne({ email: `hod_${dept.name}@college.edu` });
      if (!hod) {
        hod = await User.create({
          name: `HOD ${dept.name}`,
          email: `hod_${dept.name}@college.edu`,
          passwordHash: await hashPassword('HOD@123'),
          role: 'hod',
          department: dept._id
        });
      }
      hods.push(hod);
    }

    console.log(`✓ ${hods.length} HODs created`);

    // Create teachers
    const teachers = [];
    for (const dept of departments) {
      for (let i = 1; i <= 3; i++) {
        let teacher = await User.findOne({ email: `teacher_${dept.name}_${i}@college.edu` });
        if (!teacher) {
          teacher = await User.create({
            name: `Prof. ${dept.name} Teacher ${i}`,
            email: `teacher_${dept.name}_${i}@college.edu`,
            passwordHash: await hashPassword('Teacher@123'),
            role: 'teacher',
            department: dept._id
          });
        }
        teachers.push(teacher);
      }
    }

    console.log(`✓ ${teachers.length} teachers created`);

    // Create students (batch or individual based on count)
    const batches = [2022, 2023, 2024, 2025];
    const hashedPassword = await hashPassword('Student@123');
    let studentCount = 0;

    for (const dept of departments) {
      for (const batch of batches) {
        const yearOfStudy = new Date().getFullYear() - batch;
        if (yearOfStudy < 1 || yearOfStudy > 4) continue;

        for (let i = 1; i <= 30; i++) {
          const rollNo = `${batch}_${dept.name}_${String(i).padStart(3, '0')}`;
          
          // Check if student already exists
          const existing = await User.findOne({ rollNo });
          if (!existing) {
            await User.create({
              name: `Student ${rollNo}`,
              rollNo,
              passwordHash: hashedPassword,
              role: 'student',
              department: dept._id,
              programme: 'B.Tech',
              batchYear: batch,
              yearOfStudy,
              semester: yearOfStudy * 2 - 1
            });
            studentCount++;
          }
        }
      }
    }

    console.log(`✓ ${studentCount} new students created`);

    // Create sample students with emails for testing
    const sampleStudents = [
      { email: 'student1@college.edu', rollNo: '2025_CSE_S001', name: 'Sample Student 1' },
      { email: 'student2@college.edu', rollNo: '2025_CSE_S002', name: 'Sample Student 2' },
      { email: 'student3@college.edu', rollNo: '2024_ECE_S001', name: 'Sample Student 3' }
    ];

    for (const student of sampleStudents) {
      let existing = await User.findOne({ $or: [{ email: student.email }, { rollNo: student.rollNo }] });
      if (!existing) {
        await User.create({
          name: student.name,
          email: student.email,
          rollNo: student.rollNo,
          passwordHash: hashedPassword,
          role: 'student',
          department: departments[0]._id,
          programme: 'B.Tech',
          batchYear: 2025,
          yearOfStudy: 1,
          semester: 1
        });
      }
    }

    console.log(`✓ Sample students created`);

    // Create sample courses (batch create)
    // COMMENTED OUT - Comment this back in if you want to seed mock courses
    /*
    const coursesToCreate = [];
    for (const dept of departments) {
      for (let year = 1; year <= 4; year++) {
        for (let sem of [1, 2]) {
          const semester = year * 2 - (2 - sem);
          coursesToCreate.push({
            code: `${dept.name}${year}${sem}01`,
            name: `Course ${dept.name} Year ${year} Sem ${semester}`,
            department: dept._id,
            yearOfStudy: year,
            semester,
            programmes: ['B.Tech'],
            eligibleBatches: batches.filter(b => new Date().getFullYear() - b === year),
            teacher: teachers[0]._id
          });
        }
      }
    }

    // Batch create courses
    try {
      await Course.insertMany(coursesToCreate, { ordered: false }).catch(() => {
        console.log('(Some courses already existed)');
      });
    } catch (err) {
      console.log('(Bulk course creation completed with some duplicates)');
    }

    console.log(`✓ ${coursesToCreate.length} courses created`);
    */
    console.log(`✓ Course seeding skipped (commented out)`);

    console.log('✅ Database seeding complete!');
    console.log('\n📝 Test Credentials:');
    console.log(`  Admin: admin@college.edu / Admin@123`);
    console.log(`  Principal: principal@college.edu / Principal@123`);
    console.log(`  HOD: hod_cse@college.edu / HOD@123`);
    console.log(`  Teacher: teacher_cse_1@college.edu / Teacher@123`);
    console.log(`  Student: 2025_CSE_001 / Student@123`);

  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    throw error;
  }
};

module.exports = seed;
